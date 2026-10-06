import fs from 'fs';
import path from 'path';
import comms_1 from '../comms/index.js';
import * as rooms_1 from './rooms.js';

/**
 * roomFiles.ts - Read-only room projection over the existing filesystem inbox.
 *
 * This is the bridge/web UI service core for room list + history endpoints. It
 * does not introduce a second durable message store; it projects current inbox
 * JSON plus the existing per-agent _state files into room records/summaries.
 */
Object.defineProperty(exports, "__esModule", { value: true });

const fsPromises = fs.promises;
const DEFAULT_HISTORY_LIMIT = 100;
const DEFAULT_SUMMARY_LIMIT = 500;
const MAX_LIMIT = 500;
async function readRoomMessageRecords(commsDir, options) {
    const participantId = path.basename(options.participantId);
    const inboxIds = normalizeInboxIds(participantId, options);
    const limit = normalizeLimit(options.limit, DEFAULT_HISTORY_LIMIT);
    const records = [];
    const seenMessageIds = new Set();
    for (const inboxId of inboxIds) {
        for (const candidate of await readInboxJsonFiles(commsDir, inboxId)) {
            const message = parseMessage(candidate.content);
            if (!message || seenMessageIds.has(message.id)) {
                continue;
            }
            const room_id = safeRoomIdForMessage(message);
            if (!room_id) {
                continue;
            }
            if (options.roomId && room_id !== options.roomId) {
                continue;
            }
            const state = await (0, comms_1.readMessageState)(commsDir, participantId, message.id);
            if (state?.archived_at && !options.includeArchived) {
                continue;
            }
            seenMessageIds.add(message.id);
            records.push({
                inbox_id: inboxId,
                filename: candidate.filename,
                file_path: candidate.file_path,
                room_id,
                message,
                state,
            });
        }
    }
    records.sort((a, b) => compareRecords(a, b, options.order ?? 'desc'));
    return records.slice(0, limit);
}
async function readRoomSummariesFromComms(commsDir, options) {
    const records = await readRoomMessageRecords(commsDir, {
        ...options,
        limit: normalizeLimit(options.messageLimit ?? options.limit, DEFAULT_SUMMARY_LIMIT),
        order: 'desc',
    });
    const stateReceipts = records
        .filter((record) => {
        return typeof record.state?.read_at === 'string' && record.state.read_at.length > 0;
    })
        .map(record => ({
        room_id: record.room_id,
        participant_id: path.basename(options.participantId),
        msg_id: record.message.id,
        read_at: record.state.read_at,
    }));
    return (0, rooms_1.buildRoomSummaries)({
        participant_id: path.basename(options.participantId),
        messages: records.map(record => record.message),
        rooms: options.rooms,
        receipts: [...(options.receipts ?? []), ...stateReceipts],
        activities: options.activities,
        now: options.now,
    });
}
function normalizeInboxIds(participantId, options) {
    const ids = options.inboxIds && options.inboxIds.length > 0
        ? options.inboxIds
        : [participantId, ...(options.includeShared === false ? [] : ['shared'])];
    const normalized = [];
    const seen = new Set();
    for (const id of ids.map(value => path.basename(value)).filter(Boolean)) {
        if (seen.has(id)) {
            continue;
        }
        seen.add(id);
        normalized.push(id);
    }
    return normalized;
}
function normalizeLimit(value, fallback) {
    if (value === undefined) {
        return fallback;
    }
    if (!Number.isFinite(value)) {
        return fallback;
    }
    return Math.max(0, Math.min(MAX_LIMIT, Math.trunc(value)));
}
async function readInboxJsonFiles(commsDir, inboxId) {
    const inboxDir = path.join(commsDir, 'inboxes', path.basename(inboxId));
    try {
        const entries = await fsPromises.readdir(inboxDir, { withFileTypes: true });
        const files = entries
            .filter(entry => entry.isFile() && entry.name.endsWith('.json'))
            .map(entry => entry.name)
            .sort((a, b) => a.localeCompare(b));
        const results = [];
        for (const filename of files) {
            const file_path = path.join(inboxDir, filename);
            try {
                results.push({
                    filename,
                    file_path,
                    content: (await fsPromises.readFile(file_path, 'utf8')).replace(/^\uFEFF/, ''),
                });
            }
            catch {
                // Skip unreadable files; the inbox protocol is best-effort.
            }
        }
        return results;
    }
    catch {
        return [];
    }
}
function parseMessage(content) {
    try {
        const parsed = JSON.parse(content);
        if (typeof parsed.id !== 'string' ||
            typeof parsed.from !== 'string' ||
            typeof parsed.to !== 'string' ||
            typeof parsed.type !== 'string' ||
            typeof parsed.timestamp !== 'string' ||
            !Number.isFinite(Date.parse(parsed.timestamp)) ||
            typeof parsed.requires_response !== 'boolean' ||
            typeof parsed.payload !== 'object' ||
            parsed.payload === null ||
            Array.isArray(parsed.payload)) {
            return null;
        }
        return parsed;
    }
    catch {
        return null;
    }
}
function safeRoomIdForMessage(message) {
    try {
        return (0, rooms_1.roomIdForMessage)(message);
    }
    catch {
        return null;
    }
}
function compareRecords(a, b, order) {
    const aTime = Date.parse(a.message.timestamp);
    const bTime = Date.parse(b.message.timestamp);
    const direction = order === 'asc' ? 1 : -1;
    return direction * (aTime - bTime)
        || direction * a.message.id.localeCompare(b.message.id)
        || a.inbox_id.localeCompare(b.inbox_id)
        || a.filename.localeCompare(b.filename);
}
//# sourceMappingURL=roomFiles.js.map

export { readRoomMessageRecords as readRoomMessageRecords, readRoomSummariesFromComms as readRoomSummariesFromComms };

/**
 * rooms.ts - Pure room/read/activity model for the comms layer.
 *
 * The filesystem inbox remains the transport. Rooms are an additive projection:
 * existing messages can opt in with payload.room_id, and older messages are
 * deterministically assigned to general, sprint, task, or DM rooms.
 */
Object.defineProperty(exports, "__esModule", { value: true });

const ROOM_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:+-]{0,127}$/;
function sanitizeRoomComponent(value, fallback = 'unknown') {
    const raw = String(value ?? '').trim();
    const cleaned = raw
        .replace(/[^A-Za-z0-9._-]+/g, '-')
        .replace(/^[._-]+|[._-]+$/g, '')
        .slice(0, 80);
    return cleaned || fallback;
}
function assertValidRoomId(roomId) {
    if (!ROOM_ID_PATTERN.test(roomId) || roomId.includes('..')) {
        throw new Error(`Invalid room_id: ${roomId}`);
    }
}
function roomIdToPathSegment(roomId) {
    assertValidRoomId(roomId);
    return encodeURIComponent(roomId);
}
function defineGeneralRoom(createdAt) {
    return {
        room_id: 'general',
        kind: 'general',
        title: 'General',
        visibility: 'project',
        ...(createdAt ? { created_at: createdAt } : {}),
    };
}
function roomIdForTask(taskId) {
    return `task:${sanitizeRoomComponent(taskId)}`;
}
function roomIdForSprint(sprint) {
    return `sprint:${sanitizeRoomComponent(sprint)}`;
}
function roomIdForDm(a, b) {
    const parts = [sanitizeRoomComponent(a), sanitizeRoomComponent(b)].sort((x, y) => x.localeCompare(y));
    return `dm:${parts.join('+')}`;
}
function roomIdForMessage(message) {
    const payloadRoom = typeof message.payload?.room_id === 'string' ? message.payload.room_id : '';
    if (payloadRoom) {
        assertValidRoomId(payloadRoom);
        return payloadRoom;
    }
    if (message.task_id) {
        return roomIdForTask(message.task_id);
    }
    if (message.to && message.to !== 'shared' && message.to !== 'all' && message.from) {
        return roomIdForDm(message.from, message.to);
    }
    if (message.sprint !== undefined) {
        return roomIdForSprint(message.sprint);
    }
    return 'general';
}
function defaultRoomForMessage(message) {
    const room_id = roomIdForMessage(message);
    if (room_id === 'general') {
        return defineGeneralRoom();
    }
    if (room_id.startsWith('task:')) {
        return {
            room_id,
            kind: message.type === 'review_request' || message.type === 'review_response' ? 'review' : 'task',
            title: message.task_id ? `Task ${message.task_id}` : room_id,
            visibility: 'project',
            ...(message.task_id ? { task_id: message.task_id } : {}),
            ...(message.sprint !== undefined ? { sprint: message.sprint } : {}),
        };
    }
    if (room_id.startsWith('sprint:')) {
        return {
            room_id,
            kind: 'sprint',
            title: `Sprint ${message.sprint ?? room_id.slice('sprint:'.length)}`,
            visibility: 'project',
            ...(message.sprint !== undefined ? { sprint: message.sprint } : {}),
        };
    }
    if (room_id.startsWith('dm:')) {
        return {
            room_id,
            kind: message.from === 'human' || message.to === 'human' ? 'human_dm' : 'agent_dm',
            title: room_id.slice('dm:'.length).split('+').join(' / '),
            visibility: 'private',
            participants: room_id.slice('dm:'.length).split('+'),
        };
    }
    return {
        room_id,
        kind: 'system',
        title: room_id,
        visibility: 'project',
    };
}
function activityExpiresAt(updatedAt, ttlMs = 12000) {
    const base = toTime(updatedAt);
    return new Date(base + ttlMs).toISOString();
}
function shouldWakeParticipant(message, participantId) {
    if (message.from === participantId && message.payload?.wake_self !== true) {
        return { wake: false, reason: 'none' };
    }
    if (message.to === participantId) {
        return { wake: true, reason: 'direct' };
    }
    const mentions = Array.isArray(message.payload?.mentions)
        ? message.payload.mentions.filter((m) => typeof m === 'string')
        : [];
    if (mentions.includes(participantId) || mentions.includes('all')) {
        return { wake: true, reason: 'mention' };
    }
    const room_id = roomIdForMessage(message);
    if (dmRoomContains(room_id, participantId)) {
        return { wake: true, reason: 'dm_room' };
    }
    if (message.requires_response && (message.to === 'shared' || message.to === 'all')) {
        return { wake: true, reason: 'requires_response' };
    }
    return { wake: false, reason: 'none' };
}
function buildRoomSummaries(input) {
    const nowMs = input.now === undefined ? Date.now() : toTime(input.now);
    const rooms = new Map();
    const lastReadByRoom = new Map();
    const readMessageIds = new Set();
    for (const room of input.rooms ?? []) {
        assertValidRoomId(room.room_id);
        rooms.set(room.room_id, normalizeRoom(room));
    }
    for (const receipt of input.receipts ?? []) {
        if (receipt.participant_id !== input.participant_id) {
            continue;
        }
        readMessageIds.add(`${receipt.room_id}\0${receipt.msg_id}`);
        const readAt = toTime(receipt.read_at);
        lastReadByRoom.set(receipt.room_id, Math.max(lastReadByRoom.get(receipt.room_id) ?? 0, readAt));
    }
    const stats = new Map();
    for (const message of input.messages) {
        const room_id = roomIdForMessage(message);
        if (!rooms.has(room_id)) {
            rooms.set(room_id, defaultRoomForMessage(message));
        }
        const stat = stats.get(room_id) ?? {
            last_message_at: null,
            unread_count: 0,
            awaiting_response_count: 0,
            participants: new Set(),
        };
        stat.participants.add(message.from);
        if (message.to && message.to !== 'shared' && message.to !== 'all') {
            stat.participants.add(message.to);
        }
        const msgAt = toTime(message.timestamp);
        if (stat.last_message_at === null || msgAt > toTime(stat.last_message_at)) {
            stat.last_message_at = message.timestamp;
        }
        const readKey = `${room_id}\0${message.id}`;
        const readByCursor = msgAt <= (lastReadByRoom.get(room_id) ?? 0);
        if (message.from !== input.participant_id && !readMessageIds.has(readKey) && !readByCursor) {
            stat.unread_count += 1;
        }
        const wake = shouldWakeParticipant(message, input.participant_id);
        if (message.requires_response && wake.wake && !readMessageIds.has(readKey)) {
            stat.awaiting_response_count += 1;
        }
        stats.set(room_id, stat);
    }
    const activeByRoom = new Map();
    for (const activity of input.activities ?? []) {
        if (activity.participant_id === input.participant_id) {
            continue;
        }
        if (toTime(activity.expires_at) <= nowMs) {
            continue;
        }
        const list = activeByRoom.get(activity.room_id) ?? [];
        list.push({
            participant_id: activity.participant_id,
            kind: activity.kind,
            ...(activity.session_id ? { session_id: activity.session_id } : {}),
        });
        activeByRoom.set(activity.room_id, list);
    }
    return [...rooms.values()].map(room => {
        const stat = stats.get(room.room_id);
        const active = (activeByRoom.get(room.room_id) ?? [])
            .sort((a, b) => a.participant_id.localeCompare(b.participant_id) || a.kind.localeCompare(b.kind));
        const participants = new Set(room.participants ?? []);
        for (const participant of stat?.participants ?? []) {
            participants.add(participant);
        }
        for (const participant of active) {
            participants.add(participant.participant_id);
        }
        return {
            room_id: room.room_id,
            kind: room.kind,
            title: room.title,
            visibility: room.visibility,
            participants: [...participants].sort((a, b) => a.localeCompare(b)),
            last_message_at: stat?.last_message_at ?? null,
            unread_count: stat?.unread_count ?? 0,
            awaiting_response_count: stat?.awaiting_response_count ?? 0,
            active_participants: active,
        };
    }).sort((a, b) => {
        const aTime = a.last_message_at ? toTime(a.last_message_at) : 0;
        const bTime = b.last_message_at ? toTime(b.last_message_at) : 0;
        return bTime - aTime || a.room_id.localeCompare(b.room_id);
    });
}
function normalizeRoom(room) {
    return {
        ...room,
        participants: room.participants ? [...new Set(room.participants)].sort((a, b) => a.localeCompare(b)) : undefined,
    };
}
function dmRoomContains(roomId, participantId) {
    if (!roomId.startsWith('dm:')) {
        return false;
    }
    const target = sanitizeRoomComponent(participantId);
    return roomId.slice('dm:'.length).split('+').includes(target);
}
function toTime(value) {
    const ms = value instanceof Date ? value.getTime() : typeof value === 'number' ? value : Date.parse(value);
    if (!Number.isFinite(ms)) {
        throw new Error(`Invalid timestamp: ${String(value)}`);
    }
    return ms;
}
//# sourceMappingURL=rooms.js.map

export { sanitizeRoomComponent as sanitizeRoomComponent, assertValidRoomId as assertValidRoomId, roomIdToPathSegment as roomIdToPathSegment, defineGeneralRoom as defineGeneralRoom, roomIdForTask as roomIdForTask, roomIdForSprint as roomIdForSprint, roomIdForDm as roomIdForDm, roomIdForMessage as roomIdForMessage, defaultRoomForMessage as defaultRoomForMessage, activityExpiresAt as activityExpiresAt, shouldWakeParticipant as shouldWakeParticipant, buildRoomSummaries as buildRoomSummaries };

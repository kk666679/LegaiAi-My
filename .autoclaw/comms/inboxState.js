"use strict";
/**
 * inboxState.ts — Inbox state machine for the AutoClaw cross-agent comms layer.
 *
 * Manages per-message state in a `_state/` subdirectory alongside each agent
 * inbox.  Backwards-compatible: absence of `_state/<msgId>.json` means the
 * message is unread and (if `requires_response` is set) awaiting reply.
 *
 * File layout:
 *   <inboxPath>/                     ← agent inbox directory
 *     <msg-filename>.json            ← raw message files
 *     _state/
 *       <msg-filename>.json          ← InboxStateEntry (this module writes here)
 *
 * Sprint 1 — A4 (WA-3)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.markRead = markRead;
exports.markReplied = markReplied;
exports.archive = archive;
exports.markForwarded = markForwarded;
exports.getState = getState;
exports.listUnread = listUnread;
exports.listAwaitingMe = listAwaitingMe;
const fs = require("fs");
const path = require("path");
const fsPromises = fs.promises;
// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------
function stateDir(inboxPath) {
    return path.join(inboxPath, '_state');
}
function stateFilePath(inboxPath, msgId) {
    return path.join(stateDir(inboxPath), `${path.basename(msgId)}.json`);
}
async function readStateFile(filePath) {
    try {
        const raw = await fsPromises.readFile(filePath, 'utf8');
        return JSON.parse(raw.replace(/^﻿/, ''));
    }
    catch {
        return null;
    }
}
async function writeStateFile(filePath, entry) {
    await fsPromises.mkdir(path.dirname(filePath), { recursive: true });
    await fsPromises.writeFile(filePath, JSON.stringify(entry, null, 2), 'utf8');
}
/** Read a message file from the inbox. Returns null if malformed or missing. */
async function readMessageFile(inboxPath, filename) {
    try {
        const raw = await fsPromises.readFile(path.join(inboxPath, filename), 'utf8');
        return JSON.parse(raw.replace(/^﻿/, ''));
    }
    catch {
        return null;
    }
}
/** List all message JSON filenames in the inbox (excludes _state/ directory). */
async function listMessageFiles(inboxPath) {
    try {
        const entries = await fsPromises.readdir(inboxPath, { withFileTypes: true });
        return entries
            .filter(e => e.isFile() && e.name.endsWith('.json'))
            .map(e => e.name);
    }
    catch {
        return [];
    }
}
// ---------------------------------------------------------------------------
// Exported API
// ---------------------------------------------------------------------------
/**
 * Mark a message as read.  Idempotent: if `read_at` is already set it will not
 * be overwritten, preserving the original timestamp.
 */
async function markRead(inboxPath, msgId) {
    const fp = stateFilePath(inboxPath, msgId);
    const existing = await readStateFile(fp);
    if (existing?.read_at) {
        return; // Already read — do not clobber the original timestamp.
    }
    const now = new Date().toISOString();
    await writeStateFile(fp, {
        msg_id: msgId,
        received_at: existing?.received_at ?? now,
        read_at: now,
        replied_at: existing?.replied_at ?? null,
        archived_at: existing?.archived_at ?? null,
        forwarded_at: existing?.forwarded_at ?? null,
    });
}
/**
 * Mark a message as replied.  Also sets `read_at` if not already set (replying
 * implies reading).
 */
async function markReplied(inboxPath, msgId) {
    const fp = stateFilePath(inboxPath, msgId);
    const existing = await readStateFile(fp);
    const now = new Date().toISOString();
    await writeStateFile(fp, {
        msg_id: msgId,
        received_at: existing?.received_at ?? now,
        read_at: existing?.read_at ?? now,
        replied_at: now,
        archived_at: existing?.archived_at ?? null,
        forwarded_at: existing?.forwarded_at ?? null,
    });
}
/**
 * Archive a message.  Does NOT automatically mark it read — callers should call
 * `markRead` first if that is the desired UX.
 */
async function archive(inboxPath, msgId) {
    const fp = stateFilePath(inboxPath, msgId);
    const existing = await readStateFile(fp);
    const now = new Date().toISOString();
    await writeStateFile(fp, {
        msg_id: msgId,
        received_at: existing?.received_at ?? now,
        read_at: existing?.read_at ?? null,
        replied_at: existing?.replied_at ?? null,
        archived_at: now,
        forwarded_at: existing?.forwarded_at ?? null,
    });
}
/**
 * Mark a message as forwarded to the cloud relay (AF-7). Idempotent: an
 * existing `forwarded_at` is preserved. Preserves all other state fields.
 */
async function markForwarded(inboxPath, msgId) {
    const fp = stateFilePath(inboxPath, msgId);
    const existing = await readStateFile(fp);
    if (existing?.forwarded_at) {
        return;
    }
    const now = new Date().toISOString();
    await writeStateFile(fp, {
        msg_id: msgId,
        received_at: existing?.received_at ?? now,
        read_at: existing?.read_at ?? null,
        replied_at: existing?.replied_at ?? null,
        archived_at: existing?.archived_at ?? null,
        forwarded_at: now,
    });
}
/**
 * Read the state for a single message.
 *
 * Returns an InboxStateEntry if a state file exists, or a synthetic entry
 * with all timestamps null (representing "unread, not replied, not archived")
 * when no state file is present (backwards-compatible).
 *
 * Returns `null` only when the message itself does not exist in the inbox.
 * Pass `strict: false` (default) to always return a state object if requested;
 * pass `strict: true` to get `null` when there is no state file.
 */
async function getState(inboxPath, msgId, options = {}) {
    const fp = stateFilePath(inboxPath, msgId);
    const existing = await readStateFile(fp);
    if (existing) {
        return existing;
    }
    if (options.strict) {
        return null;
    }
    // Backwards-compat synthetic state (no state file = unread).
    return {
        msg_id: msgId,
        received_at: new Date().toISOString(),
        read_at: null,
        replied_at: null,
        archived_at: null,
    };
}
/**
 * List all messages in the inbox where `read_at` is null.
 *
 * Backwards compatible: messages without a `_state/` file are treated as unread.
 */
async function listUnread(inboxPath) {
    const filenames = await listMessageFiles(inboxPath);
    const unread = [];
    for (const filename of filenames) {
        const msgId = filename.replace(/\.json$/, '');
        const state = await readStateFile(stateFilePath(inboxPath, msgId));
        // No state file OR read_at is null → unread.
        if (!state || !state.read_at) {
            const msg = await readMessageFile(inboxPath, filename);
            if (msg) {
                unread.push(msg);
            }
        }
    }
    return unread.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}
/**
 * List all messages that require a response from this agent and have not yet
 * been replied to.
 *
 * Criteria:
 *   - `message.requires_response === true`
 *   - state `replied_at` is null (or no state file — backwards-compat)
 *   - message is not archived
 */
async function listAwaitingMe(inboxPath) {
    const filenames = await listMessageFiles(inboxPath);
    const awaiting = [];
    for (const filename of filenames) {
        const msg = await readMessageFile(inboxPath, filename);
        if (!msg || !msg.requires_response) {
            continue;
        }
        const msgId = filename.replace(/\.json$/, '');
        const state = await readStateFile(stateFilePath(inboxPath, msgId));
        // Archived messages are not awaiting.
        if (state?.archived_at) {
            continue;
        }
        // Not replied → awaiting.
        if (!state || !state.replied_at) {
            awaiting.push(msg);
        }
    }
    return awaiting.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}
//# sourceMappingURL=inboxState.js.map
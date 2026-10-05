"use strict";
/**
 * connectorContract.ts - Local room connector manifest and write policy.
 *
 * This is the policy core for Discord/Slack/Telegram-style local connectors and
 * file-only tools. It validates what rooms/types a connector may touch before
 * any bridge/webhook endpoint accepts writes on its behalf.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRoomConnectorManifest = validateRoomConnectorManifest;
exports.connectorMayWriteRoomMessage = connectorMayWriteRoomMessage;
const rooms_1 = require("./rooms");
const CONNECTOR_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const KINDS = new Set(['discord', 'slack', 'telegram', 'webhook', 'file']);
const DIRECTIONS = new Set(['inbound', 'outbound', 'bidirectional']);
const TRUST = new Set(['observe', 'message', 'steer']);
const MESSAGE_TYPES = new Set(['room_message', 'room_activity', 'human_steer']);
function validateRoomConnectorManifest(input) {
    const issues = [];
    if (!isRecord(input)) {
        return {
            manifest: null,
            issues: [issue('error', '', 'not_object', 'Connector manifest must be an object.')],
        };
    }
    const schema_version = readLiteral(input, 'schema_version', ['1'], issues);
    const connector_id = readConnectorId(input, issues);
    const kind = readLiteral(input, 'kind', [...KINDS], issues);
    const display_name = readNonEmptyString(input, 'display_name', issues);
    const direction = readLiteral(input, 'direction', [...DIRECTIONS], issues);
    const trust_ceiling = readLiteral(input, 'trust_ceiling', [...TRUST], issues);
    const require_signature = readBoolean(input, 'require_signature', issues);
    const allowed_room_ids = readRoomAllowlist(input, issues);
    const allowed_message_types = readMessageTypes(input, issues);
    const allowed_senders = readOptionalStringList(input, 'allowed_senders', issues);
    const created_at = readOptionalIsoTime(input, 'created_at', issues);
    if (allowed_message_types.includes('human_steer') && trust_ceiling !== 'steer') {
        issues.push(issue('error', 'allowed_message_types', 'human_steer_requires_steer_trust', 'human_steer is allowed only when trust_ceiling is steer.'));
    }
    if (direction && direction !== 'outbound' && kind && kind !== 'file' && require_signature === false) {
        issues.push(issue('error', 'require_signature', 'inbound_external_requires_signature', 'Inbound external connectors must require signatures.'));
    }
    if (direction && direction !== 'outbound' && trust_ceiling === 'steer' && require_signature === false) {
        issues.push(issue('error', 'require_signature', 'steer_requires_signature', 'Connectors that can steer work must require signatures.'));
    }
    if (allowed_room_ids.includes('*') && trust_ceiling === 'steer') {
        issues.push(issue('error', 'allowed_room_ids', 'wildcard_steer_forbidden', 'Steering connectors must use explicit room allowlists.'));
    }
    if (issues.some(i => i.severity === 'error')) {
        return { manifest: null, issues };
    }
    return {
        manifest: {
            schema_version: schema_version,
            connector_id: connector_id,
            kind: kind,
            display_name: display_name,
            direction: direction,
            allowed_room_ids,
            allowed_message_types,
            trust_ceiling: trust_ceiling,
            require_signature: require_signature,
            ...(allowed_senders ? { allowed_senders } : {}),
            ...(created_at ? { created_at } : {}),
        },
        issues,
    };
}
function connectorMayWriteRoomMessage(manifest, request) {
    if (manifest.direction === 'outbound') {
        return deny('outbound_only');
    }
    if (manifest.require_signature && request.signed !== true) {
        return deny('signature_required');
    }
    if (!isAllowedRoom(manifest, request.room_id)) {
        return deny('room_not_allowed');
    }
    if (!manifest.allowed_message_types.includes(request.message_type)) {
        return deny('message_type_not_allowed');
    }
    if (!trustAllows(manifest.trust_ceiling, request.message_type)) {
        return deny('trust_ceiling_exceeded');
    }
    if (manifest.allowed_senders && request.sender_id && !manifest.allowed_senders.includes(request.sender_id)) {
        return deny('sender_not_allowed');
    }
    if (manifest.allowed_senders && !request.sender_id) {
        return deny('sender_required');
    }
    return { allowed: true, reason: 'allowed' };
}
function isAllowedRoom(manifest, roomId) {
    try {
        (0, rooms_1.assertValidRoomId)(roomId);
    }
    catch {
        return false;
    }
    return manifest.allowed_room_ids.includes('*') || manifest.allowed_room_ids.includes(roomId);
}
function trustAllows(trust, type) {
    if (trust === 'steer') {
        return true;
    }
    if (trust === 'message') {
        return type === 'room_message' || type === 'room_activity';
    }
    return false;
}
function readConnectorId(input, issues) {
    const value = readNonEmptyString(input, 'connector_id', issues);
    if (!value) {
        return null;
    }
    if (!CONNECTOR_ID_PATTERN.test(value) || value.includes('..')) {
        issues.push(issue('error', 'connector_id', 'invalid_connector_id', 'connector_id is not path-safe.'));
        return null;
    }
    return value;
}
function readLiteral(input, key, allowed, issues) {
    const value = input[key];
    if (typeof value !== 'string' || !allowed.includes(value)) {
        issues.push(issue('error', key, 'invalid_literal', `${key} must be one of: ${allowed.join(', ')}.`));
        return null;
    }
    return value;
}
function readNonEmptyString(input, key, issues) {
    const value = input[key];
    if (typeof value !== 'string' || value.trim().length === 0) {
        issues.push(issue('error', key, 'invalid_string', `${key} must be a non-empty string.`));
        return null;
    }
    return value.trim();
}
function readBoolean(input, key, issues) {
    const value = input[key];
    if (typeof value !== 'boolean') {
        issues.push(issue('error', key, 'invalid_boolean', `${key} must be boolean.`));
        return null;
    }
    return value;
}
function readRoomAllowlist(input, issues) {
    const value = input.allowed_room_ids;
    if (!Array.isArray(value) || value.length === 0) {
        issues.push(issue('error', 'allowed_room_ids', 'invalid_room_allowlist', 'allowed_room_ids must be a non-empty array.'));
        return [];
    }
    const rooms = [];
    for (const item of value) {
        if (typeof item !== 'string') {
            issues.push(issue('error', 'allowed_room_ids', 'invalid_room_id', 'Every allowed_room_ids item must be a string.'));
            continue;
        }
        const roomId = item.trim();
        if (roomId === '*') {
            rooms.push(roomId);
            continue;
        }
        try {
            (0, rooms_1.assertValidRoomId)(roomId);
            rooms.push(roomId);
        }
        catch {
            issues.push(issue('error', 'allowed_room_ids', 'invalid_room_id', `Invalid room_id: ${roomId}.`));
        }
    }
    return uniqueSorted(rooms);
}
function readMessageTypes(input, issues) {
    const value = input.allowed_message_types;
    if (!Array.isArray(value) || value.length === 0) {
        issues.push(issue('error', 'allowed_message_types', 'invalid_message_types', 'allowed_message_types must be a non-empty array.'));
        return [];
    }
    const types = [];
    for (const item of value) {
        if (typeof item !== 'string' || !MESSAGE_TYPES.has(item)) {
            issues.push(issue('error', 'allowed_message_types', 'invalid_message_type', 'Allowed connector message types are room_message, room_activity, and human_steer.'));
            continue;
        }
        types.push(item);
    }
    return uniqueSorted(types);
}
function readOptionalStringList(input, key, issues) {
    const value = input[key];
    if (value === undefined) {
        return undefined;
    }
    if (!Array.isArray(value)) {
        issues.push(issue('error', key, 'invalid_string_list', `${key} must be an array of strings.`));
        return undefined;
    }
    const items = [];
    for (const item of value) {
        if (typeof item !== 'string' || item.trim().length === 0) {
            issues.push(issue('error', key, 'invalid_string_list_item', `${key} entries must be non-empty strings.`));
            continue;
        }
        items.push(item.trim());
    }
    return uniqueSorted(items);
}
function readOptionalIsoTime(input, key, issues) {
    const value = input[key];
    if (value === undefined) {
        return undefined;
    }
    if (typeof value !== 'string' || !Number.isFinite(Date.parse(value))) {
        issues.push(issue('error', key, 'invalid_timestamp', `${key} must be an ISO timestamp.`));
        return undefined;
    }
    return value;
}
function deny(reason) {
    return { allowed: false, reason };
}
function uniqueSorted(values) {
    return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function issue(severity, path, code, message) {
    return { severity, path, code, message };
}
//# sourceMappingURL=connectorContract.js.map
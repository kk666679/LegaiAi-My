"use strict";
/**
 * wakeAdapters.ts - Host-specific wake profile table for roomed messages.
 *
 * This table is intentionally conservative: some tools can be nudged through a
 * polling loop, some only surface unread state when the human/host resumes, and
 * external connectors need explicit trust ceilings before they can steer work.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeWakeAdapterId = normalizeWakeAdapterId;
exports.wakeProfileForAdapter = wakeProfileForAdapter;
exports.listWakeAdapterProfiles = listWakeAdapterProfiles;
exports.planParticipantWakes = planParticipantWakes;
const rooms_1 = require("./rooms");
const PROFILES = [
    {
        adapter_id: 'claude-code',
        display_name: 'Claude Code',
        runtime: 'cli',
        delivery: 'inbox-file',
        wake_mode: 'poll',
        activity_mode: 'synthetic',
        trust_ceiling: 'workspace-agent',
        can_receive_room_message: true,
        can_send_room_message: true,
        can_record_read_receipts: true,
        supports_background_wake: true,
        expected_latency_ms: 30000,
        notes: ['Picked up by the slash-loop/keepalive path when the host loop is active.'],
    },
    {
        adapter_id: 'codex',
        display_name: 'Codex',
        runtime: 'desktop-app',
        delivery: 'inbox-file',
        wake_mode: 'manual',
        activity_mode: 'synthetic',
        trust_ceiling: 'workspace-agent',
        can_receive_room_message: true,
        can_send_room_message: true,
        can_record_read_receipts: true,
        supports_background_wake: false,
        expected_latency_ms: null,
        notes: ['Current local Codex lane surfaces unread work when a session is resumed or manually started.'],
    },
    {
        adapter_id: 'kiro',
        display_name: 'Kiro',
        runtime: 'ide-extension',
        delivery: 'inbox-file',
        wake_mode: 'manual',
        activity_mode: 'adapter',
        trust_ceiling: 'workspace-agent',
        can_receive_room_message: true,
        can_send_room_message: true,
        can_record_read_receipts: true,
        supports_background_wake: false,
        expected_latency_ms: null,
        notes: ['Room messages can be written to the file bus before native Kiro chat wake wiring exists.'],
    },
    {
        adapter_id: 'kilocode',
        display_name: 'Kilo Code',
        runtime: 'ide-extension',
        delivery: 'inbox-file',
        wake_mode: 'manual',
        activity_mode: 'adapter',
        trust_ceiling: 'workspace-agent',
        can_receive_room_message: true,
        can_send_room_message: true,
        can_record_read_receipts: true,
        supports_background_wake: false,
        expected_latency_ms: null,
        notes: ['Manual-start keepalive profile; do not assume immediate interruption.'],
    },
    {
        adapter_id: 'cline',
        display_name: 'Cline',
        runtime: 'ide-extension',
        delivery: 'inbox-file',
        wake_mode: 'manual',
        activity_mode: 'adapter',
        trust_ceiling: 'workspace-agent',
        can_receive_room_message: true,
        can_send_room_message: true,
        can_record_read_receipts: true,
        supports_background_wake: false,
        expected_latency_ms: null,
        notes: ['File-bus compatible, pending native room command wiring.'],
    },
    {
        adapter_id: 'continue',
        display_name: 'Continue',
        runtime: 'ide-extension',
        delivery: 'inbox-file',
        wake_mode: 'manual',
        activity_mode: 'adapter',
        trust_ceiling: 'workspace-agent',
        can_receive_room_message: true,
        can_send_room_message: true,
        can_record_read_receipts: true,
        supports_background_wake: false,
        expected_latency_ms: null,
        notes: ['File-only fallback until a host-specific chat injection adapter is available.'],
    },
    {
        adapter_id: 'cursor',
        display_name: 'Cursor',
        runtime: 'ide-extension',
        delivery: 'inbox-file',
        wake_mode: 'manual',
        activity_mode: 'adapter',
        trust_ceiling: 'workspace-agent',
        can_receive_room_message: true,
        can_send_room_message: true,
        can_record_read_receipts: true,
        supports_background_wake: false,
        expected_latency_ms: null,
        notes: ['Workspace file bus only; native chat wake requires a dedicated adapter.'],
    },
    {
        adapter_id: 'windsurf',
        display_name: 'Windsurf',
        runtime: 'ide-extension',
        delivery: 'inbox-file',
        wake_mode: 'manual',
        activity_mode: 'adapter',
        trust_ceiling: 'workspace-agent',
        can_receive_room_message: true,
        can_send_room_message: true,
        can_record_read_receipts: true,
        supports_background_wake: false,
        expected_latency_ms: null,
        notes: ['Workspace file bus only; native chat wake requires a dedicated adapter.'],
    },
    {
        adapter_id: 'gemini-cli',
        display_name: 'Gemini CLI',
        runtime: 'cli',
        delivery: 'inbox-file',
        wake_mode: 'manual',
        activity_mode: 'synthetic',
        trust_ceiling: 'workspace-agent',
        can_receive_room_message: true,
        can_send_room_message: true,
        can_record_read_receipts: true,
        supports_background_wake: false,
        expected_latency_ms: null,
        notes: ['CLI can consume the file bus once launched; this does not imply process wake.'],
    },
    {
        adapter_id: 'openclaw',
        display_name: 'OpenClaw Agent',
        runtime: 'remote-agent',
        delivery: 'bridge-http',
        wake_mode: 'push',
        activity_mode: 'adapter',
        trust_ceiling: 'workspace-agent',
        can_receive_room_message: true,
        can_send_room_message: true,
        can_record_read_receipts: true,
        supports_background_wake: true,
        expected_latency_ms: 2000,
        notes: ['Bridge-authenticated remote agents can receive immediate room wake events.'],
    },
    {
        adapter_id: 'hermes',
        display_name: 'Hermes Agent',
        runtime: 'remote-agent',
        delivery: 'bridge-http',
        wake_mode: 'push',
        activity_mode: 'adapter',
        trust_ceiling: 'workspace-agent',
        can_receive_room_message: true,
        can_send_room_message: true,
        can_record_read_receipts: true,
        supports_background_wake: true,
        expected_latency_ms: 2000,
        notes: ['Treat as a remote workspace agent; bridge credential scope still gates writes.'],
    },
    {
        adapter_id: 'web-pwa',
        display_name: 'AutoClaw Web/PWA',
        runtime: 'web-pwa',
        delivery: 'bridge-http',
        wake_mode: 'poll',
        activity_mode: 'native',
        trust_ceiling: 'operator',
        can_receive_room_message: true,
        can_send_room_message: true,
        can_record_read_receipts: true,
        supports_background_wake: false,
        expected_latency_ms: 5000,
        notes: ['Foreground PWA can poll/stream. Background VAPID push shipped for awaiting-you/attention events (CP-4.4, daemon/push.ts); room-message wake over push is not yet wired, so background_wake stays false here.'],
    },
    {
        adapter_id: 'discord',
        display_name: 'Discord Connector',
        runtime: 'external-chat',
        delivery: 'webhook',
        wake_mode: 'push',
        activity_mode: 'native',
        trust_ceiling: 'external-low',
        can_receive_room_message: true,
        can_send_room_message: true,
        can_record_read_receipts: false,
        supports_background_wake: true,
        expected_latency_ms: 3000,
        notes: ['Connector must enforce per-room allowlists before messages can steer work.'],
    },
    {
        adapter_id: 'slack',
        display_name: 'Slack Connector',
        runtime: 'external-chat',
        delivery: 'webhook',
        wake_mode: 'push',
        activity_mode: 'native',
        trust_ceiling: 'external-low',
        can_receive_room_message: true,
        can_send_room_message: true,
        can_record_read_receipts: false,
        supports_background_wake: true,
        expected_latency_ms: 3000,
        notes: ['Connector must enforce per-room allowlists before messages can steer work.'],
    },
    {
        adapter_id: 'telegram',
        display_name: 'Telegram Connector',
        runtime: 'external-chat',
        delivery: 'webhook',
        wake_mode: 'push',
        activity_mode: 'native',
        trust_ceiling: 'external-low',
        can_receive_room_message: true,
        can_send_room_message: true,
        can_record_read_receipts: false,
        supports_background_wake: true,
        expected_latency_ms: 3000,
        notes: ['Connector must enforce per-room allowlists before messages can steer work.'],
    },
];
const PROFILE_BY_ID = new Map(PROFILES.map(profile => [profile.adapter_id, profile]));
const ALIASES = new Map([
    ['claude', 'claude-code'],
    ['anthropic.claude-code', 'claude-code'],
    ['kilo-code', 'kilocode'],
    ['kilo', 'kilocode'],
    ['google-gemini-cli', 'gemini-cli'],
    ['gemini', 'gemini-cli'],
    ['open-claw', 'openclaw'],
    ['hermes-agent', 'hermes'],
    ['autoclaw-web', 'web-pwa'],
]);
function normalizeWakeAdapterId(adapterId) {
    const normalized = adapterId.trim().toLowerCase().replace(/[\s_]+/g, '-');
    return ALIASES.get(normalized) ?? normalized;
}
function wakeProfileForAdapter(adapterId) {
    const normalized = normalizeWakeAdapterId(adapterId ?? '');
    const profile = PROFILE_BY_ID.get(normalized);
    if (profile) {
        return profile;
    }
    return {
        adapter_id: normalized || 'unknown',
        display_name: normalized || 'Unknown',
        runtime: 'cli',
        delivery: 'none',
        wake_mode: 'not_supported',
        activity_mode: 'none',
        trust_ceiling: 'external-low',
        can_receive_room_message: false,
        can_send_room_message: false,
        can_record_read_receipts: false,
        supports_background_wake: false,
        expected_latency_ms: null,
        notes: ['No wake profile is registered for this adapter.'],
    };
}
function listWakeAdapterProfiles(filter = {}) {
    return PROFILES.filter(profile => {
        if (filter.runtime && profile.runtime !== filter.runtime) {
            return false;
        }
        if (filter.delivery && profile.delivery !== filter.delivery) {
            return false;
        }
        if (filter.wakeMode && profile.wake_mode !== filter.wakeMode) {
            return false;
        }
        return true;
    }).map(profile => ({ ...profile, notes: [...profile.notes] }));
}
function planParticipantWakes(message, targets) {
    const seen = new Set();
    const plans = [];
    for (const target of targets) {
        const participant_id = target.participant_id.trim();
        if (!participant_id || seen.has(participant_id)) {
            continue;
        }
        seen.add(participant_id);
        const profile = wakeProfileForAdapter(target.adapter_id ?? participant_id);
        const decision = message.type === 'room_activity'
            ? { wake: false, reason: 'none' }
            : (0, rooms_1.shouldWakeParticipant)(message, participant_id);
        const blocked_reason = blockedReasonFor(decision.wake, message.type, profile);
        plans.push({
            participant_id,
            adapter_id: profile.adapter_id,
            wake: decision.wake,
            reason: decision.reason,
            delivery: profile.delivery,
            wake_mode: profile.wake_mode,
            can_attempt_delivery: decision.wake && blocked_reason === undefined,
            expected_latency_ms: profile.expected_latency_ms,
            ...(blocked_reason ? { blocked_reason } : {}),
        });
    }
    return plans;
}
function blockedReasonFor(wake, messageType, profile) {
    if (messageType === 'room_activity') {
        return 'activity_only';
    }
    if (!wake) {
        return 'no_wake_reason';
    }
    if (profile.wake_mode === 'not_supported' || !profile.can_receive_room_message) {
        return 'unsupported_adapter';
    }
    if (profile.wake_mode === 'manual') {
        return 'manual_attention_only';
    }
    return undefined;
}
//# sourceMappingURL=wakeAdapters.js.map
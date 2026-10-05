/**
 * chatInjector.ts — generic "deliver a prompt to a heterogeneous worker".
 *
 * `KiloCodeBridge` (kilocode.ts) is the CONSUMER side of one IDE: it watches
 * an outbox `ready` flag and injects text into Kilo's chat. What was missing
 * is the PRODUCER side, generalised across every loop mechanism the registry
 * records, so the router + stall-recovery can wake ANY agent the same way.
 *
 * Selection is by the agent's `loop_mechanism` (registry.json / DESIGN.md
 * Gap E):
 *   - `cli-headless`  → write `outboxes/<agent>/<msgId>.json` + touch
 *                       `agents/<agent>/ready` (the exact contract KiloCodeBridge
 *                       and the revive runner consume).
 *   - `plain-message` → try to post into the host chat; on failure, return the
 *                       rendered prompt for the human to paste (keepalive path).
 *   - `slash-loop`    → deliver a `/loop`-style continuation (host post, else
 *                       manual paste).
 *
 * IO is injected (file writer + host poster) so this unit-tests without an
 * extension host or a real filesystem. The default host poster resolves
 * `vscode` lazily, exactly like kilocode.ts, so it is a no-op outside the host.
 */
export { commandHostPoster as commandHostPoster };
export { selectInjector as selectInjector };
import * as fs from "fs";
import path from "path";
const fsPromises = fs.promises;
function resolveVsCode() {
    try {
        const req = eval('require');
        return req('vscode');
    }
    catch {
        return null;
    }
}
/**
 * A host poster that tries a list of candidate chat-submit command ids. Used
 * for `plain-message` / `slash-loop` agents whose IDE exposes a submit command.
 */
function commandHostPoster(candidateCommands) {
    return {
        async post(text) {
            const vscode = resolveVsCode();
            if (vscode === null) {
                throw new Error('no VS Code extension host — cannot post to chat');
            }
            const available = new Set(await vscode.commands.getCommands(true));
            const command = candidateCommands.find(c => available.has(c));
            if (command === undefined) {
                throw new Error(`no chat-submit command found (tried ${candidateCommands.join(', ')})`);
            }
            await vscode.commands.executeCommand(command, text);
        },
    };
}
/**
 * `cli-headless` producer. Writes the outbox message and touches the `ready`
 * flag that a headless runner (or `KiloCodeBridge`) consumes.
 */
class OutboxChatInjector {
    constructor(opts) {
        this.mechanism = 'cli-headless';
        this.commsRoot = opts.commsRoot;
        this.now = opts.now ?? (() => new Date());
    }
    async inject(req) {
        const msgId = req.msgId ?? `inj-${this.now().toISOString().replace(/[:.]/g, '-')}-${req.agentId}`;
        const outboxDir = path.join(this.commsRoot, 'outboxes', req.agentId);
        const agentDir = path.join(this.commsRoot, 'agents', req.agentId);
        await fsPromises.mkdir(outboxDir, { recursive: true });
        await fsPromises.mkdir(agentDir, { recursive: true });
        const outboxFile = path.join(outboxDir, `${msgId}.json`);
        const readyFlag = path.join(agentDir, 'ready');
        const message = {
            id: msgId,
            sessionId: msgId,
            text: req.text,
            createdAt: this.now().toISOString(),
            from: 'orchestrator',
        };
        await fsPromises.writeFile(outboxFile, JSON.stringify(message, null, 2), 'utf8');
        await fsPromises.writeFile(readyFlag, this.now().toISOString(), 'utf8');
        return {
            agentId: req.agentId,
            mechanism: this.mechanism,
            delivered: true,
            method: 'outbox',
            detail: `wrote outbox message + ready flag for ${req.agentId}`,
            artifacts: [outboxFile, readyFlag],
        };
    }
}
export { OutboxChatInjector as OutboxChatInjector };
/**
 * Producer for agents that live in-IDE. Tries to post into the host chat;
 * if that fails (no host, no command), returns `manual-paste` with the
 * rendered prompt so the human (or the `/orchestrate revive` flow) can paste
 * it. `slash-loop` wraps the text as a `/loop` continuation.
 */
class HostChatInjector {
    constructor(opts) {
        this.mechanism = opts.mechanism;
        this.poster = opts.poster;
    }
    render(text) {
        return this.mechanism === 'slash-loop' ? `/loop ${text}` : text;
    }
    async inject(req) {
        const rendered = this.render(req.text);
        try {
            await this.poster.post(rendered);
            return {
                agentId: req.agentId,
                mechanism: this.mechanism,
                delivered: true,
                method: 'host-chat',
                detail: `posted to ${req.agentId} host chat`,
            };
        }
        catch (err) {
            return {
                agentId: req.agentId,
                mechanism: this.mechanism,
                delivered: false,
                method: 'manual-paste',
                detail: `host post failed (${err instanceof Error ? err.message : String(err)}); paste manually`,
                prompt: rendered,
            };
        }
    }
}
export { HostChatInjector as HostChatInjector };
/* -------------------------------------------------------------------------- */
/*  Factory                                                                   */
/* -------------------------------------------------------------------------- */
/** Default chat-submit command candidates per known plain-message host. */
const HOST_COMMANDS = {
    kilocode: ['kilo-code.sendMessage', 'kilocode.sendMessage', 'kilo-code.newTask'],
    default: [],
};
/**
 * Select the right {@link ChatInjector} for a loop mechanism. This is the one
 * call the router and stall-recovery use — they never branch on mechanism
 * themselves.
 */
function selectInjector(mechanism, opts) {
    if (mechanism === 'cli-headless') {
        return new OutboxChatInjector({ commsRoot: opts.commsRoot, now: opts.now });
    }
    const poster = opts.poster
        ?? commandHostPoster(HOST_COMMANDS[opts.agentId ?? 'default'] ?? HOST_COMMANDS.default);
    return new HostChatInjector({ mechanism, poster });
}
//# sourceMappingURL=chatInjector.js.map

import fs from 'fs';
import path from 'path';

/**
 * daemon/logRotation.ts — CP-3.2: a tiny size-based rotating file logger for the
 * headless daemon.
 *
 * When autoclawd runs detached (start-at-login, NSSM, systemd) its console goes
 * nowhere, so it needs a durable log under `~/.autoclaw/control/logs/`. This
 * keeps a bounded amount of history: the active file rolls to `.1` when it would
 * exceed `maxBytes`, older files shift up (`.1`→`.2`…), and anything past
 * `maxFiles` is dropped.
 *
 * Deliberately dependency-free + append-per-line (no held file descriptor to
 * survive across renames) and NEVER throws — a logging failure must not down the
 * daemon. `now` is injectable so rotation + timestamps are deterministic in tests.
 */
Object.defineProperty(exports, "__esModule", { value: true });

const DEFAULT_MAX_BYTES = 5 * 1024 * 1024;
const DEFAULT_MAX_FILES = 5;
function createRotatingLogger(file, opts = {}) {
    const maxBytes = opts.maxBytes && opts.maxBytes > 0 ? opts.maxBytes : DEFAULT_MAX_BYTES;
    const maxFiles = Math.max(1, Math.floor(opts.maxFiles ?? DEFAULT_MAX_FILES));
    const now = opts.now ?? (() => new Date());
    try {
        fs.mkdirSync(path.dirname(file), { recursive: true });
    }
    catch { /* best-effort */ }
    function currentSize() {
        try {
            return fs.statSync(file).size;
        }
        catch {
            return 0;
        }
    }
    /** Drop the oldest, shift `.k`→`.k+1`, then move the active file to `.1`. */
    function rotate() {
        try {
            fs.rmSync(`${file}.${maxFiles}`, { force: true });
        }
        catch { /* ignore */ }
        for (let i = maxFiles - 1; i >= 1; i--) {
            try {
                if (fs.existsSync(`${file}.${i}`)) {
                    fs.renameSync(`${file}.${i}`, `${file}.${i + 1}`);
                }
            }
            catch { /* ignore */ }
        }
        try {
            if (fs.existsSync(file)) {
                fs.renameSync(file, `${file}.1`);
            }
        }
        catch { /* ignore */ }
    }
    return {
        file,
        log(line) {
            const stamped = `${now().toISOString()} ${line}\n`;
            try {
                const size = currentSize();
                // Rotate only when there is content AND this line would push us over — so a
                // single line larger than maxBytes still lands (in a fresh file) rather than
                // spinning rotations.
                if (size > 0 && size + Buffer.byteLength(stamped) > maxBytes) {
                    rotate();
                }
                fs.appendFileSync(file, stamped);
            }
            catch { /* logging must never throw */ }
        },
        close() { },
    };
}
//# sourceMappingURL=logRotation.js.map

export { createRotatingLogger as createRotatingLogger };

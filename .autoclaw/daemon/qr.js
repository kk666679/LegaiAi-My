/**
 * qr.ts — a pure, dependency-free QR Code encoder (CP-3.5).
 *
 * Renders a pairing URL as a scannable QR matrix / self-contained SVG for the
 * AutoClaw Control web UI. No npm deps, no vscode/fs/node imports — safe to run
 * in a browser bundle or a plain node process.
 *
 * Scope: QR model 2, byte + numeric mode, ECC levels L/M/Q/H, versions 1–10.
 * The pipeline (mode + char-count header → data codewords → Reed–Solomon ECC
 * over GF(256) → block interleave → module placement → data masking →
 * format/version information) follows ISO/IEC 18004. The canonical "01234567"
 * numeric v1-M mask-2 worked example is used as a known-answer test in the
 * companion test file.
 *
 * References (free): ISO/IEC 18004, Thonky "QR Code Tutorial", Wikipedia
 * "QR code". Reed–Solomon uses the QR field GF(256) with primitive polynomial
 * 0x11d; the format-bit BCH and version-bit BCH constants are the standard
 * 0x537 / 0x1f25 generators with the 0x5412 format mask.
 */
Object.defineProperty(exports, "__esModule", { value: true });

// ---------------------------------------------------------------------------
// GF(256) arithmetic — primitive polynomial 0x11d (QR field).
// ---------------------------------------------------------------------------
const GF_EXP = new Array(512);
const GF_LOG = new Array(256);
(function initGaloisField() {
    let x = 1;
    for (let i = 0; i < 255; i++) {
        GF_EXP[i] = x;
        GF_LOG[x] = i;
        x <<= 1;
        if (x & 0x100)
            x ^= 0x11d;
    }
    for (let i = 255; i < 512; i++)
        GF_EXP[i] = GF_EXP[i - 255];
})();
function gfMul(a, b) {
    if (a === 0 || b === 0)
        return 0;
    return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}
/** Reed–Solomon generator polynomial of the given degree (coeffs hi→lo, monic). */
function rsGeneratorPoly(degree) {
    let poly = [1];
    for (let i = 0; i < degree; i++) {
        const next = new Array(poly.length + 1).fill(0);
        for (let j = 0; j < poly.length; j++) {
            next[j] ^= poly[j]; // multiply by x
            next[j + 1] ^= gfMul(poly[j], GF_EXP[i]); // multiply by alpha^i
        }
        poly = next;
    }
    return poly;
}
/** Compute the `ecLen` Reed–Solomon error-correction codewords for `data`. */
function rsEncode(data, ecLen) {
    const gen = rsGeneratorPoly(ecLen); // length ecLen + 1, gen[0] === 1
    const res = new Array(ecLen).fill(0);
    for (const byte of data) {
        const factor = byte ^ res[0];
        for (let j = 0; j < ecLen - 1; j++) {
            res[j] = res[j + 1] ^ gfMul(gen[j + 1], factor);
        }
        res[ecLen - 1] = gfMul(gen[ecLen], factor);
    }
    return res;
}
const EC_TABLE = {
    '1L': [7, 1, 19, 0, 0], '1M': [10, 1, 16, 0, 0], '1Q': [13, 1, 13, 0, 0], '1H': [17, 1, 9, 0, 0],
    '2L': [10, 1, 34, 0, 0], '2M': [16, 1, 28, 0, 0], '2Q': [22, 1, 22, 0, 0], '2H': [28, 1, 16, 0, 0],
    '3L': [15, 1, 55, 0, 0], '3M': [26, 1, 44, 0, 0], '3Q': [18, 2, 17, 0, 0], '3H': [22, 2, 13, 0, 0],
    '4L': [20, 1, 80, 0, 0], '4M': [18, 2, 32, 0, 0], '4Q': [26, 2, 24, 0, 0], '4H': [16, 4, 9, 0, 0],
    '5L': [26, 1, 108, 0, 0], '5M': [24, 2, 43, 0, 0], '5Q': [18, 2, 15, 2, 16], '5H': [22, 2, 11, 2, 12],
    '6L': [18, 2, 68, 0, 0], '6M': [16, 4, 27, 0, 0], '6Q': [24, 4, 19, 0, 0], '6H': [28, 4, 15, 0, 0],
    '7L': [20, 2, 78, 0, 0], '7M': [18, 4, 31, 0, 0], '7Q': [18, 2, 14, 4, 15], '7H': [26, 4, 13, 1, 14],
    '8L': [24, 2, 97, 0, 0], '8M': [22, 2, 38, 2, 39], '8Q': [22, 4, 18, 2, 19], '8H': [26, 4, 14, 2, 15],
    '9L': [30, 2, 116, 0, 0], '9M': [22, 3, 36, 2, 37], '9Q': [20, 4, 16, 4, 17], '9H': [24, 4, 12, 4, 13],
    '10L': [18, 2, 68, 2, 69], '10M': [26, 4, 43, 1, 44], '10Q': [24, 6, 19, 2, 20], '10H': [28, 6, 15, 2, 16],
};
const MAX_VERSION = 10;
function ecSpec(version, ecc) {
    const spec = EC_TABLE[`${version}${ecc}`];
    if (!spec)
        throw new Error(`unsupported version/ecc: ${version}${ecc}`);
    return spec;
}
/** Number of data codewords available at a version + ECC level. */
function dataCodewordCount(version, ecc) {
    const [, n1, d1, n2, d2] = ecSpec(version, ecc);
    return n1 * d1 + n2 * d2;
}
// Alignment-pattern centre coordinates per version (ISO/IEC 18004 Annex E).
const ALIGN_POS = {
    1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30],
    6: [6, 34], 7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46], 10: [6, 28, 50],
};
// Number of remainder bits appended after the interleaved codewords.
const REMAINDER_BITS = {
    1: 0, 2: 7, 3: 7, 4: 7, 5: 7, 6: 7, 7: 0, 8: 0, 9: 0, 10: 0,
};
const MODE_INDICATOR = { numeric: 0b0001, byte: 0b0100 };
function charCountBits(mode, version) {
    if (mode === 'numeric')
        return version <= 9 ? 10 : version <= 26 ? 12 : 14;
    // byte
    return version <= 9 ? 8 : 16;
}
// ---------------------------------------------------------------------------
// Bit buffer + data encoders.
// ---------------------------------------------------------------------------
class BitBuffer {
    constructor() {
        this.bits = [];
    }
    put(value, length) {
        for (let i = length - 1; i >= 0; i--)
            this.bits.push((value >>> i) & 1);
    }
    get length() {
        return this.bits.length;
    }
}
/** Minimal, self-contained UTF-8 encoder (no TextEncoder dependency). */
function toUtf8Bytes(text) {
    const out = [];
    for (let i = 0; i < text.length; i++) {
        let code = text.charCodeAt(i);
        if (code >= 0xd800 && code <= 0xdbff && i + 1 < text.length) {
            const next = text.charCodeAt(i + 1);
            if (next >= 0xdc00 && next <= 0xdfff) {
                code = 0x10000 + ((code - 0xd800) << 10) + (next - 0xdc00);
                i++;
            }
        }
        if (code < 0x80) {
            out.push(code);
        }
        else if (code < 0x800) {
            out.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
        }
        else if (code < 0x10000) {
            out.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
        }
        else {
            out.push(0xf0 | (code >> 18), 0x80 | ((code >> 12) & 0x3f), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
        }
    }
    return out;
}
function isDigits(text) {
    return text.length > 0 && /^[0-9]+$/.test(text);
}
/** Number of payload bits (excluding mode + char-count header) for a mode. */
function payloadBitLength(mode, count) {
    if (mode === 'numeric') {
        const groups = Math.floor(count / 3);
        const rem = count % 3;
        return groups * 10 + (rem === 2 ? 7 : rem === 1 ? 4 : 0);
    }
    return count * 8; // byte
}
function encodeNumericPayload(bb, text) {
    let i = 0;
    for (; i + 3 <= text.length; i += 3)
        bb.put(parseInt(text.substr(i, 3), 10), 10);
    const rem = text.length - i;
    if (rem === 2)
        bb.put(parseInt(text.substr(i, 2), 10), 7);
    else if (rem === 1)
        bb.put(parseInt(text.substr(i, 1), 10), 4);
}
// ---------------------------------------------------------------------------
// Data-codeword assembly (header + payload + terminator + padding).
// ---------------------------------------------------------------------------
function buildDataCodewords(mode, text, bytes, version, ecc) {
    const count = mode === 'numeric' ? text.length : bytes.length;
    const bb = new BitBuffer();
    bb.put(MODE_INDICATOR[mode], 4);
    bb.put(count, charCountBits(mode, version));
    if (mode === 'numeric')
        encodeNumericPayload(bb, text);
    else
        for (const b of bytes)
            bb.put(b, 8);
    const totalDataCw = dataCodewordCount(version, ecc);
    const capacityBits = totalDataCw * 8;
    if (bb.length > capacityBits) {
        throw new Error('data exceeds capacity for chosen version/ecc');
    }
    // Terminator: up to four 0 bits, fewer if we are near capacity.
    bb.put(0, Math.min(4, capacityBits - bb.length));
    // Pad to a byte boundary.
    while (bb.length % 8 !== 0)
        bb.bits.push(0);
    const out = [];
    for (let i = 0; i < bb.length; i += 8) {
        let v = 0;
        for (let j = 0; j < 8; j++)
            v = (v << 1) | bb.bits[i + j];
        out.push(v);
    }
    // Alternating pad codewords 0xEC / 0x11 until the block group is full.
    for (let toggle = true; out.length < totalDataCw; toggle = !toggle) {
        out.push(toggle ? 0xec : 0x11);
    }
    return out;
}
/** Split into blocks, append RS ECC, and interleave into the final codeword stream. */
function interleaveCodewords(dataCw, version, ecc) {
    const [ecLen, n1, d1, n2, d2] = ecSpec(version, ecc);
    const blocks = [];
    let idx = 0;
    for (let b = 0; b < n1; b++) {
        const data = dataCw.slice(idx, idx + d1);
        idx += d1;
        blocks.push({ data, ec: rsEncode(data, ecLen) });
    }
    for (let b = 0; b < n2; b++) {
        const data = dataCw.slice(idx, idx + d2);
        idx += d2;
        blocks.push({ data, ec: rsEncode(data, ecLen) });
    }
    const result = [];
    const maxData = Math.max(d1, d2);
    for (let i = 0; i < maxData; i++) {
        for (const blk of blocks)
            if (i < blk.data.length)
                result.push(blk.data[i]);
    }
    for (let i = 0; i < ecLen; i++) {
        for (const blk of blocks)
            result.push(blk.ec[i]);
    }
    return result;
}
// ---------------------------------------------------------------------------
// Matrix construction: function patterns, data placement, masking, format info.
// ---------------------------------------------------------------------------
class QrMatrix {
    constructor(version, ecc) {
        this.version = version;
        this.ecc = ecc;
        this.size = 21 + 4 * (version - 1);
        this.modules = Array.from({ length: this.size }, () => new Array(this.size).fill(false));
        this.isFunction = Array.from({ length: this.size }, () => new Array(this.size).fill(false));
    }
    setFunction(r, c, dark) {
        this.modules[r][c] = dark;
        this.isFunction[r][c] = true;
    }
    drawFunctionPatterns() {
        const n = this.size;
        // Timing patterns (drawn first; finders/separators overwrite their ends).
        for (let i = 0; i < n; i++) {
            this.setFunction(6, i, i % 2 === 0);
            this.setFunction(i, 6, i % 2 === 0);
        }
        // Three finder patterns + their white separators.
        this.drawFinder(0, 0);
        this.drawFinder(0, n - 7);
        this.drawFinder(n - 7, 0);
        // Alignment patterns (skip the three that collide with finders).
        const pos = ALIGN_POS[this.version];
        const last = pos[pos.length - 1];
        for (const r of pos) {
            for (const c of pos) {
                if ((r === 6 && c === 6) || (r === 6 && c === last) || (r === last && c === 6))
                    continue;
                this.drawAlignment(r, c);
            }
        }
        // Reserve the format-info + version-info regions and set the dark module.
        this.drawFormatBits(0); // dummy value: reserves the cells (isFunction)
        this.drawVersion();
    }
    drawFinder(r0, c0) {
        const n = this.size;
        for (let r = -1; r <= 7; r++) {
            for (let c = -1; c <= 7; c++) {
                const rr = r0 + r;
                const cc = c0 + c;
                if (rr < 0 || rr >= n || cc < 0 || cc >= n)
                    continue;
                let dark = false;
                if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
                    dark = r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4);
                }
                this.setFunction(rr, cc, dark);
            }
        }
    }
    drawAlignment(cr, cc) {
        for (let r = -2; r <= 2; r++) {
            for (let c = -2; c <= 2; c++) {
                this.setFunction(cr + r, cc + c, Math.max(Math.abs(r), Math.abs(c)) !== 1);
            }
        }
    }
    /**
     * Draw the 15-bit format information (ECC level + mask) in both copies.
     * Bit 14 is the MSB. Placement (row, col) is verified byte-for-byte against
     * the ISO/IEC 18004 Annex G worked example: the MSB sits at (8,0), copy 2 is
     * split as 7 modules up column 8 plus 8 modules along row 8, and the always-
     * dark module at (size-8, 8) is a separate module (never a format bit).
     */
    drawFormatBits(mask) {
        const eccFormat = { L: 1, M: 0, Q: 3, H: 2 };
        const data = (eccFormat[this.ecc] << 3) | mask;
        let rem = data;
        for (let i = 0; i < 10; i++)
            rem = (rem << 1) ^ (((rem >> 9) & 1) * 0x537);
        const bits = ((data << 10) | rem) ^ 0x5412; // 15 bits
        const bit = (i) => ((bits >> i) & 1) !== 0;
        const n = this.size;
        // Copy 1 — around the top-left finder.
        for (let i = 0; i <= 5; i++)
            this.setFunction(8, i, bit(14 - i)); // (8,0..5) = b14..b9
        this.setFunction(8, 7, bit(8));
        this.setFunction(8, 8, bit(7));
        this.setFunction(7, 8, bit(6));
        for (let i = 0; i <= 5; i++)
            this.setFunction(i, 8, bit(i)); // (0..5,8) = b0..b5
        // Copy 2 — split under the top-right and beside the bottom-left finder.
        for (let i = 0; i <= 6; i++)
            this.setFunction(n - 1 - i, 8, bit(14 - i)); // (n-1..n-7,8) = b14..b8
        for (let i = 0; i <= 7; i++)
            this.setFunction(8, n - 8 + i, bit(7 - i)); // (8,n-8..n-1) = b7..b0
        this.setFunction(n - 8, 8, true); // always-dark module
    }
    /** Draw the 18-bit version information (versions ≥ 7 only). */
    drawVersion() {
        if (this.version < 7)
            return;
        let rem = this.version;
        for (let i = 0; i < 12; i++)
            rem = (rem << 1) ^ (((rem >> 11) & 1) * 0x1f25);
        const bits = (this.version << 12) | rem; // 18 bits
        const n = this.size;
        for (let i = 0; i < 18; i++) {
            const b = ((bits >> i) & 1) !== 0;
            const a = n - 11 + (i % 3);
            const c = Math.floor(i / 3);
            this.setFunction(a, c, b);
            this.setFunction(c, a, b);
        }
    }
    /** Place the interleaved codeword stream in the boustrophedon (zig-zag) order. */
    drawCodewords(codewords) {
        const n = this.size;
        let i = 0; // bit index
        const totalBits = codewords.length * 8;
        for (let right = n - 1; right >= 1; right -= 2) {
            if (right === 6)
                right = 5; // skip the vertical timing column
            for (let vert = 0; vert < n; vert++) {
                for (let j = 0; j < 2; j++) {
                    const c = right - j;
                    const upward = ((right + 1) & 2) === 0;
                    const r = upward ? n - 1 - vert : vert;
                    if (!this.isFunction[r][c] && i < totalBits) {
                        this.modules[r][c] = ((codewords[i >> 3] >> (7 - (i & 7))) & 1) !== 0;
                        i++;
                    }
                }
            }
        }
    }
    maskCondition(mask, r, c) {
        switch (mask) {
            case 0: return (r + c) % 2 === 0;
            case 1: return r % 2 === 0;
            case 2: return c % 3 === 0;
            case 3: return (r + c) % 3 === 0;
            case 4: return (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0;
            case 5: return ((r * c) % 2) + ((r * c) % 3) === 0;
            case 6: return (((r * c) % 2) + ((r * c) % 3)) % 2 === 0;
            case 7: return (((r + c) % 2) + ((r * c) % 3)) % 2 === 0;
            default: throw new Error(`invalid mask: ${mask}`);
        }
    }
    /** XOR the data region with the given mask pattern (function cells untouched). */
    applyMask(mask) {
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (!this.isFunction[r][c] && this.maskCondition(mask, r, c)) {
                    this.modules[r][c] = !this.modules[r][c];
                }
            }
        }
    }
    /** Penalty score (ISO/IEC 18004 §8.8.2) used to auto-select the best mask. */
    penaltyScore() {
        const n = this.size;
        const m = this.modules;
        let score = 0;
        const N1 = 3, N2 = 3, N3 = 40, N4 = 10;
        // Rule 1: runs of 5+ same-colour modules in each row and column.
        for (let r = 0; r < n; r++) {
            let runColor = m[r][0];
            let runLen = 1;
            for (let c = 1; c < n; c++) {
                if (m[r][c] === runColor) {
                    runLen++;
                    if (runLen === 5)
                        score += N1;
                    else if (runLen > 5)
                        score++;
                }
                else {
                    runColor = m[r][c];
                    runLen = 1;
                }
            }
        }
        for (let c = 0; c < n; c++) {
            let runColor = m[0][c];
            let runLen = 1;
            for (let r = 1; r < n; r++) {
                if (m[r][c] === runColor) {
                    runLen++;
                    if (runLen === 5)
                        score += N1;
                    else if (runLen > 5)
                        score++;
                }
                else {
                    runColor = m[r][c];
                    runLen = 1;
                }
            }
        }
        // Rule 2: 2x2 blocks of a single colour.
        for (let r = 0; r < n - 1; r++) {
            for (let c = 0; c < n - 1; c++) {
                const v = m[r][c];
                if (v === m[r][c + 1] && v === m[r + 1][c] && v === m[r + 1][c + 1])
                    score += N2;
            }
        }
        // Rule 3: finder-like 1:1:3:1:1 patterns with a 4-module light margin.
        const P1 = [true, false, true, true, true, false, true, false, false, false, false];
        const P2 = [false, false, false, false, true, false, true, true, true, false, true];
        const matches = (line, i, pat) => {
            for (let k = 0; k < 11; k++)
                if (line[i + k] !== pat[k])
                    return false;
            return true;
        };
        for (let r = 0; r < n; r++) {
            const row = m[r];
            for (let c = 0; c + 11 <= n; c++) {
                if (matches(row, c, P1))
                    score += N3;
                if (matches(row, c, P2))
                    score += N3;
            }
        }
        for (let c = 0; c < n; c++) {
            const col = [];
            for (let r = 0; r < n; r++)
                col.push(m[r][c]);
            for (let r = 0; r + 11 <= n; r++) {
                if (matches(col, r, P1))
                    score += N3;
                if (matches(col, r, P2))
                    score += N3;
            }
        }
        // Rule 4: deviation of the dark-module proportion from 50%.
        let dark = 0;
        for (let r = 0; r < n; r++)
            for (let c = 0; c < n; c++)
                if (m[r][c])
                    dark++;
        const total = n * n;
        const k = Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1;
        score += k * N4;
        return score;
    }
}
// ---------------------------------------------------------------------------
// Top-level generation.
// ---------------------------------------------------------------------------
function renderMatrix(codewords, version, ecc, mask) {
    const qr = new QrMatrix(version, ecc);
    qr.drawFunctionPatterns();
    qr.drawCodewords(codewords);
    let chosen = mask;
    if (mask < 0) {
        let best = Number.POSITIVE_INFINITY;
        for (let m = 0; m < 8; m++) {
            qr.applyMask(m);
            qr.drawFormatBits(m);
            const penalty = qr.penaltyScore();
            if (penalty < best) {
                best = penalty;
                chosen = m;
            }
            qr.applyMask(m); // undo (XOR is its own inverse)
        }
    }
    qr.applyMask(chosen);
    qr.drawFormatBits(chosen);
    return qr.modules;
}
function generate(mode, text, version, ecc, mask) {
    const bytes = mode === 'byte' ? toUtf8Bytes(text) : [];
    const dataCw = buildDataCodewords(mode, text, bytes, version, ecc);
    const finalCw = interleaveCodewords(dataCw, version, ecc);
    // Append remainder bits implicitly: drawCodewords only fills real data bits;
    // the remaining (function-free) modules stay 0, which is exactly the spec's
    // padding of REMAINDER_BITS[version] zero bits.
    void REMAINDER_BITS;
    return renderMatrix(finalCw, version, ecc, mask);
}
/** Pick the smallest supported version that fits `count` symbols of `mode` at `ecc`. */
function selectVersion(mode, count, ecc) {
    for (let v = 1; v <= MAX_VERSION; v++) {
        const need = 4 + charCountBits(mode, v) + payloadBitLength(mode, count);
        if (need <= dataCodewordCount(v, ecc) * 8)
            return v;
    }
    throw new Error(`data too large to encode within QR versions 1–${MAX_VERSION}`);
}
// ---------------------------------------------------------------------------
// Public API.
// ---------------------------------------------------------------------------
/**
 * Encode `text` as a QR matrix. Auto-selects the smallest byte-mode version
 * (1–10) that fits at the requested ECC level (default 'M') and the mask with
 * the lowest penalty. The returned matrix does NOT include the quiet zone —
 * the caller adds it (qrToSvg does).
 */
function encodeQr(text, opts) {
    const ecc = opts?.ecc ?? 'M';
    const bytes = toUtf8Bytes(text);
    const version = selectVersion('byte', bytes.length, ecc);
    const modules = generate('byte', text, version, ecc, -1);
    return { size: modules.length, modules };
}
/**
 * Deterministic encode with a forced mode / version / mask. Exposed for
 * known-answer testing against the canonical ISO/IEC 18004 worked example.
 */
function encodeQrForTest(text, opts) {
    return generate(opts.mode, text, opts.version, opts.ecc, opts.mask);
}
/**
 * Render `text` as a self-contained `<svg>` string (no external references).
 * The quiet zone (default 4 modules) is included here. Dark modules are drawn
 * as a single `<path>` for compactness.
 */
function qrToSvg(text, opts) {
    const ecc = opts?.ecc ?? 'M';
    const scale = opts?.scale ?? 4;
    const quiet = opts?.quiet ?? 4;
    const dark = opts?.dark ?? '#0f1115';
    const light = opts?.light ?? '#ffffff';
    const { size, modules } = encodeQr(text, { ecc });
    const dim = (size + quiet * 2) * scale;
    let path = '';
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (modules[r][c]) {
                const x = (c + quiet) * scale;
                const y = (r + quiet) * scale;
                path += `M${x} ${y}h${scale}v${scale}h${-scale}z`;
            }
        }
    }
    return (`<svg xmlns="http://www.w3.org/2000/svg" width="${dim}" height="${dim}" ` +
        `viewBox="0 0 ${dim} ${dim}" shape-rendering="crispEdges" role="img" ` +
        `aria-label="QR code">` +
        `<rect width="${dim}" height="${dim}" fill="${light}"/>` +
        `<path d="${path}" fill="${dark}"/>` +
        `</svg>`);
}
//# sourceMappingURL=qr.js.map

export { encodeQr as encodeQr, encodeQrForTest as encodeQrForTest, qrToSvg as qrToSvg };

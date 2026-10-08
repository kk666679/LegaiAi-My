import fs from 'fs';
import path from 'path';
import * as types_1 from './types.js';


export let SCAFFOLD_SCORES_FILE = exports.PROMPT_HARNESSES_FILE = exports.SCAFFOLD_VARIANTS_FILE = exports.SCAFFOLDS_DIR = void 0;

export let SCAFFOLDS_DIR = path.join('.autoclaw', 'workflows', 'scaffolds');
export let SCAFFOLD_VARIANTS_FILE = 'variants.jsonl';
export let PROMPT_HARNESSES_FILE = 'prompt-harnesses.jsonl';
SCAFFOLD_SCORES_FILE = 'scores.jsonl';
function scaffoldDir(workspaceRoot) {
    return path.join(workspaceRoot, exports.SCAFFOLDS_DIR);
}
function scaffoldVariantsPath(workspaceRoot) {
    return path.join(scaffoldDir(workspaceRoot), exports.SCAFFOLD_VARIANTS_FILE);
}
function promptHarnessesPath(workspaceRoot) {
    return path.join(scaffoldDir(workspaceRoot), exports.PROMPT_HARNESSES_FILE);
}
function scaffoldScoresPath(workspaceRoot) {
    return path.join(scaffoldDir(workspaceRoot), exports.SCAFFOLD_SCORES_FILE);
}
async function appendScaffoldVariant(workspaceRoot, variant) {
    await appendJsonl(scaffoldVariantsPath(workspaceRoot), (0, types_1.parseScaffoldVariant)({ ...variant, schema: types_1.SCAFFOLD_SCHEMA }));
}
async function readScaffoldVariants(workspaceRoot) {
    return readJsonl(scaffoldVariantsPath(workspaceRoot), types_1.parseScaffoldVariant, 'scaffold variant');
}
async function appendPromptHarnessContract(workspaceRoot, contract) {
    await appendJsonl(promptHarnessesPath(workspaceRoot), (0, types_1.parsePromptHarnessContract)({ ...contract, schema: types_1.PROMPT_HARNESS_SCHEMA }));
}
async function readPromptHarnessContracts(workspaceRoot) {
    return readJsonl(promptHarnessesPath(workspaceRoot), types_1.parsePromptHarnessContract, 'prompt harness contract');
}
async function appendScaffoldScore(workspaceRoot, score) {
    const sanitized = scrubSensitive({ ...score, schema: types_1.SCAFFOLD_SCORE_SCHEMA });
    await appendJsonl(scaffoldScoresPath(workspaceRoot), (0, types_1.parseScaffoldScore)(sanitized));
}
async function readScaffoldScores(workspaceRoot) {
    return readJsonl(scaffoldScoresPath(workspaceRoot), types_1.parseScaffoldScore, 'scaffold score');
}
async function appendJsonl(file, record) {
    await fs.promises.mkdir(path.dirname(file), { recursive: true });
    await fs.promises.appendFile(file, JSON.stringify(record) + '\n', 'utf8');
}
async function readJsonl(file, parse, label) {
    let raw;
    try {
        raw = await fs.promises.readFile(file, 'utf8');
    }
    catch (err) {
        if (err.code === 'ENOENT') {
            return { records: [], warnings: [] };
        }
        return { records: [], warnings: [`Failed to read ${label} ledger: ${err.message}`] };
    }
    const records = [];
    const warnings = [];
    raw.replace(/^\uFEFF/, '').split('\n').forEach((line, index) => {
        const trimmed = line.trim();
        if (!trimmed) {
            return;
        }
        try {
            records.push(parse(JSON.parse(trimmed)));
        }
        catch (err) {
            warnings.push(`Skipped invalid ${label} line ${index + 1}: ${err.message}`);
        }
    });
    return { records, warnings };
}
function scrubSensitive(value) {
    if (Array.isArray(value)) {
        return value.map(scrubSensitive);
    }
    if (!value || typeof value !== 'object') {
        return value;
    }
    const out = {};
    for (const [key, child] of Object.entries(value)) {
        if (isSensitiveLedgerKey(key)) {
            continue;
        }
        out[key] = scrubSensitive(child);
    }
    return out;
}
function isSensitiveLedgerKey(key) {
    const normalized = key.replace(/[-_]/g, '').toLowerCase();
    return [
        'prompt',
        'prompttext',
        'rawprompt',
        'messages',
        'conversation',
        'response',
        'responsetext',
        'rawresponse',
        'completion',
        'secret',
        'apikey',
        'authorization',
        'token',
    ].includes(normalized);
}
//# sourceMappingURL=store.js.map

export { scaffoldDir as scaffoldDir, scaffoldVariantsPath as scaffoldVariantsPath, promptHarnessesPath as promptHarnessesPath, scaffoldScoresPath as scaffoldScoresPath, appendScaffoldVariant as appendScaffoldVariant, readScaffoldVariants as readScaffoldVariants, appendPromptHarnessContract as appendPromptHarnessContract, readPromptHarnessContracts as readPromptHarnessContracts, appendScaffoldScore as appendScaffoldScore, readScaffoldScores as readScaffoldScores };

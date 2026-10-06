import fs from 'fs';
import path from 'path';
import vscode from 'vscode';
import * as runner_1 from './runner.js';
import * as types_1 from './types.js';
import * as validate_1 from './validate.js';

/**
 * command.ts — VS Code command surface for the Workflow Lab runner (WL-1.4).
 *
 * Exposes `autoclaw.workflowLab.run` which lets users pick a workflow file
 * from their workspace and run it headlessly. Registered in extension.ts via
 * registerWorkflowLabCommands().
 *
 * The runner is intentionally sandboxed: no real shell commands or model
 * calls unless the user has configured a CommandRunner / ModelProvider.
 */
Object.defineProperty(exports, "__esModule", { value: true });

const WORKFLOW_GLOB = '**/*.workflow.json';
// ---------------------------------------------------------------------------
// Command: autoclaw.workflowLab.run
// ---------------------------------------------------------------------------
async function pickWorkflowFile(workspaceRoot) {
    const files = await vscode.workspace.findFiles(WORKFLOW_GLOB, '**/node_modules/**', 50);
    if (files.length === 0) {
        const open = await vscode.window.showInformationMessage('No *.workflow.json files found in this workspace. ' +
            'Create one under .autoclaw/workflows/ to get started.', 'Open Documentation');
        if (open === 'Open Documentation') {
            void vscode.env.openExternal(vscode.Uri.parse('https://github.com/GoZippy/autoclaw/blob/main/docs/specs/recursive-workflow-lab/requirements.md'));
        }
        return undefined;
    }
    const items = files.map((uri) => ({
        label: path.relative(workspaceRoot, uri.fsPath),
        description: uri.fsPath,
    }));
    const picked = await vscode.window.showQuickPick(items, {
        title: 'AutoClaw Workflow Lab — Run Workflow',
        placeHolder: 'Select a workflow to run',
    });
    return picked?.description;
}
async function runWorkflowLabCommand(workspaceRoot) {
    const filePath = await pickWorkflowFile(workspaceRoot);
    if (!filePath)
        return;
    let raw;
    try {
        raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
    catch (err) {
        void vscode.window.showErrorMessage(`Workflow Lab: failed to read "${filePath}": ${String(err instanceof Error ? err.message : err)}`);
        return;
    }
    const wf = (0, types_1.parseWorkflowDefinition)(raw);
    const vr = (0, validate_1.validateWorkflow)(wf);
    if (!vr.valid) {
        const errors = vr.diagnostics.filter((d) => d.severity === 'error');
        void vscode.window.showErrorMessage(`Workflow Lab: "${wf.name ?? wf.id}" has ${errors.length} validation error(s):\n` +
            errors.slice(0, 3).map((d) => `• ${d.message}`).join('\n'));
        return;
    }
    const ch = vscode.window.createOutputChannel('AutoClaw — Workflow Lab');
    ch.show(true);
    ch.appendLine('─'.repeat(60));
    ch.appendLine(`AutoClaw Workflow Lab — ${wf.name ?? wf.id}`);
    ch.appendLine(`  file : ${filePath}`);
    ch.appendLine(`  nodes: ${wf.nodes.length}   edges: ${wf.edges.length}`);
    ch.appendLine('─'.repeat(60));
    const deps = (0, runner_1.defaultDeps)(workspaceRoot, { persistLedger: true });
    const result = await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: `Workflow Lab: ${wf.name ?? wf.id}`,
        cancellable: true,
    }, async (_progress, token) => {
        let halted = false;
        token.onCancellationRequested(() => { halted = true; });
        return (0, runner_1.runWorkflow)(wf, { ...deps, shouldHalt: () => halted });
    });
    ch.appendLine(`  status     : ${result.status}`);
    ch.appendLine(`  stopReason : ${result.stopReason}`);
    ch.appendLine(`  costCents  : ${result.costCents}`);
    ch.appendLine(`  events     : ${result.events.length}`);
    if (result.failureType) {
        ch.appendLine(`  failureType: ${result.failureType}`);
    }
    if (result.ledgerDir) {
        ch.appendLine(`  ledger     : ${result.ledgerDir}`);
    }
    ch.appendLine('─'.repeat(60));
    for (const [nodeId, state] of Object.entries(result.nodeStates)) {
        ch.appendLine(`  [${state.status.padEnd(10)}] ${nodeId}${state.failureType ? ` — ${state.failureType}` : ''}`);
    }
    ch.appendLine('─'.repeat(60));
    const icon = result.status === 'completed' ? '✓' : result.status === 'halted' ? '⏹' : '✗';
    void vscode.window.showInformationMessage(`${icon} Workflow "${wf.name ?? wf.id}" ${result.status} (${result.stopReason})`);
}
// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------
/** Register Workflow Lab commands into the extension context. */
function registerWorkflowLabCommands(context, getWorkspaceRoot) {
    context.subscriptions.push(vscode.commands.registerCommand('autoclaw.workflowLab.run', async () => {
        const root = getWorkspaceRoot();
        if (!root) {
            void vscode.window.showWarningMessage('AutoClaw Workflow Lab: open a workspace folder first.');
            return;
        }
        await runWorkflowLabCommand(root);
    }));
}
//# sourceMappingURL=command.js.map

export { registerWorkflowLabCommands as registerWorkflowLabCommands };

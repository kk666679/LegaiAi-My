"use strict";
/**
 * awlCommand.ts — VS Code glue for the AWL experiment cycle (AWL-RUN-1).
 *
 * Thin by design: the whole cycle lives in ./awlService.ts (pure, vscode-free).
 * This file owns ONLY the vscode surface: command handler, progress toast,
 * output channel, and opening the written report.
 *
 * Registration (extension.ts — done by the coordinator, not here):
 *
 *   import { registerAwlCommands } from './workflows/awlCommand';
 *   registerAwlCommands(context, getWorkspaceRoot);
 *
 * which binds `autoclaw.workflows.runAwlExperiment`.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AWL_RUN_EXPERIMENT_COMMAND = void 0;
exports.awlRunExperimentCommandHandler = awlRunExperimentCommandHandler;
exports.registerAwlCommands = registerAwlCommands;
const vscode = require("vscode");
const awlService_1 = require("./awlService");
exports.AWL_RUN_EXPERIMENT_COMMAND = 'autoclaw.workflows.runAwlExperiment';
let channel;
function getChannel() {
    if (!channel) {
        channel = vscode.window.createOutputChannel('AutoClaw — Workflow Learning');
    }
    return channel;
}
/**
 * Command handler for `autoclaw.workflows.runAwlExperiment`. Runs ONE bounded
 * AWL cycle (offline-safe by default: mock model, refusing command runner,
 * experiment outcomes not persisted), shows a summary, and opens the report.
 */
function awlRunExperimentCommandHandler(deps) {
    return async () => {
        const root = deps.getWorkspaceRoot();
        if (!root) {
            void vscode.window.showWarningMessage('AutoClaw Workflow Learning: open a workspace folder first.');
            return;
        }
        const ch = getChannel();
        ch.show(true);
        const runCycle = deps.runCycle ?? awlService_1.runAwlExperimentCycle;
        const report = await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'AutoClaw: running AWL experiment cycle…',
            cancellable: false,
        }, async () => {
            try {
                return await runCycle({
                    workspaceRoot: root,
                    now: new Date().toISOString(),
                    log: (line) => ch.appendLine(line),
                });
            }
            catch (err) {
                ch.appendLine(`AWL cycle failed: ${err.message}`);
                return undefined;
            }
        });
        if (!report) {
            void vscode.window.showErrorMessage('AutoClaw: the AWL experiment cycle failed — see the "AutoClaw — Workflow Learning" output channel.');
            return;
        }
        ch.appendLine('');
        ch.appendLine((0, awlService_1.renderAwlCycleMarkdown)(report));
        const summary = `AWL cycle: ${report.experimentsRun} experiment(s), ${report.variantsScored} scored, ` +
            `${report.promotions.length} promotion(s), ${report.rejections.length} hold/demote.`;
        const action = report.reportPath
            ? await vscode.window.showInformationMessage(summary, 'Open Report')
            : void vscode.window.showInformationMessage(summary);
        if (action === 'Open Report' && report.reportPath) {
            try {
                const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(report.reportPath));
                await vscode.window.showTextDocument(doc, { preview: true });
            }
            catch (err) {
                ch.appendLine(`could not open report: ${err.message}`);
            }
        }
    };
}
/** One-liner registration helper for extension.ts (called by the coordinator). */
function registerAwlCommands(context, getWorkspaceRoot) {
    context.subscriptions.push(vscode.commands.registerCommand(exports.AWL_RUN_EXPERIMENT_COMMAND, awlRunExperimentCommandHandler({ getWorkspaceRoot })));
}
//# sourceMappingURL=awlCommand.js.map
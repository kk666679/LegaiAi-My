"use strict";
/**
 * agents/index.js — Register all agents.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const { agentRegistry } = require('./registry');
const { OrchestratorAgent } = require('./tier0/orchestrator-agent');
const { FleetAgent } = require('./tier1/deviceops/fleet-agent');
const { ProvisioningAgent } = require('./tier1/deviceops/provisioning-agent');
const { ProfileAgent } = require('./tier1/deviceops/profile-agent');
const { DeviceControlAgent } = require('./tier1/deviceops/device-control-agent');
const { WorkflowAgent } = require('./tier1/deviceops/workflow-agent');
const { CostAgent } = require('./tier1/deviceops/cost-agent');
const { SecurityAgent } = require('./tier1/deviceops/security-agent');
const { ContentAgent } = require('./tier1/content/content-agent');
const { VideoAgent } = require('./tier1/content/video-agent');
const { SchedulingAgent } = require('./tier1/content/scheduling-agent');
const { SocialListeningAgent } = require('./tier1/content/social-listening-agent');
const { DiagnosticWorker } = require('./tier2/diagnostic-worker');
const { RemediationWorker } = require('./tier2/remediation-worker');
const { ValidationWorker } = require('./tier2/validation-worker');
const { ReportWorker } = require('./tier2/report-worker');
const { NotificationWorker } = require('./tier2/notification-worker');
const { ComplianceWorker } = require('./tier2/compliance-worker');
const { CriticAgent } = require('./tier3/critic-agent');
const { CuratorAgent } = require('./tier3/curator-agent');
const { EvaluatorAgent } = require('./tier3/evaluator-agent');

const agents = [
  () => new OrchestratorAgent(),
  () => new FleetAgent(),
  () => new ProvisioningAgent(),
  () => new ProfileAgent(),
  () => new DeviceControlAgent(),
  () => new WorkflowAgent(),
  () => new CostAgent(),
  () => new SecurityAgent(),
  () => new ContentAgent(),
  () => new VideoAgent(),
  () => new SchedulingAgent(),
  () => new SocialListeningAgent(),
  () => new DiagnosticWorker(),
  () => new RemediationWorker(),
  () => new ValidationWorker(),
  () => new ReportWorker(),
  () => new NotificationWorker(),
  () => new ComplianceWorker(),
  () => new CriticAgent(),
  () => new CuratorAgent(),
  () => new EvaluatorAgent(),
];

async function registerAllAgents() {
  for (const factory of agents) {
    const agent = factory();
    agentRegistry.register(agent);
  }
}

exports.registerAllAgents = registerAllAgents;
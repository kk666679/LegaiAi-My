import { agentRegistry } from './registry.js';
import { OrchestratorAgent } from './tier0/orchestrator-agent.js';
import { FleetAgent } from './tier1/deviceops/fleet-agent.js';
import { ProvisioningAgent } from './tier1/deviceops/provisioning-agent.js';
import { ProfileAgent } from './tier1/deviceops/profile-agent.js';
import { DeviceControlAgent } from './tier1/deviceops/device-control-agent.js';
import { WorkflowAgent } from './tier1/deviceops/workflow-agent.js';
import { CostAgent } from './tier1/deviceops/cost-agent.js';
import { SecurityAgent } from './tier1/deviceops/security-agent.js';
import { ContentAgent } from './tier1/content/content-agent.js';
import { VideoAgent } from './tier1/content/video-agent.js';
import { SchedulingAgent } from './tier1/content/scheduling-agent.js';
import { SocialListeningAgent } from './tier1/content/social-listening-agent.js';
import { DiagnosticWorker } from './tier2/diagnostic-worker.js';
import { RemediationWorker } from './tier2/remediation-worker.js';
import { ValidationWorker } from './tier2/validation-worker.js';
import { ReportWorker } from './tier2/report-worker.js';
import { NotificationWorker } from './tier2/notification-worker.js';
import { ComplianceWorker } from './tier2/compliance-worker.js';
import { CriticAgent } from './tier3/critic-agent.js';
import { CuratorAgent } from './tier3/curator-agent.js';
import { EvaluatorAgent } from './tier3/evaluator-agent.js';

/**
 * agents/index.js — Register all agents.
 */
Object.defineProperty(exports, "__esModule", { value: true });

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

export { registerAllAgents as registerAllAgents };

import { existsSync, readFileSync } from "fs";
import { join } from "path";

/**
 * HeartbeatConfig — reads the existing scheduler-heartbeat.json config
 * and provides a normalized config object.
 */
class HeartbeatConfig {
  static load(filePath) {
    if (!filePath) {
      filePath = '.autoclaw/autobuild/scheduler/heartbeat-config.json';
    }
    if (!existsSync(filePath)) {
      return defaultHeartbeatConfig();
    }
    try {
      const content = readFileSync(filePath, 'utf8');
      return { ...defaultHeartbeatConfig(), ...JSON.parse(content) };
    } catch {
      return defaultHeartbeatConfig();
    }
  }
}

function defaultHeartbeatConfig() {
  return {
    stallTimeoutMs: 300000,
    checkIntervalMs: 30000,
    maxRecoveryAttempts: 3,
    recoveryStrategies: [
      { name: 'retry_same', weight: 0.3 },
      { name: 'escalate_model', weight: 0.4 },
      { name: 'decompose_task', weight: 0.2 },
      { name: 'human_escalation', weight: 0.1 },
    ],
    signals: ['turn_advance', 'file_write', 'tool_call', 'test_run', 'commit'],
  };
}

function loadHeartbeatConfig(filePath) {
  return HeartbeatConfig.load(filePath);
}

export { HeartbeatConfig };
export { loadHeartbeatConfig };
export { defaultHeartbeatConfig };

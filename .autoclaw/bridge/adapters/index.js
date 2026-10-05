import { cursorAdapter } from "./cursor.js";
import { windsurfAdapter } from "./windsurf.js";
import { kiroAdapter } from "./kiro.js";
import { claudeCodeAdapter } from "./claude-code.js";
import { clineAdapter } from "./cline.js";
import { continueAdapter } from "./continue.js";
import { kilocodeAdapter } from "./kilocode.js";
import { antigravityAdapter } from "./antigravity.js";
import { codexAdapter } from "./codex.js";
import { genericACPAdapter } from "./generic-acp.js";

class AdapterRegistry {
  constructor() {
    this.adapters = [];
    this.adapters.push(
      cursorAdapter,
      windsurfAdapter,
      kiroAdapter,
      claudeCodeAdapter,
      clineAdapter,
      continueAdapter,
      kilocodeAdapter,
      antigravityAdapter,
      codexAdapter,
      genericACPAdapter
    );
  }

  detect(env) {
    for (const adapter of this.adapters) {
      if (adapter.detectSignals && adapter.detectSignals.some((fn) => fn(env))) {
        return adapter;
      }
    }
    return genericACPAdapter;
  }

  async create(env, config) {
    const adapter = this.detect(env);
    return adapter.create(config);
  }
}

export { AdapterRegistry };

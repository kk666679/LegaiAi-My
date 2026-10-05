import { existsSync, readFileSync } from "fs";
import { join } from "path";

/**
 * Directive loader — loads continuous development directives.
 * Reads from .autoclaw/directives/ and docs/prompts/.
 */
class DirectiveLoader {
  constructor(opts = {}) {
    this.directivesDir = directivesDir;
  }

  async load(name) {
    const path = join(this.directivesDir, `${name}.md`);
    if (existsSync(path)) {
      return readFileSync(path, 'utf8');
    }
    // Try fallback to docs/prompts
    const fallbackPath = join('docs', 'prompts', `${name}.md`);
    if (existsSync(fallbackPath)) {
      return readFileSync(fallbackPath, 'utf8');
    }
    throw new Error(`Directive not found: ${name}`);
  }

  async loadContinuousDev() {
    return this.load('continuous-dev');
  }
}

export { DirectiveLoader };

import { watch } from 'fs';
import { join } from 'path';

export class ConfigWatcher {
  constructor({ workspaceRoot, onReload }) {
    this.workspaceRoot = workspaceRoot;
    this.onReload = onReload;
    this.watchers = [];
    this.debounce = null;
  }

  start() {
    const paths = [
      join(this.workspaceRoot, '.autoclaw/config'),
      join(this.workspaceRoot, '.autoclaw/fleet'),
      join(this.workspaceRoot, '.autoclaw/budget'),
    ];

    for (const path of paths) {
      try {
        const watcher = watch(path, { recursive: true }, (eventType, filename) => {
          this.handleChange(path, eventType, filename);
        });
        this.watchers.push(watcher);
      } catch (error) {
        console.warn(`[daemon] Could not watch ${path}:`, error.message);
      }
    }

    console.log('[daemon] Config watcher started');
  }

  handleChange(path, eventType, filename) {
    // Debounce rapid changes
    if (this.debounce) {
      clearTimeout(this.debounce);
    }

    this.debounce = setTimeout(async () => {
      console.log(`[daemon] Config change detected: ${path}/${filename}`);
      try {
        await this.onReload({ path, eventType, filename });
      } catch (error) {
        console.error('[daemon] Reload error:', error.message);
      }
    }, 500);
  }

  stop() {
    if (this.debounce) {
      clearTimeout(this.debounce);
    }
    for (const watcher of this.watchers) {
      watcher.close();
    }
    this.watchers = [];
    console.log('[daemon] Config watcher stopped');
  }
}

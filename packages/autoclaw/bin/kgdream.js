#!/usr/bin/env node
import { Dreamer, Policy } from '../kgdream.js';

import * as ds from '../dataset.js';

#!/usr/bin/env node
import { Dreamer, Policy } from '../kgdream.js';
import { createKG } from '../kg/index.js';

'use strict';

/** Run graph consolidation against the configured KG store. */
(async () => {
  const mode = process.argv[2] || 'light';
  const dryRun = process.argv.includes('--dry-run');
  if (dryRun) console.error('[kgdream] dry-run: no state will be mutated');

  const kg = createKG();
  try {
    const dreamer = new Dreamer({ store: kg.store, policy: new Policy({ dryRun }) });
    const report = await dreamer.runCycle({ mode, reason: 'cli' });
    console.log(JSON.stringify(report, null, 2));
    if (!report.ok) process.exitCode = 1;
  } finally {
    kg.close();
  }
})().catch(e => { console.error('kgdream error:', e.message); process.exit(1); });
        if (e.from === id) out.push({ id: e.to, rel: e.rel, weight: e.weight, edgeId: e.id });

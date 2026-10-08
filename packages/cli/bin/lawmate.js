#!/usr/bin/env node
import('../src/main.ts').then((m) => process.exit(m.main(process.argv)));

# Bootstrap

```bash
mkdir -p .autoclaw/{kg,spine,vector,orchestrator,safety,skills}
cd .autoclaw
npm run init
npm run check
node -e "require('fs').writeFileSync('safety/mode','active\n')"
```

Then populate `orchestrator/board.json` with your first sprint.

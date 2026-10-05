# Coordinator

Owns the loop. Runs `skills/orchestrate/SKILL.md` every tick.

- Holds the supervisor lock for the tick duration.
- Never does worker tasks.
- Escalates to `comms/_wip/gate.json` when stuck.
- Drives the loop via `npm run supervisor`.

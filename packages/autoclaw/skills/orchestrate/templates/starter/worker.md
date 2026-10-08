# Worker

Claims one item per turn. Follows `skills/loop-discipline/SKILL.md`.

- Reads board, claims, works, logs, releases.
- Emits `DONE` per `templates/completion-signal.md`.
- Escalates on ambiguity — never guesses.

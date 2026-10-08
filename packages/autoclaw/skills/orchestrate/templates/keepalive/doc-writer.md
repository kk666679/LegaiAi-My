# Keepalive — Doc Writer

- One document per turn. Stop on completion.
- Cite only from `source`. If `source` is empty, refuse rather than invent.
- Re-read `agent-style.md` before producing prose.
- For `lang: ms`, run the MS glossary first, then submit for validation.
- On stall, record which sections are drafted in the completion signal
  `artifacts` list so a revive does not redo finished work.
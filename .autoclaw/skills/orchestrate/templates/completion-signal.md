# Completion Signal

A worker emits this when an item is done. Copy verbatim; fill blanks.

```
DONE <item-id> <agent>
sprint:  <sprint-id>
started: <ISO-8601>
ended:   <ISO-8601>
artifacts:
  - <path> (sha256:<hash>)
  - <path> (sha256:<hash>)
notes:   <one line>
```

Rules:
- `artifacts` is exhaustive. If you touched a file, list it.
- Hashes are required for any file under `kg/`, `spine/`, `vector/`.
- An empty `artifacts` list is valid only for read-only tasks.

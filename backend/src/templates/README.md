Templates are defined in backend/src/templates/templates.json
Each template folder contains:
- schema.json (JSON Schema, draft-07-ish)
- prompt.md (LLM prompt with {{placeholders}})

Rendering is handled by backend/src/templates/render.js
Validation is handled in workers/legal-drafting.js using a lightweight validator.


# Manifests

Task manifests consumed by `/orchestrate plan`. One YAML file per plan.
The planner reads the first `.yaml` in this directory by default, or the path
given by `plan --manifest <path>`.

Manifest fields (spec plan Phase 1):

| Field | Required | Meaning |
|---|---|---|
| `id` | yes | Unique task id |
| `name` | yes | Human-readable task name |
| `depends_on` | yes | Task ids that must land first (may be `[]`) |
| `scope` | yes | Glob patterns owned exclusively by this task |
| `effort` | yes | Relative sizing, used for bin packing |
| `subtasks` | no | Ordered sub-steps |
| `required_capabilities` | no | Capability tags, defaults to `[]` |

Optional manifest-level blocks: `constraints.mutual_exclusion`,
`constraints.affinity`, `project`.

Validation runs before planning: duplicate ids, dangling `depends_on`
references, and empty scopes are all rejected.
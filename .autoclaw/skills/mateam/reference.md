# Mateam — Reference

## Rules
- Handoffs must be one-directional per step.
- The last step returns control to the coordinator.
- No agent may hold two roles in the same step.

## Deadlock detection
A deadlock exists if agent A waits on B and B waits on A in the same step.
Report as `{ a, b, step }`.

## Bibliography
- Hoare, C. A. R. (1978). *Communicating Sequential Processes.*

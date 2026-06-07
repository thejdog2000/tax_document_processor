# Task: Usage and Audit Tracking

## Goal

Track usage, auditability, and support data by tenant or office.

## Context

- Shared AWS billing is only useful if usage can be attributed in a meaningful way.
- Reviewer mode and support workflows may need traceability.

## Scope

- Record usage per office/tenant.
- Capture enough metadata for troubleshooting and billing later.
- Preserve a traceable history of key processing steps.

## Acceptance Criteria

- Usage can be reported by tenant.
- Support can identify what happened during a packet run.
- The tracking model does not leak internal AWS details to users.

## Open Questions

- What exactly counts as billable or reportable usage?
- How long should audit data be retained?

## Implementation Notes

- Capture useful context without creating unnecessary privacy risk.

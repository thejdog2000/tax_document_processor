# Task: Architecture Decision Spike

## Goal

Compare the current Python-first approach against alternative architectures and write a decision that can guide future implementation.

## Context

- The app already works.
- The current pain points are UI quality, deployment, and future product distribution.
- Python performance is not currently the main bottleneck, but architecture flexibility matters.

## Scope

- Evaluate keeping Python end-to-end.
- Evaluate a split architecture with a separate backend service.
- Evaluate replacing the UI layer while keeping the processing engine.
- Compare speed, packaging, UI quality, and maintainability.

## Acceptance Criteria

- A clear recommendation is written down.
- The recommendation explains why it fits the product goals.
- The recommendation includes what should not be changed yet.

## Open Questions

- What performance baseline do we actually need on a 5-year-old medium PC?
- Which future feature would most justify a split architecture?

## Implementation Notes

- Use product needs and distribution needs as the deciding factors.

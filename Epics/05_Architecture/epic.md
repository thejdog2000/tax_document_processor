# Epic: Architecture Decision and Future Proofing

## Goal

Decide whether Python remains the right long-term foundation for the product and define the boundary between UI, processing, and service layers.

## Product Intent

- Do not rewrite stable logic for its own sake.
- Optimize for maintainability, packaging, UI quality, and distribution.
- Keep the door open for a different UI stack or a split architecture if that clearly helps.

## Scope

- Evaluate Python against alternatives.
- Measure where latency actually comes from.
- Define whether the app should stay monolithic or become a split client/service architecture.

## Acceptance Criteria

- The team has a written architecture decision.
- The decision is based on product goals, not just language preference.
- The processing engine boundary is clear enough for future refactoring.

## Open Questions

- Is the current performance acceptable once Bedrock is in place?
- Would a different UI stack materially improve the product?
- Does a split architecture reduce complexity or add too much operational burden?

## Implementation Notes

- Treat this as a decision spike, not a rewrite mandate.
- Preserve stable code until a better architecture is proven.

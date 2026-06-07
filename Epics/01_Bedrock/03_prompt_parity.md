# Task: Prompt Parity and Bedrock Routing

## Goal

Recreate current Anthropic extraction behavior through Bedrock with minimal output drift.

## Context

- The current prompt encodes tax-specific extraction and validation rules.
- The app already relies on structured JSON and validation flags.
- This task should preserve behavior before optimizing prompt style or model selection.

## Scope

- Port the current extraction prompt to the Bedrock implementation.
- Preserve tax-year validation and all current special-case rules.
- Preserve current document classification and validation output.
- Add only the minimum prompt changes needed for confidence/evidence reporting.

## Acceptance Criteria

- Bedrock output is structurally compatible with the current pipeline.
- Existing validation logic still triggers on the same kinds of issues.
- The extraction result quality is close enough to current Anthropic behavior for v1.
- No fallback provider is introduced.

## Open Questions

- Which parts of the current prompt should be copied verbatim and which should be reworked?
- Should prompt changes be tested against a golden set of documents before release?

## Implementation Notes

- Prefer a stable prompt over a clever one.
- Keep the task focused on parity first, not model optimization.

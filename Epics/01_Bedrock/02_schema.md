# Task: Extraction Schema With Confidence

## Status

Partially complete.

Implemented:
- Prompt asks for `field_metadata`.
- Pipeline preserves scalar extracted fields.
- Pipeline normalizes accidental inline `{value, confidence, evidence}` wrappers.
- Document log can include reviewer metadata.

Remaining:
- Confirm real Bedrock responses consistently include useful evidence.
- Decide whether metadata is required for every important field or only disputed fields.
- Implement UI/backend correction workflow before treating reviewer mode as complete.

## Goal

Extend the extraction schema so each field can carry a confidence value and evidence snippet for reviewer mode.

## Context

- The current app asks the model for a single JSON object.
- Review mode needs a way to identify low-confidence values and show source evidence to a human.
- Confidence should be a routing signal, not the only source of truth.

## Scope

- Add field-level confidence to the extraction contract.
- Add field-level evidence or source snippet to the extraction contract.
- Preserve existing data fields and validation fields.
- Keep the output machine-readable and easy to parse.

## Suggested Schema Shape

- `value`: the extracted value
- `confidence`: integer from 0 to 100
- `evidence`: short text snippet from the PDF or extracted text
- `page`: optional page number when available
- `notes`: optional ambiguity notes

## Acceptance Criteria

- The model returns confidence and evidence for important extracted fields.
- The pipeline can parse the new schema without breaking existing output handling.
- Reviewer mode can identify low-confidence fields using the schema.
- Validation flags still work alongside the new fields.

## Open Questions

- Should confidence be returned for every field, or only for fields that can be disputed?
- Should evidence be stored for each field or only for fields below the review threshold?
- Should the threshold be global, or configurable per field type?

## Implementation Notes

- Do not rely on raw model confidence as if it were statistically calibrated.
- Use the app to enforce review rules even if the model provides a confidence score.

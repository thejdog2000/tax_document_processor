# Task: Reviewer Mode

## Goal

Add a review workflow for low-confidence or flagged fields so a human can verify or correct uncertain extractions.

## Context

- Confidence threshold target: below `90` should be reviewed by default.
- Validation flags should also route an item into review.
- Reviewer mode should make manual correction fast and low-friction.

## Scope

- List low-confidence extracted values.
- Show supporting evidence snippets from the PDF or extracted text.
- Allow quick field correction.
- Make reviewer mode accessible without interrupting the default fast workflow.

## Acceptance Criteria

- Items below the review threshold are surfaced automatically.
- The reviewer can see extracted value, confidence, and evidence in one place.
- The reviewer can correct values without navigating away from the packet.
- Validation flags can also push items into review.

## Open Questions

- Should reviewer mode block completion until all flagged items are addressed?
- Should the threshold be global or configurable later?
- Should evidence snippets come from PDF text extraction, OCR, or both?

## Implementation Notes

- Review mode should be a safety feature, not a separate product path.
- Keep the workflow fast enough that staff are not tempted to skip it.

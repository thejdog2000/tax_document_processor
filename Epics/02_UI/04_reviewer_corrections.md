# Task: Reviewer Corrections Workflow

## Goal

Allow staff to review and correct low-confidence or validation-flagged extracted values before final outputs are considered complete.

## Context

Reviewer metadata exists, but corrections are not wired into workbook/package generation.

## Scope

- Surface low-confidence fields below `90%`.
- Surface all validation-flagged items.
- Show extracted value, confidence, evidence, and source document.
- Allow a reviewer to edit values.
- Apply corrections before workbook/package generation or provide a safe regenerate path.
- Record corrections in the document log.

## Acceptance Criteria

- Reviewer can correct a value without editing Excel manually.
- Corrected value is reflected in generated outputs.
- Correction history is visible in logs.
- Staff cannot mistake unreviewed risky values for fully approved output.

## Open Questions

- Should review happen before workbooks are created, after extraction but before packaging, or as a regenerate step?
- Should reviewer mode block completion?
- Should review thresholds be global or field-specific?


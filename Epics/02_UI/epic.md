# Epic: UI Modernization

## Goal

Replace the current dense desktop experience with a more modern, easier-to-navigate UI optimized for staff processing packets quickly and reviewers validating edge cases.

## Product Intent

- Optimize first for fewer mistakes.
- Optimize second for speed of entry.
- Optimize third for visual polish.
- Keep settings accessible from a corner cog.
- Keep the default workflow on one screen for now.

## Scope

- Redesign the main workflow layout.
- Improve file state visibility and processing status clarity.
- Add reviewer mode for low-confidence or flagged values.
- Improve settings discoverability without making the UI feel busy.

## Out of Scope

- Rewriting the processing engine.
- Changing the tax logic itself unless needed for the UI.
- Deep product onboarding beyond the minimum necessary for staff use.

## Acceptance Criteria

- A staff user can understand the main workflow without training.
- Settings are easy to find but not dominant.
- Low-confidence items can be reviewed quickly.
- The UI makes it hard to miss mistakes or warnings.

## Open Questions

- Should the new UI be a native desktop shell or a web-style desktop interface?
- Should reviewer mode be a separate screen or a panel within the main workflow?
- Which parts of the process should remain one-screen versus step-by-step as the product grows?

## Implementation Notes

- Favor clear hierarchy and visible state over decorative styling.
- Favor a layout that can scale into reviewer workflows later.

# Task: Modern Cross-Platform UI Shell

## Goal

Build a modern desktop UI shell that improves usability on macOS and Windows without sacrificing workflow speed.

## Context

- The app must work cross-platform.
- The current UI is Tkinter-based and functional but dated.
- The primary user is a staff member processing packets quickly.

## Scope

- Design the main screen around the core daily workflow.
- Keep drag-and-drop or equivalent file selection support.
- Keep settings accessible from a visible corner control.
- Improve visual hierarchy, spacing, and state feedback.

## Acceptance Criteria

- The app runs on macOS and Windows with a consistent user experience.
- The main workflow is clear on first load.
- The user can see selected files, client data, output location, and processing state at a glance.

## Open Questions

- Is the best implementation a native cross-platform framework or a web-style desktop wrapper?
- Should the UI be rebuilt independently from the processing layer or alongside it?

## Implementation Notes

- Do not optimize for trendy aesthetics at the expense of readability.
- Preserve the existing task flow unless there is a clear usability win.

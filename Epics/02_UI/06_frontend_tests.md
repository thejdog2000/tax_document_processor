# Task: Frontend/UI Test Coverage

## Goal

Add low-cost tests for the Tkinter UI so simple launch and layout compatibility bugs are caught before manual testing.

## Context

The app hit a Tk compatibility bug when tuple padding was passed to a widget constructor:

```text
_tkinter.TclError: bad screen distance "14 0"
```

Some UI tests should run without a display server, because CI and AI coding sessions may not have a GUI.

## Scope

- Add static checks for Tkinter constructor options that are known to break older/system Tk versions.
- Add import/compile checks for `app.py`.
- Add a smoke-test strategy for launching the UI when a display is available.
- Document how to run UI checks.

## Acceptance Criteria

- A command exists to run UI checks without launching the full app.
- Tuple `padx`/`pady` in widget constructors is caught automatically.
- Missing optional `tkinterdnd2` does not prevent UI import/preview.
- Future UI changes have a clear test command in docs.

## Open Questions

- Should GUI smoke tests run in CI, or only locally on developer machines?
- Should the app expose a test mode that builds widgets without showing first-run dialogs?


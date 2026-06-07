# Task: Installer and First-Run Experience

## Goal

Create an installer that gets a new user to a working app with minimal manual setup.

## Context

- The app should store data in an app data location by default.
- Staff should not need to install Python manually.
- The first-run flow should stay simple.

## Scope

- Package the app into a real installer for macOS and Windows.
- Set default config paths and app data storage behavior.
- Keep the first-run experience guided but lightweight.

## Acceptance Criteria

- A new user can install the app and launch it successfully.
- The app has a clear first-run path for any required setup.
- Logs and config live in a predictable location for troubleshooting.

## Open Questions

- Should the installer also install required runtime dependencies, or should those be bundled differently?
- Should templates ship inside the app bundle or as separate bundled assets?

## Implementation Notes

- The installer should support future annual version bumps cleanly.

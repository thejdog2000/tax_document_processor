# Epic: Packaging and Distribution

## Goal

Package the app as a cross-platform installable product with minimal user setup, automatic updates, and durable configuration storage.

## Product Intent

- Support macOS and Windows.
- Keep setup as close to double-click install as possible.
- Bundle the current Excel templates in the release for v1.
- Store runtime configuration in an app data location.
- Support future yearly tax-code updates through auto-update.

## Scope

- Build a real installer and distribution path.
- Decide on code signing and notarization requirements.
- Standardize config storage location.
- Bundle templates into the release package.

## Out of Scope

- Full cloud-native deployment.
- Advanced template marketplace or customer-specific template uploads.
- Major packaging support for unsupported platforms.

## Acceptance Criteria

- A non-developer can install and run the app on macOS and Windows.
- The app does not require manual Python setup on user machines.
- Configuration persists in a predictable app data location.
- Updates can be delivered without manual file replacement.

## Open Questions

- Which packaging technology best fits the chosen UI architecture?
- What auto-update mechanism should be used on each platform?
- What level of code signing/notarization is required for distribution?

## Implementation Notes

- The installer story should be part of the backlog from the start, not a later polish task.
- Favor a packaging path that can survive annual releases with minimal friction.

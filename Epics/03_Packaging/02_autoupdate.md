# Task: Auto-Update Support

## Goal

Add automatic update support so annual tax changes and bug fixes can be delivered without manual redeployment.

## Context

- The app is expected to live across yearly tax cycles.
- Multiple offices will eventually depend on the same release channel.

## Scope

- Define update channels and versioning strategy.
- Build an update path that works across supported platforms.
- Make update checks safe and predictable.

## Acceptance Criteria

- The app can detect and apply updates without manual replacement of files.
- Users can recover from a failed update path.
- Versioning supports yearly tax releases and hotfixes.

## Open Questions

- Should updates be silent, prompted, or admin-approved?
- Should there be separate channels for stable and pre-release builds?

## Implementation Notes

- Keep the first version simple and robust.
- Avoid auto-update mechanisms that add unnecessary fragility.

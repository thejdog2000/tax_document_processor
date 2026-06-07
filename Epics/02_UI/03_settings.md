# Task: Settings and Preferences UX

## Goal

Make settings easy to find, easy to understand, and safe to change without disrupting the main workflow.

## Context

- Settings should live behind a cog in the corner.
- The app will eventually need product config, AWS config, and template config.
- Default behavior should be sensible even before the user opens settings.

## Scope

- Add a clear settings entry point.
- Separate basic settings from advanced settings if needed.
- Make template, output, and auth-related settings understandable.
- Preserve the ability to change paths and preferences without editing files manually.

## Acceptance Criteria

- Settings are reachable within one click from the main screen.
- A user can tell what each setting does.
- Saving settings does not disrupt the packet workflow.

## Open Questions

- Which settings should be visible by default and which should be tucked under advanced?
- Should template configuration remain user-editable after bundling templates into the release?

## Implementation Notes

- Optimize for clarity, not density.
- Keep dangerous settings visually distinct from routine preferences.

# Task: Code Signing and Trust

## Goal

Determine and implement the code-signing and notarization requirements needed for real-world distribution.

## Context

- Windows distribution may trigger SmartScreen warnings without code signing.
- macOS distribution generally requires signing and notarization for a smooth user experience.

## Scope

- Decide what signing certificates and processes are required.
- Document the signing pipeline for release builds.
- Ensure the packaging workflow can produce trusted builds.

## Acceptance Criteria

- The release process includes the necessary signing steps.
- The backlog clearly records platform-specific trust requirements.

## Open Questions

- What certificates are available or need to be purchased?
- Will distribution happen outside app stores?

## Implementation Notes

- Treat trust and install friction as product quality issues, not just release chores.

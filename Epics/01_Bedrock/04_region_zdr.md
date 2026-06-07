# Task: Region and ZDR Requirements

## Goal

Lock down the Bedrock region and data-handling requirements for production use.

## Context

- The default region should be close to Atlanta.
- Zero data retention is a requirement.
- Networking should be as simple as possible while meeting security requirements.

## Scope

- Select `us-east-1` as the default region.
- Document the production data-retention expectation.
- Determine whether the architecture needs private networking or can use standard AWS endpoints.
- Capture any compliance assumptions that must be verified before launch.

## Acceptance Criteria

- The default region is documented and used consistently.
- The project backlog records the ZDR requirement clearly.
- Any networking assumption is explicit rather than implied.

## Open Questions

- Does the final architecture require VPC endpoints or other private connectivity?
- Are there additional customer-data handling constraints beyond ZDR?

## Implementation Notes

- Treat this as an architecture gate, not a UI feature.
- Do not hardcode assumptions that cannot be changed later without a migration.

# Task: Bedrock Access Path Decision

## Goal

Decide whether production clients call Bedrock directly from the desktop app or through an app-owned backend service.

## Context

Developer installs can use local AWS profiles, but customer offices should not need AWS credentials or console access.

## Options

- Desktop direct to Bedrock using managed credentials.
- Desktop app calls a product backend; backend calls Bedrock.

## Acceptance Criteria

- Decision is documented.
- Auth model is clear for internal developers and customer-office users.
- ZDR/data-retention implications are captured.
- Usage attribution path is compatible with billing needs.

## Open Questions

- What is the minimum backend needed for first paid pilots?
- Does ZDR require specific Bedrock account or contract configuration?
- What audit trail is required per office/user/document packet?


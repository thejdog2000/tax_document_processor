# Task: Bedrock Authentication Strategy

## Goal

Define and implement the authentication path for AWS Bedrock access in a way that supports internal developers now and future customer offices later.

## Context

- Two developers work on separate devices today.
- The long-term product will be sold to multiple accounting offices.
- One AWS Organization and one shared billing relationship are preferred.
- End users should not need direct AWS credentials.

## Recommended Direction

- Use AWS Organizations for central billing and account governance.
- Use IAM Identity Center for the internal admin/developer AWS access path.
- Keep client-office authentication separate from AWS authentication.
- Avoid long-lived AWS access keys in desktop installs when possible.

## Scope

- Define the AWS identity model for developers and admins.
- Define the client/application identity model for accounting-office users.
- Decide where Bedrock permissions live.
- Decide how the app reaches the Bedrock-enabled service or endpoint.

## Acceptance Criteria

- Internal admins can manage AWS access safely.
- Client-office users can use the product without AWS console access.
- The chosen auth model supports one shared billing relationship.
- The design does not require each office to own its own AWS setup.

## Open Questions

- Should the desktop app call Bedrock directly, or should it call an app-owned backend that calls Bedrock?
- If the app calls Bedrock indirectly, what client auth method should it use?
- Should office users authenticate with email/password, SSO, or invitation-based access?
- What audit trail is required for usage and access?

## Implementation Notes

- Favor a design that keeps AWS credentials out of the desktop client.
- Favor a design that is simple for staff to support and simple for firms to onboard.

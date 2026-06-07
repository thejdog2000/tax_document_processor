# Epic: Tenant and Usage Model

## Goal

Define how client offices authenticate to the product, how usage is attributed, and how the shared AWS-backed service is governed.

## Product Intent

- One AWS Organization should own the core infrastructure and billing relationship.
- You and your partner should be the first AWS admins.
- Accounting-office users should authenticate to the app, not directly to AWS.
- Usage should be trackable by office/tenant for support and billing later.

## Scope

- Define tenant structure and office onboarding.
- Define internal admin access and product-user access.
- Define usage tracking and audit expectations.
- Support a future SaaS-like growth path without forcing an immediate architecture rewrite.

## Acceptance Criteria

- Internal AWS administration is separated from end-user access.
- Client offices can be onboarded under one shared business subscription.
- Usage can be attributed to a specific office or tenant.

## Open Questions

- What is the minimum identity model needed for launch?
- What metadata must be stored for each tenant?
- What should a tenant admin be able to see or change?

## Implementation Notes

- Keep the onboarding path simple for accounting firms.
- Avoid exposing AWS concepts to end users unless absolutely necessary.

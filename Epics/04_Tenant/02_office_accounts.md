# Task: Office Account Model

## Goal

Define how accounting offices and their employees access the application.

## Context

- End users should not need AWS console accounts.
- The app will eventually be sold to multiple offices.
- Access control should be understandable for non-technical staff.

## Scope

- Define office-level accounts and roles.
- Define how employees join an office account.
- Define what permissions a standard user and reviewer should have.

## Acceptance Criteria

- A client office can be represented as a tenant in the app.
- Employees can be added to that office without AWS access.
- Roles are clear enough to support everyday operations.

## Open Questions

- Should invitations be email-based, admin-created, or both?
- What is the minimal role set needed for launch?

## Implementation Notes

- Start simple and avoid overbuilding the permissions model.

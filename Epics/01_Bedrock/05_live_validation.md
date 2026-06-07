# Task: Live Bedrock Validation

## Goal

Verify the Bedrock implementation against real PDFs and real AWS account access.

## Context

The code now routes through Bedrock, but live extraction has not been validated in
the target AWS environment.

## Scope

- Confirm AWS credentials/profile can call Bedrock Runtime.
- Confirm the configured Sonnet model ID works in `us-east-1`.
- Run at least one real packet through extraction.
- Capture failures and required setup steps in `docs/BEDROCK_SETUP.md` and `docs/TROUBLESHOOTING.md`.

## Acceptance Criteria

- A real packet extracts through Bedrock.
- Document log is generated.
- Workbooks populate.
- Zip package is created.
- No direct Anthropic API key is required.

## Open Questions

- Which AWS account/profile is the canonical developer environment?
- Which Sonnet model ID should be locked for production builds?


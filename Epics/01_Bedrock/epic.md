# Epic: Bedrock Migration

## Goal

Move all LLM inference from direct Anthropic API usage to AWS Bedrock while preserving current extraction behavior as closely as possible.

## Product Intent

- Keep Sonnet as the default model for all cases in v1.
- Allow future model routing to Haiku or Opus only if explicitly enabled later.
- Preserve prompt behavior, JSON shape, validation flow, and document logging parity with the current implementation.
- Do not introduce fallback providers or alternate inference paths.

## Default Decisions

- AWS region: `us-east-1`
- Primary model: Sonnet
- Fallback behavior: none
- Networking: use the simplest path that satisfies security and ZDR requirements
- Zero data retention: required at the platform/policy level, not by app-side fallback logic

## Scope

- Replace direct Anthropic SDK usage with Bedrock-based inference.
- Preserve extraction prompt intent and output contract.
- Keep the existing document processing pipeline behavior intact.
- Add confidence/evidence fields needed for reviewer mode.
- Add logs and error handling suitable for support and debugging.

## Out of Scope

- Multi-model routing logic beyond Sonnet for v1.
- Full UI redesign.
- Rewriting the document pipeline in another language.
- Tenant billing implementation beyond the needs of Bedrock access and usage attribution.

## Dependencies

- AWS account and organization structure.
- Decision on app identity vs AWS identity boundary.
- Final JSON schema for confidence and evidence fields.
- Packaging plan for how credentials/config are stored on desktop installs.

## Acceptance Criteria

- The app can extract tax documents through AWS Bedrock without using the Anthropic direct API.
- The extracted output remains compatible with the existing pipeline and Excel population logic.
- The app continues to generate document logs, validation flags, and rejection packages.
- Errors are understandable and actionable for staff and developers.
- Sonnet remains the default model for all extraction tasks.

## Open Questions

- Should the app talk directly to Bedrock from the desktop client, or through a small AWS backend service?
- If a backend is introduced, what auth does the client use to reach it?
- What exact confidence schema should the model return for each extracted field?
- What evidence format should be required for reviewer mode?
- How should model output drift be tested against the current Anthropic implementation?

## Implementation Notes

- Keep the prompt and JSON contract as close to the current one as possible.
- Prefer incremental adapters over a rewrite of the processing pipeline.
- If the Bedrock API differs materially, isolate that difference in a small service layer.

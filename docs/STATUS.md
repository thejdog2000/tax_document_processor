# Project Status

Last updated: 2026-06-07

## Implemented

- Tkinter desktop app shell.
- PDF selection by click-to-browse.
- Drag/drop PDF selection when `tkinterdnd2` is installed.
- Settings dialog for AWS region/profile/model, templates, and output folder.
- AWS Bedrock Runtime adapter for Sonnet extraction.
- Bedrock-only inference path.
- Existing extraction prompt and JSON structure preserved as closely as possible.
- Reviewer metadata schema support in extraction output via `field_metadata`.
- Document log includes validation flags, open items, extracted summaries, and reviewer metadata when returned.
- Packet logs include one latest file plus versioned per-run history.
- Internal app diagnostic logging writes to app data, not client output folders.
- Excel population for 1040 and DoubleCheck templates.
- Year mismatch hard stop with rejection package.
- Client output folder package with `SD`, `Review`, `Return`, and `Signature Pages`.
- Unit and fixture-based workbook tests.

## Partially Implemented

- UI modernization: main screen has clearer workflow status, but it is still Tkinter and intentionally incremental.
- Static web-style UI prototype exists in `ui_prototype/`, including main intake and config direction, but it is not connected to the backend.
- Reviewer mode: metadata can be generated and logged, but the backend correction/repopulation workflow is not complete.
- Reviewer UI: current screen should clearly indicate reviewer mode is unavailable until backend support exists.
- Bedrock setup: app code routes through Bedrock, but live account permissions/model access still need environment validation.

## Not Implemented

- Reviewer correction workflow that applies edits before workbook/package generation.
- Backend service for app-owned Bedrock access.
- Production identity model for customer offices.
- Production ZDR verification.
- Installer hardening.
- Code signing.
- Auto-update.
- Usage attribution and billing dashboard.
- Golden-set drift testing against real tax packets after Bedrock migration.
- Per-office configurable output folder/file hierarchy.
- Port from Tkinter to the web-style desktop UI.

## Locked Decisions

- Direct Anthropic API usage is removed.
- No fallback LLM provider.
- Sonnet is the default model.
- Default AWS region is `us-east-1`.
- Keep one-screen default workflow for now.
- Keep settings reachable from a corner cog.

## Current Risk Areas

- Live Bedrock access has not been validated in this environment.
- Reviewer mode can surface metadata, but cannot yet safely correct/rebuild outputs.
- Desktop direct AWS credentials are acceptable for developer use, but likely not final for customer installs.
- Packaging may need dependency verification after the Bedrock and UI changes.
- Templates are bundled in-repo today; production template distribution/update strategy is unresolved.

## Next Verification Targets

1. Run a live Bedrock extraction with AWS credentials in `us-east-1`.
2. Confirm Sonnet model ID and access path for the target AWS account.
3. Run the packaged app build on macOS and Windows.
4. Test a full real packet from PDF selection to generated output folder.
5. Have a tax preparer review generated workbooks and document logs for trust gaps.

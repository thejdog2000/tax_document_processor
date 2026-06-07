# Task: Port Main App To Web-Style Desktop UI

## Goal

Port the working desktop app from the current Tkinter shell to the richer
web-style UI direction captured in `ui_prototype/`.

## Why This Matters

The product is moving from proof-of-concept to a staff-facing workflow tool. The
current Tkinter UI is serviceable for validating the pipeline, but the product
needs a clearer, more modern interface for fast tax packet intake, predictable
settings, and future low-confidence review.

## Current Prototype

Backend-free interactive prototype:

```text
ui_prototype/
├── index.html
├── app.js
├── styles.css
└── README.md
```

This prototype is not connected to the backend and does not replace `app.py` yet.

## Scope

- Choose the desktop shell path before implementation: Tauri, Electron, or another web-style desktop shell.
- Preserve the current Python processing pipeline boundary unless a thin API/bridge is needed.
- Rebuild the main packet intake screen from the prototype direction.
- Keep the default workflow on one screen.
- Keep client output destination on the main screen because it changes per client.
- Keep settings behind a visible corner cog.
- Include a settings/config area with file/folder organization as the first tab.
- Keep reviewer mode visibly unavailable until backend correction/rebuild support exists.
- Do not show or generate zip output anywhere in the UI.

## Required Main Screen Behavior

- Empty state should be useful, not blank.
- PDF selection must support quick browse and eventually drag/drop or equivalent.
- First name and last name are optional.
- Tax year defaults to `2025`.
- Output folder destination remains editable per client.
- `Generate Excel review documents` remains an optional checkbox.
- Primary action label remains `Process Documents`.
- Processing result language should refer to an output folder/package, not a zip.

## Required Config Screen Behavior

First settings tab: `File & Folder Organization`.

The tab should allow:

- Viewing the current default hierarchy.
- Choosing which default folders are created.
- Creating new folders.
- Renaming folders.
- Reordering folders and generated files with a clear drag handle.
- Assigning generated files to folder destinations.
- Configuring PDF filename patterns.
- Configuring generated Excel workbook filename/template patterns.
- Restoring the current implementation defaults.

Default hierarchy:

```text
Client_2025/
├── SD/
├── Review/
├── Return/
├── Signature Pages/
├── logs/
│   └── YYYYMMDD_HHMMSS_document_log.txt
└── document_log_latest.txt
```

Internal diagnostic logs must remain outside client output folders:

```text
~/.tax_processor/logs/app.log
```

## Acceptance Criteria

- A staff user sees a complete empty state immediately on launch.
- No UI text references zip packages.
- The UI can launch without Bedrock credentials.
- The processing bridge can call the existing pipeline without changing extraction behavior.
- The config screen has a visible first tab for file/folder organization.
- The default folder/file hierarchy matches the current implementation.
- The app has a documented local dev command and a test/smoke command.

## Implementation Notes For AI Agents

- Do not rewrite `pipeline.py` as part of the first UI port unless a small bridge requires it.
- Keep the prototype and production app separate until the stack decision is made.
- Favor a thin boundary: UI collects inputs, pipeline processes files, UI displays progress/results.
- Record unresolved architecture decisions in `Epics/05_Architecture/01_decision_spike.md` or the more specific `Epics/05_Architecture/03_ui_shell_and_pipeline_bridge.md` instead of guessing.
- Keep changes incremental and reversible.

## Open Questions

- Should the web-style shell be Tauri or Electron?
- Should the Python pipeline run as a local child process, local HTTP service, or packaged sidecar?
- Should file/folder organization settings be global per workstation or exportable per office?
- Who can edit organization templates in a multi-staff office?

# Task: UI Shell And Pipeline Bridge Decision

## Goal

Decide the production architecture for turning the web-style UI prototype into a
real desktop app without rewriting the tax processing engine.

## Context

The repo now has:

- A working Python/Tkinter app in `app.py`.
- A working Python processing pipeline in `pipeline.py`.
- A static web-style UI prototype in `ui_prototype/`.

The next product step is not simply "make it React." The important decision is
how a polished desktop UI calls the Python pipeline, stores config, streams
progress, and packages cleanly for tax office workstations.

## Options To Evaluate

### Option A: Tauri + React + Python Sidecar

- UI: React/TypeScript.
- Desktop shell: Tauri.
- Pipeline: existing Python code packaged as a sidecar or invoked process.
- Pros: smaller installer, strong desktop feel, modern UI, good long-term path.
- Cons: extra Rust/Tauri packaging complexity, sidecar packaging must be proven.

### Option B: Electron + React + Python Child Process

- UI: React/TypeScript.
- Desktop shell: Electron.
- Pipeline: existing Python code invoked as a child process.
- Pros: fast development, mature ecosystem, straightforward UI tooling.
- Cons: heavier installer/runtime, more memory use.

### Option C: Keep Tkinter Longer

- UI: Tkinter.
- Pipeline: unchanged.
- Pros: least architecture risk short-term.
- Cons: weakest path for polish, testability, layout, and future reviewer UI.

## Recommended Bias

Prefer `Tauri + React + Python sidecar` if packaging a Python sidecar is proven
with a small spike. Fall back to `Electron + React + Python child process` if
Tauri sidecar packaging slows the project down.

Do not rewrite `pipeline.py` into another language during this decision.

## Bridge Requirements

The UI-to-pipeline bridge must support:

- Selecting PDFs.
- Passing optional first/last name.
- Passing tax year, default `2025`.
- Passing per-client output destination.
- Passing `generate_excel_review`.
- Streaming progress lines to the UI.
- Returning success/failure state.
- Opening or showing the output folder path.
- Writing internal diagnostics outside client output folders.

## Config Requirements

Configuration must support:

- AWS region/profile/model settings.
- Template paths.
- Default output folder.
- File/folder hierarchy rules.
- Filename pattern rules.
- Durable app-data storage outside the install directory.
- Import/export of office presets later.

## Acceptance Criteria

- A written architecture recommendation exists.
- One minimal spike proves the recommended shell can call the Python pipeline.
- Progress logs can stream from Python to the UI.
- The app can launch without Bedrock credentials.
- The prototype UI can be mapped to production components without changing the pipeline.
- Packaging implications are documented for macOS and Windows.

## First Spike

Create a tiny desktop shell proof:

1. Web UI button calls a local bridge.
2. Bridge invokes a harmless Python command.
3. Python streams three progress messages.
4. UI displays progress messages.
5. UI receives a final success payload.

Only after that spike should the real pipeline be connected.

## Open Questions

- Can Tauri package the Python sidecar cleanly on both macOS and Windows?
- Should the bridge be process-based, local HTTP, or Tauri command-based?
- How should errors be normalized for staff-facing messages versus diagnostics?
- Which config settings are admin-only versus staff-editable?

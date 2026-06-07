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

## Current Spike State

- React UI has a Diagnostics tab with a `Run Python Bridge Test` action.
- Tauri scaffold exists under `frontend/src-tauri/`.
- `frontend/bridge/progress_probe.py` is packaged as a Tauri sidecar with
  PyInstaller.
- Rust command `run_python_bridge` invokes the packaged sidecar.
- Python probe prints progress JSON lines.
- React listens for `python-bridge-progress` events.
- `npm run build` succeeds for the React frontend.
- `npm run build:sidecar` succeeds for the harmless Python probe sidecar.
- Rust/Cargo is installed locally.
- `cargo check` succeeds for the Tauri shell.
- `npm run dev:tauri` launches the macOS Tauri shell.
- `npm run build:tauri` builds the macOS `.app` and `.dmg` with the sidecar
  included in the app bundle.
- Manual Diagnostics button validation succeeds in the Tauri window:
  - Python process starts.
  - Progress messages stream into React.
  - Final success payload returns to the UI.

## Remaining Merge Concerns

- Decide whether macOS-only packaging proof is enough for merge, or whether
  Windows packaging must be proven first.
- Replace the harmless sidecar probe with the real pipeline entrypoint before
  calling this production-ready.
- Keep the current Python/Tkinter app path available until the real pipeline
  runs through the React/Tauri shell.

## Open Questions

- Can Tauri package the real Python pipeline sidecar cleanly on Windows?
- Should the real pipeline bridge remain Tauri command-based or move to a local
  HTTP process for longer-running jobs?
- How should errors be normalized for staff-facing messages versus diagnostics?
- Which config settings are admin-only versus staff-editable?

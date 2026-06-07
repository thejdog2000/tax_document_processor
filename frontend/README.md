# React Frontend

Real React/Vite implementation path for the web-style desktop UI.

This is not Electron. The intended architecture bias is:

```text
Tauri + React frontend + Python pipeline sidecar/bridge
```

Electron remains a fallback only if the Tauri/Python packaging spike fails or
slows the product down too much.

## Current Scope

- Componentized version of `ui_prototype/`.
- Backend-free state for PDF selection, drag/drop, processing simulation, output preview, and settings tabs.
- Tauri shell scaffold committed.
- Harmless Python bridge probe committed and packaged as a sidecar.
- No tax pipeline hookup yet.

## Run

Install dependencies first:

```bash
cd /path/to/tax_document_processor/frontend
npm install
npm run dev
```

Run the Tauri bridge spike:

```bash
cd /path/to/tax_document_processor/frontend
source "$HOME/.cargo/env"
python3 -m pip install -r ../requirements-dev.txt
npm run dev:tauri
```

This requires Rust/Cargo to be installed locally. If `cargo --version` fails,
install Rust before running the Tauri shell.

Build a local macOS desktop bundle:

```bash
cd /path/to/tax_document_processor/frontend
source "$HOME/.cargo/env"
python3 -m pip install -r ../requirements-dev.txt
npm run build:tauri
```

Current proof status:

- React production build succeeds.
- Python bridge probe succeeds.
- Python bridge probe packages as a Tauri sidecar with PyInstaller.
- Tauri `cargo check` succeeds.
- Tauri dev shell launches on macOS.
- Diagnostics button in the Tauri window streams sidecar progress and returns success.
- Tauri macOS `.app` and `.dmg` build succeeds with the sidecar included.

Still pending before replacing the current app path:

- Real pipeline invocation from the bridge.
- Replacing the harmless sidecar probe with the real tax pipeline sidecar.
- Windows packaging proof.

## Python Sidecar Meaning

A Python sidecar is a bundled Python runtime or executable that ships with the
desktop app. The installed app can run the tax pipeline without requiring office
workstations to already have Python, pip packages, or matching local paths.

The current spike packages only the harmless probe sidecar, so it proves the
desktop packaging pattern. The real tax pipeline still needs its own sidecar
entrypoint before this replaces the current app path.

## Next Step

Before connecting the real Python pipeline, complete:

```text
Epics/05_Architecture/03_ui_shell_and_pipeline_bridge.md
```

The first bridge spike proves that the chosen shell can stream progress from
Python to the React UI. It intentionally runs `bridge/progress_probe.py`, not the
tax processing pipeline.

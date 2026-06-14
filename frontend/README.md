# React / Tauri Frontend

The primary UI for Tax Document Processor. Built with React + Vite inside a Tauri v2 desktop shell, with a Python sidecar for pipeline execution.

## Architecture

```
Tauri (Rust shell)
  └── React / Vite (UI)
  └── tax-runner (Python sidecar binary)
        ├── probe       — diagnostics, proves binary is alive
        ├── pipeline    — full Bedrock extraction pipeline (job JSON via stdin)
        └── settings    — read/write ~/.tax_processor/config.json (JSON via stdin/stdout)
```

IPC pattern: Rust writes JSON to sidecar stdin, drops the write handle (signals EOF), reads JSON-lines events from stdout, and emits them to React as Tauri events.

Settings and config are shared with the Tkinter UI — both read/write `~/.tax_processor/config.json`.

## Running in development

```bash
cd /path/to/tax_document_processor/frontend

# Make sure Python venv is active and Rust is in PATH
source ../.venv/bin/activate
source "$HOME/.cargo/env"

npm install          # first time only
npm run dev:tauri    # builds sidecar, starts Vite, launches Tauri window
```

`dev:tauri` runs `build:sidecar` (PyInstaller) then `tauri dev`. The first run takes ~3 minutes for Cargo to compile. Subsequent runs are faster.

## Building a distributable app

```bash
npm run build:tauri
```

Produces a macOS `.app` and `.dmg` in `src-tauri/target/release/bundle/`.

## Key source files

| File | Purpose |
|------|---------|
| `src/App.jsx` | Main React UI — intake, file selection, pipeline progress, settings panels |
| `src/tauriBridge.js` | All Tauri API calls — pickPdfPaths, runPipeline, loadSettings, saveSettings, pickFolder, pickXlsxFile |
| `src/styles.css` | App styles (imports from `../ui_prototype/styles.css`) |
| `bridge/tax_runner.py` | Python sidecar entrypoint (probe / pipeline / settings subcommands) |
| `bridge/build_sidecar.py` | PyInstaller build script — outputs to `src-tauri/binaries/tax-runner` |
| `src-tauri/src/lib.rs` | Rust Tauri commands: run_probe, run_pipeline, load_settings, save_settings |
| `src-tauri/capabilities/default.json` | Shell + dialog permissions |
| `src-tauri/tauri.conf.json` | Tauri config — window size, sidecar binary path |

## Tauri permissions

The app uses two Tauri plugins:
- `tauri-plugin-shell` — spawn the sidecar, read stdout, write stdin
- `tauri-plugin-dialog` — native macOS file/folder pickers

Both are registered in `src-tauri/Cargo.toml` and `capabilities/default.json`.

## Confirmed working

- React production build
- Python sidecar builds with PyInstaller and ships in the `.app`
- Tauri `cargo check` and full dev build on macOS
- Diagnostics probe streams progress from sidecar to React
- Full pipeline (multi-PDF → Bedrock → Excel workbooks) runs end-to-end
- Bedrock telemetry logs to `~/.tax_processor/logs/app.log`
- Native file picker (PDF and folder selection)
- Settings load from and save to `~/.tax_processor/config.json`
- Saved output folder pre-fills the main screen on launch

## Not yet done

- UI redesign (branch: `ui-redesign`) — migrate to blue/white enterprise layout
- Windows packaging validation
- Staff workflow feedback collection
- Reviewer corrections workflow

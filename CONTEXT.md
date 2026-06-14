# Tax Document Processor — Project Context

## What This Is

Desktop app for tax accountants. Takes a set of client PDF tax documents (W-2s, 1099s, prior-year returns, etc.), runs them through an AI extraction pipeline, and produces a structured client output package: renamed source files, populated Excel review workbooks (1040 and DoubleCheck templates), a document log, and a consistent folder hierarchy (`SD/`, `Review/`, `Return/`, `Signature Pages/`).

The app is in active development — past proof-of-concept, not yet production-ready. Real Bedrock end-to-end processing is confirmed working through both the Tkinter UI and the React/Tauri UI. The primary remaining blockers are reviewer corrections workflow, UI redesign (blue/white enterprise design), and packaging/code signing.

## Tech Stack

- **UI (primary)**: Python / Tkinter (desktop app, `app.py`) — keep as fallback until Tauri UI is fully validated across real packets
- **UI (new)**: React + Vite + Tauri (`frontend/`) — working end-to-end; real packets process through this path via `tax-runner` sidecar
- **Pipeline**: Python (`pipeline.py`) — PDF extraction, validation, Excel population, package output. Shared by both UIs.
- **LLM inference**: AWS Bedrock Runtime / Claude Sonnet via `bedrock_client.py`
- **PDF extraction**: `pdfplumber` (text layer) + Bedrock (AI extraction)
- **Excel**: `openpyxl`
- **Settings persistence**: JSON at `~/.tax_processor/config.json`
- **Tauri bridge**: single `tax-runner` sidecar (`frontend/bridge/tax_runner.py`) — subcommands: `probe` (diagnostics), `pipeline` (real extraction), `settings` (read/write `~/.tax_processor/config.json` via stdin/stdout JSON)
- **Logging**: rotating log at `~/.tax_processor/logs/app.log` — both Tkinter and Tauri paths write here; includes Bedrock call telemetry
- **Tests**: `unittest` fixture-based workbook tests in `tests/`

## Current Sprint Goal

React/Tauri UI is end-to-end with real Bedrock calls confirmed. Settings UI wired (AWS/Bedrock tab and Templates tab load from and save to `~/.tax_processor/config.json`). Next priorities:

1. **UI redesign** — migrate from current editorial/organic design to clean blue/white enterprise layout (branch: `ui-redesign`). See scaffold in `Epics/02_UI/08_web_style_ui_port.md`.
2. **Staff workflow feedback** — collect practical feedback from tax staff on the React UI (`Epics/02_UI/05_staff_workflow_feedback.md`)
3. **Reviewer corrections workflow** — backend correction → repopulation before package output

## Key Files

```
app.py                        Tkinter UI — file selection, settings dialog, pipeline trigger
pipeline.py                   Core pipeline — extraction, validation, Excel population, package output
bedrock_client.py             AWS Bedrock Runtime adapter (all LLM calls go here, with telemetry logging)
app_logging.py                Rotating diagnostic log (~/.tax_processor/logs/app.log)
settings.py                   Persistent local settings
requirements.txt              Runtime dependencies
requirements-dev.txt          Dev/Tauri spike dependencies
tests/                        Logic and fixture-based workbook tests
Epics/                        Product backlog (01_Bedrock, 02_UI, 03_Packaging, 04_Tenant, 05_Architecture)
docs/                         Architecture, status, quickstart, config, troubleshooting docs
ui_prototype/                 Static web-style UI prototype (reference only)
frontend/                     React/Vite/Tauri UI — working, real pipeline connected
frontend/bridge/tax_runner.py   Unified sidecar CLI — probe / pipeline / settings subcommands
frontend/bridge/build_sidecar.py PyInstaller wrapper to bundle tax_runner.py into binaries/tax-runner
frontend/src-tauri/src/lib.rs   Tauri Rust commands: run_probe, run_pipeline, load_settings, save_settings
frontend/src-tauri/capabilities/default.json  Shell + dialog permissions
frontend/src/tauriBridge.js     JS bridge: pickPdfPaths, runProbe, runPipeline, loadSettings, saveSettings, pickFolder, pickXlsxFile
frontend/src/App.jsx            Main React UI (intake, settings panels — AWS/Bedrock + Templates tabs)
SETUP.md                        End-to-end onboarding guide (Python, AWS/Bedrock, Rust, Tauri, first run)
```

## Bedrock Logging

Every `invoke_model` call in `bedrock_client.py` logs to `~/.tax_processor/logs/app.log`:

- `bedrock.invoke_start` — model, region, max_tokens, prompt_chars
- `bedrock.invoke_success` — latency_ms, input_tokens, output_tokens, stop_reason
- `bedrock.invoke_error` — latency_ms, error type and message

Both the Tkinter path and the Tauri sidecar path call `configure_app_logging()` before running, so all calls land in the same log.

## Do Not Touch

- **Inference path**: all LLM calls must go through `bedrock_client.py`. Do not reintroduce direct Anthropic SDK usage or add fallback providers.
- **Sonnet as default model**: do not change the default model without an explicit architecture decision.
- **AWS region default** (`us-east-1`): do not change without explicit decision.
- **Extraction schema**: do not alter the existing JSON structure or `field_metadata` shape unless the task explicitly requires it.
- **Client output folder structure** (`SD/`, `Review/`, `Return/`, `Signature Pages/`): do not restructure without an explicit epic.
- **Tkinter UI (`app.py`)**: do not remove or disable until the Tauri UI is validated across multiple real packets and staff-approved.
- **Reviewer mode**: do not surface reviewer correction workflow as complete — it is not. Backend correction/repopulation is not implemented.
- **`tests/last_*.log`**: generated test logs, do not commit.

# Tax Document Processor

Desktop app for turning client tax-document PDFs into renamed source files,
populated review workbooks, document logs, and a consistent client folder package.

The app currently runs locally, uses AWS Bedrock/Sonnet for extraction, and does
not use direct Anthropic API keys.

## Current Status

This is still moving from proof-of-concept toward product.

Implemented:

- Local Tkinter desktop app
- PDF selection by click-to-browse
- Drag/drop when `tkinterdnd2` is installed
- Bedrock-only extraction path
- Excel population
- Document logs
- Year-mismatch rejection package

Not production-ready yet:

- Reviewer correction workflow
- Customer-office auth model
- Packaged installer/code signing
- Production Bedrock/ZDR validation
- Usage attribution and billing

See `docs/STATUS.md` for the detailed status.

## Prioritization / Next Steps

From an entrepreneur perspective:

1. Validate one real end-to-end packet with a friendly tax office user.
2. Decide pilot scope: internal-only, one firm, or paid beta.
3. Prioritize trust blockers over polish: reviewer workflow, audit trail, and document log clarity.
4. Decide customer auth and billing model before investing heavily in packaging.
5. Define the acceptance criteria for a first paid pilot.

From an AI engineer perspective:

1. Complete `Epics/01_Bedrock/05_live_validation.md`.
2. Build golden packet drift tests from real PDFs.
3. Implement reviewer corrections before presenting reviewer mode as usable.
4. Decide desktop-direct Bedrock vs backend service.
5. Add repeatable verification commands or CI so AI agents can test consistently.

From a tax accountant/user perspective:

1. Confirm generated workbooks match how preparers actually review returns.
2. Identify fields staff still manually double-check.
3. Decide which warnings must block completion.
4. Make document logs clearer for preparer handoff.
5. Test confusing packets: mixed years, spouses, TN/AL state withholding, brokerage 1099s, and handwritten notes.

Recommended immediate sequence:

1. Live Bedrock validation.
2. Staff workflow feedback.
3. Reviewer corrections workflow.

## Quick Start

Preview the UI:

```bash
cd /path/to/tax_document_processor
python3 app.py
```

Full dependency setup:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
python app.py
```

If `tkinterdnd2` is missing, drag/drop is disabled, but click-to-browse should
still work.

## React/Tauri Spike Setup

The future UI path is being spiked in `frontend/` with React, Vite, Tauri, and a
Python bridge. This does not run the real tax pipeline yet.

Required local tools:

- Python 3
- Node.js/npm for the React frontend
- Rust/Cargo for the Tauri desktop shell
- PyInstaller for packaging the Python sidecar probe

Dependency definitions live in:

- Python: `requirements.txt`
- React/Tauri npm packages: `frontend/package.json`
- Tauri Rust crate packages: `frontend/src-tauri/Cargo.toml`

Run the React browser preview:

```bash
cd /path/to/tax_document_processor/frontend
npm install
npm run dev
```

Run the Tauri desktop spike:

```bash
cd /path/to/tax_document_processor/frontend
source "$HOME/.cargo/env"
python3 -m pip install -r ../requirements-dev.txt
npm install
npm run dev:tauri
```

Build the macOS desktop bundle:

```bash
cd /path/to/tax_document_processor/frontend
source "$HOME/.cargo/env"
python3 -m pip install -r ../requirements-dev.txt
npm run build:tauri
```

Validate the spike by opening the Tauri Diagnostics tab and clicking
`Run Python Bridge Test`. Success means Python progress lines stream into the UI
and the final message says `Python bridge completed successfully.`

## Documentation

| Need | Read |
|---|---|
| Open the app quickly | `docs/QUICKSTART.md` |
| Set up a dev environment | `docs/DEVELOPMENT.md` |
| Understand settings | `docs/CONFIGURATION.md` |
| Configure AWS Bedrock | `docs/BEDROCK_SETUP.md` |
| Fix common errors | `docs/TROUBLESHOOTING.md` |
| Understand the app structure | `docs/ARCHITECTURE.md` |
| See implementation status | `docs/STATUS.md` |
| Work efficiently with AI | `docs/AI_DEVELOPMENT.md` |
| Guide AI agents | `AGENTS.md` |
| Work from the backlog | `Epics/README.md` |

## Daily Workflow

1. Open the app.
2. Select PDF tax documents.
3. Enter client last name and first name.
4. Confirm output folder.
5. Process documents.
6. Review `document_log_latest.txt`, generated workbooks, and output folder.

Packet log history is saved in each client folder under `logs/`. Internal app
diagnostics are saved separately at `~/.tax_processor/logs/app.log`.

## Key Rules

- Bedrock is the only inference path.
- Sonnet is the default model.
- Default AWS region is `us-east-1`.
- No fallback LLM provider.
- Reviewer confidence is a routing signal, not a guarantee.
- Reviewer correction workflow is not complete yet.

## Main Files

```text
app.py             Desktop UI
pipeline.py        Extraction, validation, Excel, package flow
bedrock_client.py  Thin Bedrock Runtime adapter
settings.py        Local settings storage
tests/             Logic and fixture tests
docs/              Human and AI development docs
Epics/             Product backlog and implementation tasks
```

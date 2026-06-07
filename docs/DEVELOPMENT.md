# Development

## Setup

```bash
cd /path/to/tax_document_processor
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
```

## Toolchain Requirements

- Python 3 for the current app and processing pipeline.
- Node.js/npm for the React frontend under `frontend/`.
- Rust/Cargo for the Tauri desktop shell under `frontend/src-tauri/`.
- PyInstaller for packaging the Python bridge probe sidecar.

Dependency manifests:

- Python packages: `requirements.txt`
- Python dev/packaging packages: `requirements-dev.txt`
- npm packages and scripts: `frontend/package.json`
- Rust crates: `frontend/src-tauri/Cargo.toml`

If Tauri cannot find Cargo, run:

```bash
source "$HOME/.cargo/env"
cargo --version
```

## Run The App

```bash
python app.py
```

## Run Tests

Quick logic tests:

```bash
python tests/test_logic.py
```

Static UI checks:

```bash
python tests/test_ui_static.py
python tests/test_ui_prototype_static.py
python tests/test_react_frontend_static.py
```

React/Tauri checks:

```bash
cd frontend
npm install
npm run build
python3 -m pip install -r ../requirements-dev.txt
source "$HOME/.cargo/env"
npm run build:sidecar
npm run dev:tauri
```

Workbook fixture tests:

```bash
python tests/run_tests.py --unit --fixture thornton_mfj
python tests/run_tests.py --unit --fixture year_mismatch
```

Syntax check without writing bytecode into protected system cache paths:

```bash
PYTHONPYCACHEPREFIX=/private/tmp/taxparser_pycache python -m py_compile app.py pipeline.py settings.py bedrock_client.py
```

## Development Rules

- Keep UI and pipeline changes separated when possible.
- Keep commits small and scoped.
- Do not commit generated `tests/last_*.log` files unless intentionally updating test artifacts.
- For AI-assisted changes, read `AGENTS.md` before editing.

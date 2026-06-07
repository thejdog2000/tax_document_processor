# Development

## Setup

```bash
cd /Users/jacobs/Documents/Claude/Projects/TaxParser/tax_document_processor
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
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

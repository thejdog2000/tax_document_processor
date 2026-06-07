# AI Agent Instructions

This project is developed heavily with AI assistance. This file is the first stop
for future AI agents.

## Read First

1. `README.md`
2. `docs/STATUS.md`
3. `docs/ARCHITECTURE.md`
4. The relevant epic under `Epics/`

## Project Rules

- Keep changes minimal, reversible, and easy to review.
- Preserve existing extraction, validation, packaging, and Excel behavior unless the task explicitly says otherwise.
- Route LLM inference through AWS Bedrock only.
- Do not add direct Anthropic API usage or fallback LLM providers.
- Keep Sonnet as the default model unless a later task explicitly changes routing.
- Keep `us-east-1` as the default AWS region.
- Do not rewrite the desktop app or processing pipeline unless a small incremental change is impossible.
- Treat reviewer confidence as a routing heuristic, not as truth.
- Reviewer mode correction workflow is not complete yet. Do not present it as production-ready.
- Prefer native Tkinter improvements for now; a framework swap requires an explicit architecture decision.
- If a decision is pending, record it in docs or epic notes instead of guessing.

## Before Editing

- Identify expected files to change.
- State the main risks.
- Check the current git status.
- Do not revert user changes unless explicitly asked.

## Common Commands

Run the UI:

```bash
python3 app.py
```

Install dependencies in a local virtual environment:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
python app.py
```

Run quick verification:

```bash
PYTHONPYCACHEPREFIX=/private/tmp/taxparser_pycache python3 -m py_compile app.py pipeline.py settings.py bedrock_client.py
python3 tests/test_logic.py
```

Run workbook fixture tests:

```bash
python3 tests/run_tests.py --unit --fixture thornton_mfj
python3 tests/run_tests.py --unit --fixture year_mismatch
```

## Dependency Notes

- `tkinterdnd2` enables drag/drop. If missing, the app should still launch with click-to-browse.
- `boto3` is required for live Bedrock extraction.
- `openpyxl` is required for workbook population.
- `pdfplumber` is required for text-layer extraction from PDFs.

## Commit Hygiene

- Keep commits scoped by purpose.
- Do not mix docs, UI, backend, and test fixture churn unless the task truly spans them.
- Generated test logs under `tests/last_*.log` are usually not part of feature commits.


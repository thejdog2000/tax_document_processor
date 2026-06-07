# Quickstart

Use this when you want to open the app locally.

## Preview The UI

From the project folder:

```bash
cd /path/to/tax_document_processor
python3 app.py
```

If `tkinterdnd2` is not installed, drag/drop is unavailable, but the app should
still open and allow click-to-browse file selection.

## Full Local Setup

Create and activate a virtual environment:

```bash
cd /path/to/tax_document_processor
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
python app.py
```

## First Run

1. Open the app.
2. Click the settings cog.
3. Confirm AWS region/profile/model if needed.
4. Select the 1040 and DoubleCheck templates.
5. Select the default output folder.
6. Save settings.

## Current Limitations

- Live processing requires AWS Bedrock credentials and model access.
- Reviewer correction workflow is not complete yet.
- Drag/drop requires `tkinterdnd2`; click-to-browse works as the fallback.

# Troubleshooting

## App Fails: `ModuleNotFoundError: No module named 'tkinterdnd2'`

Cause: the current Python environment does not have the optional drag/drop package.

Fix:

```bash
pip install -r requirements.txt
```

Fallback: the app should still open without `tkinterdnd2`; drag/drop will be disabled
and click-to-browse should remain available.

## App Fails: `ModuleNotFoundError: No module named 'openpyxl'`

Cause: workbook dependency is missing.

Fix:

```bash
pip install -r requirements.txt
```

## App Fails: `ModuleNotFoundError: No module named 'pdfplumber'`

Cause: PDF text extraction dependency is missing.

Fix:

```bash
pip install -r requirements.txt
```

## Bedrock Credential Error

Cause: AWS credentials are missing, expired, or do not have Bedrock access.

Fix:

```bash
aws sso login --profile your-profile
AWS_PROFILE=your-profile python app.py
```

Also confirm the same profile is selected in Settings if you are launching from the UI.

## Bedrock Model Access Error

Cause: the configured AWS account/region does not have access to the selected Sonnet model.

Fix:

- Confirm region is `us-east-1`.
- Confirm model access in AWS Bedrock.
- Confirm the configured model ID matches the account's available Bedrock model ID.

## Templates Missing

Cause: template paths are empty or point to moved files.

Fix:

1. Open Settings.
2. Browse to `25_1040.xlsx`.
3. Browse to `2025_Tax_Return_Double_Check.xlsx`.
4. Save settings.

## `py_compile` Permission Error On macOS

Cause: Python is trying to write bytecode under a protected cache path.

Fix:

```bash
PYTHONPYCACHEPREFIX=/private/tmp/taxparser_pycache python3 -m py_compile app.py pipeline.py settings.py bedrock_client.py
```

## Reviewer Mode Confusion

Reviewer metadata support exists in the extraction schema and logs, but correction
workflow is not complete. The UI should not present reviewer correction as available
until that backend workflow is implemented.


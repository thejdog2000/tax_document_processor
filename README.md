# Tax Document Processor — Setup & Deployment Guide

## What This Is
A desktop application that runs your full tax document pipeline locally.
Staff drag PDFs onto the window → it calls AWS Bedrock/Sonnet → outputs renamed PDFs,
populated Excel templates, and a zip package. No Claude.ai or direct Anthropic API key required.

---

## Prerequisites (do once, on YOUR machine)

1. **Python 3.10 or higher**
   Download from https://python.org/downloads
   ✅ Check "Add Python to PATH" during install

2. **AWS Bedrock access**
   Configure AWS credentials through the standard AWS chain (for example IAM Identity Center/SSO, AWS profile, or environment provided by your deployment).
   Default region is `us-east-1`; Sonnet is the default model.

3. **Your two Excel templates** — have their file paths ready:
   - `25_1040.xlsx` (Glenn Reeves template)
   - `2025_Tax_Return_Double_Check.xlsx` (Firm DoubleCheck template)

---

## Building the App (developer/owner only — done once)

1. Open a Command Prompt in this folder (`tax_processor/`)
2. Double-click `build.bat`
   - Installs all dependencies
   - Builds `dist\TaxProcessor\TaxProcessor.exe`
   - Takes about 2–5 minutes

3. **(Optional) Create a proper installer:**
   - Download Inno Setup from https://jrsoftware.org/isinfo.php
   - Open `installer.iss` in Inno Setup Compiler
   - Click Build → produces `TaxProcessor_Setup.exe`
   - This is what you hand to staff — one double-click install

---

## Deploying to Staff

**Option A — Folder copy (no installer needed):**
Copy the entire `dist\TaxProcessor\` folder to each staff machine.
Staff double-clicks `TaxProcessor.exe` inside it.
No Python installation required on staff machines.

**Option B — Installer:**
Build `TaxProcessor_Setup.exe` using Inno Setup (see above).
Staff double-clicks the setup file → installs like any normal program.

---

## First-Run Configuration (staff does this once)

1. Launch Tax Document Processor
2. Click **⚙ Settings** (top right)
3. Enter:
   - **AWS Region** — defaults to `us-east-1`
   - **AWS Profile** — optional local AWS profile name for developer installs
   - **Bedrock Model ID** — defaults to Sonnet
   - **1040 Template** — browse to `25_1040.xlsx`
   - **DoubleCheck Template** — browse to `2025_Tax_Return_Double_Check.xlsx`
   - **Default Output Folder** — where client zip packages are saved (e.g., a shared network drive)
4. Click **Save & Close**

Settings are stored in `C:\Users\[name]\.tax_processor\config.json` — never in the app folder.

---

## Using the App (daily workflow)

1. Open Tax Document Processor
2. Drag client PDFs onto the drop zone (or click to browse)
3. Enter client Last Name and First Name
4. Confirm output folder
5. Click **▶ Process Documents**
6. Watch the log — takes ~20–60 seconds depending on number of documents
7. Find the zip package in your output folder

---

## Pipeline Rules (built in — no action needed)

| Rule | Behavior |
|---|---|
| Year mismatch | Hard stop → rejection_log.txt + client_request.txt |
| Missing birthdates | Defaults to age 40, logged as Open Item |
| TN clients | State WH set to $0 automatically |
| 401k deferral > $23,500 | Flagged in document log |
| SS/Medicare math errors | Flagged in document log |
| 1099-R taxable > gross | Flagged in document log |

---

## Bedrock Access & Billing

- The app does not use direct Anthropic API keys.
- Bedrock credentials come from AWS configuration outside the app.
- Billing and usage are managed in AWS.
- Production identity, ZDR, and networking assumptions are tracked in `Epics/01_Bedrock/`.

---

## Troubleshooting

**App won't open:** Make sure the entire `dist\TaxProcessor\` folder was copied,
not just `TaxProcessor.exe`.

**AWS credential error:** Confirm your AWS profile/SSO session or deployment-provided credentials can call Bedrock Runtime in `us-east-1`.

**Template not found:** Open Settings and re-browse to your Excel templates.
If templates were moved, re-browse to the new location.

**Extraction error on a PDF:** The PDF may be scanned/image-only. Bedrock/Sonnet can still
read most scanned docs, but very low-quality scans may fail. Check the processing log.

**Excel cells wrong:** The cell mappings in `pipeline.py` match your templates as of
build date. If you update the templates, cell positions may shift. Contact your
developer to update the mappings.

---

## File Structure

```
tax_processor/
├── app.py           # GUI application
├── pipeline.py      # Processing logic (Bedrock, Excel, file ops)
├── bedrock_client.py # Thin Bedrock Runtime adapter
├── settings.py      # Settings storage
├── requirements.txt # Python dependencies
├── build.bat        # One-click builder
├── build.spec       # PyInstaller config
├── installer.iss    # Inno Setup config (optional installer)
└── README.md        # This file
```

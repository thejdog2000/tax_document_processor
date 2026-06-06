# Tax Document Processor — Setup & Deployment Guide

## What This Is
A desktop application that runs your full tax document pipeline locally.
Staff drag PDFs onto the window → it calls Claude API → outputs renamed PDFs,
populated Excel templates, and a zip package. No Claude.ai required.

---

## Prerequisites (do once, on YOUR machine)

1. **Python 3.10 or higher**
   Download from https://python.org/downloads
   ✅ Check "Add Python to PATH" during install

2. **Your Anthropic API Key**
   Get one at https://console.anthropic.com
   Billing is per-token (~$0.10–$0.30 per client packet, varies by document count)

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
   - **API Key** — your Anthropic API key (you manage this)
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

## API Key & Billing

- The API key is entered in Settings and stored locally on the machine
- Anthropic bills per token — roughly $0.10–$0.30 per client packet
- Monitor usage at https://console.anthropic.com/usage
- You can rotate or revoke the key anytime from the Anthropic console

---

## Troubleshooting

**App won't open:** Make sure the entire `dist\TaxProcessor\` folder was copied,
not just `TaxProcessor.exe`.

**"No API Key" error:** Open Settings and paste your key from console.anthropic.com

**Template not found:** Open Settings and re-browse to your Excel templates.
If templates were moved, re-browse to the new location.

**Extraction error on a PDF:** The PDF may be scanned/image-only. Claude can still
read most scanned docs, but very low-quality scans may fail. Check the processing log.

**Excel cells wrong:** The cell mappings in `pipeline.py` match your templates as of
build date. If you update the templates, cell positions may shift. Contact your
developer to update the mappings.

---

## File Structure

```
tax_processor/
├── app.py           # GUI application
├── pipeline.py      # Processing logic (Claude API, Excel, file ops)
├── settings.py      # Settings storage
├── requirements.txt # Python dependencies
├── build.bat        # One-click builder
├── build.spec       # PyInstaller config
├── installer.iss    # Inno Setup config (optional installer)
└── README.md        # This file
```

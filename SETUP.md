# Setup Guide — Tax Document Processor

This guide walks through setting up the app on a Mac from scratch. You don't need a technical background — just follow the steps in order. If you get stuck, paste the error message into an AI assistant (Claude, ChatGPT, etc.) and ask for help.

---

## What you'll install

| Tool | Why |
|------|-----|
| Python 3.11+ | Runs the tax extraction pipeline |
| Rust + Cargo | Required by Tauri to build the desktop app shell |
| Node.js + npm | Required to build the React frontend |
| AWS CLI (optional) | Makes it easier to set up AWS credentials |

---

## Part 1 — Python

### 1.1 Check if Python is already installed

Open **Terminal** (search for it with Cmd+Space) and run:

```bash
python3 --version
```

If you see `Python 3.11.x` or higher, skip to step 1.3. If you see `Python 3.9` or lower, install a newer version.

### 1.2 Install Python (if needed)

Go to https://www.python.org/downloads/ and download the latest Python 3.11 or 3.12 installer for macOS. Run the installer and follow the prompts.

### 1.3 Create a virtual environment

A virtual environment keeps this app's packages separate from everything else on your Mac.

```bash
cd /path/to/tax_document_processor   # replace with the actual folder path
python3 -m venv .venv
source .venv/bin/activate
```

You should see `(.venv)` at the start of your terminal prompt. You'll need to run `source .venv/bin/activate` each time you open a new terminal window.

### 1.4 Install Python packages

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

This installs `boto3` (AWS SDK), `openpyxl` (Excel), `pdfplumber` (PDF reading), and `tkinterdnd2` (drag-and-drop for the Tkinter UI).

---

## Part 2 — AWS credentials and Bedrock access

The app uses AWS Bedrock to run AI extraction on PDFs. You need an AWS account with Bedrock access enabled.

### 2.1 Get AWS credentials

Ask your AWS account administrator for:
- **Access key ID** (looks like `AKIAIOSFODNN7EXAMPLE`)
- **Secret access key** (a long random string)
- **AWS region** (use `us-east-1` unless told otherwise)

### 2.2 Request Bedrock model access

1. Log in to the AWS Console at https://console.aws.amazon.com
2. Search for **Bedrock** in the top search bar
3. Go to **Model access** in the left sidebar
4. Find **Claude** models from Anthropic and click **Request access**
5. Wait for approval (usually instant for Claude Sonnet)

The app uses: `us.anthropic.claude-sonnet-4-6`

### 2.3 Configure credentials on your Mac

Run this in Terminal:

```bash
aws configure
```

Enter your Access key ID, Secret access key, and region when prompted. Leave the output format blank (just press Enter).

If you don't have the AWS CLI installed:

```bash
pip install awscli
aws configure
```

Alternatively, you can set the credentials in the app's Settings panel after launching.

### 2.4 Verify Bedrock access

```bash
source .venv/bin/activate
python3 tests/smoke_bedrock.py
```

You should see a confirmation that Bedrock can be reached. If you see an access error, the model access request may still be pending, or your credentials may need the `bedrock:InvokeModel` IAM permission.

---

## Part 3 — Rust and Cargo (for the Tauri desktop app)

Rust is the language that builds the Tauri desktop shell. You only need to install it once.

### 3.1 Install Rust

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

When prompted, choose option **1** (default install). After it finishes:

```bash
source "$HOME/.cargo/env"
rustc --version   # should print rustc 1.7x.x
```

Rust installation takes 2–5 minutes.

### 3.2 Install Tauri CLI dependencies (macOS only)

Tauri needs Xcode Command Line Tools. If you haven't already installed them:

```bash
xcode-select --install
```

A dialog will pop up — click Install and wait.

---

## Part 4 — Node.js and npm

### 4.1 Check if Node.js is installed

```bash
node --version
```

If you see `v18.x` or higher, you're good. If not, install it.

### 4.2 Install Node.js (if needed)

Go to https://nodejs.org and download the **LTS** version. Run the installer.

### 4.3 Install frontend packages

```bash
cd frontend
npm install
```

This installs React, Vite, and Tauri's JavaScript packages. Takes about a minute.

---

## Part 5 — Run the app

There are two ways to run the app. Start with the **Tkinter UI** to verify your AWS setup works, then use the **Tauri UI** for the full experience.

### Option A — Tkinter UI (quick test)

```bash
cd /path/to/tax_document_processor
source .venv/bin/activate
python3 app.py
```

This opens a simple desktop window. Use it to confirm your AWS credentials and Bedrock access work before setting up Tauri.

### Option B — Tauri UI (full app)

```bash
cd /path/to/tax_document_processor/frontend
source "$HOME/.cargo/env"
source "../.venv/bin/activate"
npm run dev:tauri
```

What `dev:tauri` does:
1. Builds the Python sidecar into a binary (`bridge/tax_runner.py` → `binaries/tax-runner`)
2. Starts the Vite development server (React UI)
3. Launches the Tauri desktop window

The first run takes 3–5 minutes as Cargo downloads and compiles Rust dependencies. Subsequent runs are faster.

---

## Part 6 — First-time settings

When the app opens for the first time, click **Settings** (gear icon, top right).

| Setting | What to enter |
|---------|--------------|
| AWS Region | `us-east-1` (or your region) |
| AWS Profile | Leave blank for default credentials |
| Bedrock Model ID | `us.anthropic.claude-sonnet-4-6` |
| 1040 Template | Path to your 1040 review Excel template (`.xlsx`) |
| DoubleCheck Template | Path to your DoubleCheck Excel template (`.xlsx`) |
| Default Output Folder | Folder where client packages will be saved |

Click **Save settings**. These persist to `~/.tax_processor/config.json` so you don't need to re-enter them each time.

---

## Part 7 — Run your first packet

1. In the Tauri UI, click **Browse Files** and select the client's PDF documents
2. Optionally enter the client's first and last name
3. Confirm the output folder is correct
4. Click **Process Documents**

The pipeline will:
- Read and classify each PDF
- Call AWS Bedrock to extract tax field data
- Rename source files into `SD/` subfolder
- Populate the 1040 and DoubleCheck Excel templates into `Review/`
- Write a document log
- Zip the package

Logs are written to `~/.tax_processor/logs/app.log` — check there if something goes wrong.

---

## Troubleshooting

**"cargo: command not found"** — Run `source "$HOME/.cargo/env"` to load Rust into the current terminal session.

**"Cannot find module '@tauri-apps/...'"** — Run `npm install` inside the `frontend/` folder.

**"AccessDeniedException" from Bedrock** — The model access request may be pending, or the IAM user may need `bedrock:InvokeModel` permission. Check the AWS Console → Bedrock → Model access.

**"Invalid JSON job input"** — The PDF paths weren't passed correctly. Make sure you selected files using the app's Browse button, not by dragging files into the browser dev window.

**"tax-runner sidecar not found"** — The Python sidecar wasn't built. Run `npm run build:sidecar` inside `frontend/`, or just use `npm run dev:tauri` which builds it automatically.

**App opens but shows a blank white screen** — The Vite dev server may still be starting. Wait 10 seconds and the UI should load. If not, check the terminal for errors.

**Settings I saved aren't appearing** — Settings are stored at `~/.tax_processor/config.json`. You can view and edit this file directly in a text editor if needed.

---

## Logs and diagnostics

| File | What it contains |
|------|-----------------|
| `~/.tax_processor/logs/app.log` | Full pipeline log including Bedrock call latency and token counts |
| `~/.tax_processor/config.json` | Saved settings (region, model, template paths, output folder) |

To tail the log in real time:

```bash
tail -f ~/.tax_processor/logs/app.log
```

---

## Re-opening the app later

Each time you open a new terminal:

```bash
cd /path/to/tax_document_processor/frontend
source "$HOME/.cargo/env"       # load Rust (needed once per terminal)
source "../.venv/bin/activate"  # activate Python env
npm run dev:tauri               # launch the app
```

You can save these lines as a shell script (`run.sh`) in the project folder so you only need to run `./run.sh`.

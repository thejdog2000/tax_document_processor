# React Frontend

Real React/Vite implementation path for the web-style desktop UI.

This is not Electron. The intended architecture bias is:

```text
Tauri + React frontend + Python pipeline sidecar/bridge
```

Electron remains a fallback only if the Tauri/Python packaging spike fails or
slows the product down too much.

## Current Scope

- Componentized version of `ui_prototype/`.
- Backend-free state for PDF selection, drag/drop, processing simulation, output preview, and settings tabs.
- No pipeline hookup yet.
- No desktop shell committed yet.

## Run

Install dependencies first:

```bash
cd /Users/jacobs/Documents/Claude/Projects/TaxParser/tax_document_processor/frontend
npm install
npm run dev
```

## Next Step

Before connecting the real Python pipeline, complete:

```text
Epics/05_Architecture/03_ui_shell_and_pipeline_bridge.md
```

The first bridge spike should prove that the chosen shell can stream progress
from Python to the React UI.

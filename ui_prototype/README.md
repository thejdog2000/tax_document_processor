# UI Prototype

Backend-free prototype for iterating on the future main screen and
settings/config direction.

This does not replace `app.py` yet. It is intentionally separate so visual
direction can be reviewed before deciding whether to migrate the desktop app to
React, Tauri, Electron, or another shell.

## Run

```bash
cd /Users/jacobs/Documents/Claude/Projects/TaxParser/tax_document_processor/ui_prototype
python3 -m http.server 8090
```

Then open:

```text
http://localhost:8090
```

## Current Scope

- Empty packet intake state.
- Browse and drag/drop PDF selection state.
- Simulated processing, completion, and future review states.
- Settings button visible in the top-right.
- Optional first/last name fields.
- Tax year locked to 2025.
- Excel review document checkbox.
- Reviewer mode visibly locked until backend correction support exists.
- Settings/config section with `File & Folder Organization` as the first tab.
- Default folder hierarchy matching the current pipeline implementation.
- Filename pattern controls for client folder, renamed PDFs, and Excel workbooks.
- No zip output in the UI.

## Related Tasks

- `Epics/02_UI/07_output_hierarchy_customization.md`
- `Epics/02_UI/08_web_style_ui_port.md`
- `Epics/05_Architecture/03_ui_shell_and_pipeline_bridge.md`

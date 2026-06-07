# Configuration

Settings are managed from the app's corner cog.

## Settings File

Settings are stored locally:

```text
~/.tax_processor/config.json
```

The settings file is not stored in the app folder.

## Diagnostic Logs

Internal app diagnostics are stored locally:

```text
~/.tax_processor/logs/app.log
```

These logs are for troubleshooting app failures and should not be mixed into
client output folders.

## Packet Logs

Each processed client output includes:

- `document_log_latest.txt`: the current staff-facing packet log at the client folder root.
- `logs/YYYYMMDD_HHMMSS_document_log.txt`: immutable per-run packet log history.

## Settings Fields

| Setting | Purpose | Default |
|---|---|---|
| AWS Region | Bedrock Runtime region | `us-east-1` |
| AWS Profile | Optional local AWS profile for developer installs | empty |
| Bedrock Model ID | Sonnet model used by Bedrock | app default |
| 1040 Template | Path to `25_1040.xlsx` | empty until set |
| DoubleCheck Template | Path to `2025_Tax_Return_Double_Check.xlsx` | empty until set |
| Default Output Folder | Where client packages are written | Desktop |

## Staff-Safe Guidance

- Routine users should usually only change template paths and output folder.
- AWS model and profile settings are developer/admin settings for now.
- If a template moves, reselect it from Settings.

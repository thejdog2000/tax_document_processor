# Architecture

## Overview

Tax Document Processor is a desktop app for turning client tax-document PDFs into
renamed source files, populated review workbooks, document logs, and a consistent
client folder package.

```text
PDFs + client name
      |
      v
Tkinter desktop app (`app.py`)
      |
      v
Processing pipeline (`pipeline.py`)
      |
      +--> PDF text extraction (`pdfplumber`, when available)
      +--> AWS Bedrock/Sonnet extraction (`bedrock_client.py`)
      +--> validation and open-item logging
      +--> Excel population (`openpyxl`)
      +--> output folder package
```

## Main Files

- `app.py`: desktop UI, settings entry point, file selection, status display, starts the pipeline.
- `pipeline.py`: extraction orchestration, validation handling, file operations, workbook population, package generation.
- `bedrock_client.py`: thin AWS Bedrock Runtime adapter.
- `settings.py`: persistent local settings in `~/.tax_processor/config.json`.
- `app_logging.py`: rotating internal diagnostics in `~/.tax_processor/logs/app.log`.
- `requirements.txt`: runtime dependencies.
- `tests/`: logic and fixture-based workbook tests.
- `Epics/`: product backlog and implementation intent.

## Inference Boundary

All LLM inference should go through `bedrock_client.py`.

The app currently uses AWS Bedrock Runtime with an Anthropic Messages-compatible
payload. Do not reintroduce direct Anthropic SDK usage.

## Settings Boundary

Staff-accessible settings live behind the cog in `app.py`.

Settings currently include:

- AWS region
- AWS profile
- Bedrock model ID
- 1040 template path
- DoubleCheck template path
- default output folder

## Logging Boundary

Client packet logs are output artifacts:

- `document_log_latest.txt` lives at the client/year folder root for quick staff review.
- `logs/YYYYMMDD_HHMMSS_document_log.txt` stores per-run packet history.

Internal app diagnostics are support artifacts:

- `~/.tax_processor/logs/app.log` is a rotating diagnostic log.
- App diagnostics should stay out of client output folders.

## Reviewer Metadata

The extraction schema supports field-level metadata:

```json
{
  "field_metadata": {
    "boxes.box_1": {
      "confidence": 96,
      "evidence": "Box 1 Wages...",
      "page": 1,
      "notes": ""
    }
  }
}
```

Important: metadata should not replace existing scalar fields. Workbook population
still reads the normal extracted values.

## Testing Strategy

- `tests/test_logic.py`: fast pure-logic tests.
- `tests/run_tests.py --unit --fixture ...`: workbook population against golden fixtures.
- Live integration tests require AWS Bedrock credentials and real PDFs.

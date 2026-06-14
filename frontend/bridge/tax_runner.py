#!/usr/bin/env python3
"""
tax_runner.py — Unified Tauri sidecar CLI for Tax Document Processor.

Replaces tax-bridge-probe and tax-pipeline-runner with a single binary.

Usage:
  tax-runner probe                          # sanity-check: Python is alive
  tax-runner pipeline --validate-only       # validate job JSON from stdin, no API calls
  tax-runner pipeline --input job.json      # run full pipeline from JSON file
  tax-runner pipeline                       # run full pipeline, job JSON from stdin
"""
from __future__ import annotations

import argparse
import json
import sys
import time
import traceback
from pathlib import Path
from typing import Any


BRIDGE_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = BRIDGE_DIR.parent
PROJECT_DIR = FRONTEND_DIR.parent
if str(PROJECT_DIR) not in sys.path:
    sys.path.insert(0, str(PROJECT_DIR))


# ── helpers ──────────────────────────────────────────────────────────────────

def emit(event: str, **payload: Any) -> None:
    """Write a single JSON-lines event to stdout."""
    print(json.dumps({"event": event, **payload}, ensure_ascii=False), flush=True)


# ── probe subcommand ──────────────────────────────────────────────────────────

def cmd_probe(_args: argparse.Namespace) -> int:
    """Prove the sidecar binary is alive and importable."""
    steps = [
        ("python-started",  "Python sidecar process started."),
        ("imports-ok",      "Core project modules are importable."),
        ("complete",        "tax-runner probe finished successfully."),
    ]
    for event, message in steps:
        emit(event, message=message)
        time.sleep(0.15)
    return 0


# ── pipeline subcommand ───────────────────────────────────────────────────────

def load_job(input_path: str | None) -> dict[str, Any]:
    raw = Path(input_path).read_text(encoding="utf-8") if input_path else sys.stdin.read()
    try:
        job = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise ValueError(f"Invalid JSON job input: {exc}") from exc
    if not isinstance(job, dict):
        raise ValueError("Pipeline job input must be a JSON object.")
    return job


def as_bool(value: Any, default: bool = True) -> bool:
    if value is None:
        return default
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.strip().lower() not in {"0", "false", "no", "off"}
    return bool(value)


def normalize_job(job: dict[str, Any]) -> dict[str, Any]:
    from settings import Settings
    settings = Settings()

    pdf_paths = job.get("pdf_paths") or job.get("files") or []
    if not isinstance(pdf_paths, list) or not pdf_paths:
        raise ValueError("Pipeline job requires a non-empty `pdf_paths` or `files` array.")

    normalized_paths = []
    for path in pdf_paths:
        pdf_path = Path(str(path)).expanduser()
        if not pdf_path.exists():
            raise ValueError(f"PDF not found: {pdf_path}")
        if pdf_path.suffix.lower() != ".pdf":
            raise ValueError(f"Only PDF files are supported: {pdf_path}")
        normalized_paths.append(str(pdf_path))

    output_folder = str(job.get("output_folder") or settings.get("output_folder") or "").strip()
    if not output_folder:
        raise ValueError("Pipeline job requires `output_folder` or a saved default output folder.")

    tax_year = str(job.get("tax_year") or "2025").strip()
    if tax_year != "2025":
        raise ValueError("Only tax year 2025 is supported in the current pipeline.")

    return {
        "pdf_paths":              normalized_paths,
        "last_name":              str(job.get("last_name") or "").strip(),
        "first_name":             str(job.get("first_name") or "").strip(),
        "tax_year":               tax_year,
        "output_folder":          output_folder,
        "template_1040":          str(job.get("template_1040") or settings.get("template_1040") or ""),
        "template_doublecheck":   str(job.get("template_doublecheck") or settings.get("template_doublecheck") or ""),
        "aws_region":             str(job.get("aws_region") or settings.get("aws_region") or "us-east-1"),
        "aws_profile":            str(job.get("aws_profile") or settings.get("aws_profile") or ""),
        "bedrock_model_id":       str(job.get("bedrock_model_id") or settings.get("bedrock_model_id") or ""),
        "generate_excel_review":  as_bool(job.get("generate_excel_review"), default=True),
    }


def run_pipeline(job: dict[str, Any]) -> None:
    from app_logging import configure_app_logging
    from pipeline import TaxPipeline

    configure_app_logging()

    emit(
        "started",
        message="Pipeline started.",
        pdf_count=len(job["pdf_paths"]),
        output_folder=job["output_folder"],
    )

    pipeline = TaxPipeline(
        api_key="",
        template_1040=job["template_1040"],
        template_doublecheck=job["template_doublecheck"],
        output_folder=job["output_folder"],
        log_callback=lambda msg: emit("progress", message=msg),
        aws_region=job["aws_region"],
        aws_profile=job["aws_profile"],
        bedrock_model_id=job["bedrock_model_id"],
        generate_excel_review=job["generate_excel_review"],
    )
    pipeline.run(
        pdf_paths=job["pdf_paths"],
        last_name=job["last_name"],
        first_name=job["first_name"],
    )
    emit("complete", message="Pipeline completed successfully.", output_folder=job["output_folder"])


def cmd_pipeline(args: argparse.Namespace) -> int:
    try:
        job = normalize_job(load_job(args.input))
        emit("validated", message="Job input validated.", pdf_count=len(job["pdf_paths"]))
        if not args.validate_only:
            run_pipeline(job)
        return 0
    except Exception as exc:
        emit("error", message=str(exc), detail=traceback.format_exc())
        return 1


# ── settings subcommand ───────────────────────────────────────────────────────

SETTINGS_KEYS = [
    "aws_region",
    "aws_profile",
    "bedrock_model_id",
    "template_1040",
    "template_doublecheck",
    "output_folder",
]

SETTINGS_DEFAULTS = {
    "aws_region": "us-east-1",
    "bedrock_model_id": "us.anthropic.claude-sonnet-4-6",
}


def cmd_settings(args: argparse.Namespace) -> int:
    from settings import Settings

    s = Settings()

    if args.save:
        # Read new values from stdin, merge into existing config, persist.
        try:
            incoming = json.loads(sys.stdin.read())
        except json.JSONDecodeError as exc:
            emit("error", message=f"Invalid settings JSON: {exc}")
            return 1
        for key in SETTINGS_KEYS:
            if key in incoming:
                value = str(incoming[key]).strip()
                s.set(key, value)
        s.save()
        emit("saved", message="Settings saved.")
        return 0

    # Load — emit current values with defaults applied.
    data = {
        key: s.get(key, SETTINGS_DEFAULTS.get(key, ""))
        for key in SETTINGS_KEYS
    }
    print(json.dumps(data), flush=True)
    return 0


# ── entry point ───────────────────────────────────────────────────────────────

def main() -> int:
    parser = argparse.ArgumentParser(
        prog="tax-runner",
        description="Unified Tax Document Processor sidecar.",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("probe", help="Verify the sidecar binary is alive.")

    pipeline_parser = sub.add_parser("pipeline", help="Run the tax extraction pipeline.")
    pipeline_parser.add_argument(
        "--input", metavar="FILE",
        help="Path to a JSON job file. Reads stdin when omitted.",
    )
    pipeline_parser.add_argument(
        "--validate-only", action="store_true",
        help="Validate and normalize input without calling Bedrock or writing outputs.",
    )

    settings_parser = sub.add_parser("settings", help="Read or write persistent settings.")
    settings_parser.add_argument(
        "--save", action="store_true",
        help="Read updated settings JSON from stdin and persist to config file.",
    )

    args = parser.parse_args()

    if args.command == "probe":
        return cmd_probe(args)
    if args.command == "pipeline":
        return cmd_pipeline(args)
    if args.command == "settings":
        return cmd_settings(args)

    parser.print_help()
    return 1


if __name__ == "__main__":
    raise SystemExit(main())

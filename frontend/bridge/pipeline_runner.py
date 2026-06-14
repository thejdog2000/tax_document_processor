#!/usr/bin/env python3
"""JSON CLI entrypoint for running the existing tax pipeline as a sidecar.

The runner intentionally keeps the pipeline boundary thin:
- Tauri/React provides validated job input as JSON.
- This script loads config defaults, calls TaxPipeline, and streams JSON lines.
- pipeline.py remains the source of truth for extraction, validation, and output.
"""
from __future__ import annotations

import argparse
import json
import sys
import traceback
from pathlib import Path
from typing import Any


BRIDGE_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = BRIDGE_DIR.parent
PROJECT_DIR = FRONTEND_DIR.parent
if str(PROJECT_DIR) not in sys.path:
    sys.path.insert(0, str(PROJECT_DIR))

from app_logging import configure_app_logging  # noqa: E402
from pipeline import TaxPipeline  # noqa: E402
from settings import Settings  # noqa: E402

configure_app_logging()


def emit(event: str, **payload: Any) -> None:
    print(json.dumps({"event": event, **payload}, ensure_ascii=False), flush=True)


def load_job(input_path: str | None) -> dict[str, Any]:
    if input_path:
        raw = Path(input_path).read_text(encoding="utf-8")
    else:
        raw = sys.stdin.read()
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
        "pdf_paths": normalized_paths,
        "last_name": str(job.get("last_name") or "").strip(),
        "first_name": str(job.get("first_name") or "").strip(),
        "tax_year": tax_year,
        "output_folder": output_folder,
        "template_1040": str(job.get("template_1040") or settings.get("template_1040") or ""),
        "template_doublecheck": str(
            job.get("template_doublecheck") or settings.get("template_doublecheck") or ""
        ),
        "aws_region": str(job.get("aws_region") or settings.get("aws_region") or "us-east-1"),
        "aws_profile": str(job.get("aws_profile") or settings.get("aws_profile") or ""),
        "bedrock_model_id": str(job.get("bedrock_model_id") or settings.get("bedrock_model_id") or ""),
        "generate_excel_review": as_bool(job.get("generate_excel_review"), default=True),
    }


def run_pipeline(job: dict[str, Any]) -> None:
    emit(
        "started",
        message="Pipeline sidecar started.",
        pdf_count=len(job["pdf_paths"]),
        output_folder=job["output_folder"],
    )

    def log_progress(message: str) -> None:
        emit("progress", message=message)

    pipeline = TaxPipeline(
        api_key="",
        template_1040=job["template_1040"],
        template_doublecheck=job["template_doublecheck"],
        output_folder=job["output_folder"],
        log_callback=log_progress,
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


def main() -> int:
    parser = argparse.ArgumentParser(description="Run the tax pipeline from JSON input.")
    parser.add_argument("--input", help="Path to a JSON pipeline job. Reads stdin when omitted.")
    parser.add_argument(
        "--validate-only",
        action="store_true",
        help="Validate and normalize input without running Bedrock or writing outputs.",
    )
    args = parser.parse_args()

    try:
        job = normalize_job(load_job(args.input))
        emit("validated", message="Pipeline job input validated.", pdf_count=len(job["pdf_paths"]))
        if not args.validate_only:
            run_pipeline(job)
        return 0
    except Exception as exc:
        emit(
            "error",
            message=str(exc),
            detail=traceback.format_exc(),
        )
        return 1


if __name__ == "__main__":
    raise SystemExit(main())

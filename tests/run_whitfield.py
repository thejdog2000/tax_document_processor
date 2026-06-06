#!/usr/bin/env python3
"""
Quick integration runner for the Whitfield test packet.
Run from the tax_processor/ directory:
    python tests/run_whitfield.py
"""
import json
import sys
import os
from pathlib import Path

PROJECT_DIR = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_DIR))

from pipeline import TaxPipeline

# ── Config ────────────────────────────────────────────────────────────────────
config_path = Path.home() / ".tax_processor" / "config.json"
if not config_path.exists():
    print("❌  Config not found at ~/.tax_processor/config.json — run the app first")
    sys.exit(1)

with open(config_path) as f:
    config = json.load(f)

api_key             = config.get("api_key", "")
template_1040       = config.get("template_1040") or str(PROJECT_DIR / "25_1040.xlsx")
template_doublecheck = config.get("template_doublecheck") or str(PROJECT_DIR / "2025_Tax_Return_Double_Check.xlsx")
output_folder       = config.get("output_folder") or str(Path.home() / "Desktop" / "Test Client")

# ── Find PDFs ─────────────────────────────────────────────────────────────────
docs_dir = PROJECT_DIR.parent / "Client Test Docs" / "test_docs_whitfield"
pdf_paths = sorted(docs_dir.glob("*.pdf"))

if not pdf_paths:
    print(f"❌  No PDFs found in {docs_dir}")
    sys.exit(1)

print(f"Found {len(pdf_paths)} PDFs:")
for p in pdf_paths:
    print(f"  {p.name}")
print()

# ── Run pipeline ──────────────────────────────────────────────────────────────
pipeline = TaxPipeline(
    api_key=api_key,
    template_1040=template_1040,
    template_doublecheck=template_doublecheck,
    output_folder=output_folder,
    log_callback=print,
)

pipeline.run([str(p) for p in pdf_paths], "Whitfield", "")

# ── Dump extracted JSON (for golden fixture capture) ─────────────────────────
print("\n" + "="*55)
print("EXTRACTED JSON (copy to tests/fixtures/whitfield/extracted_golden.json)")
print("="*55)

import copy
extracted_export = []
for item in pipeline.extracted:
    exported = copy.deepcopy(item["data"])
    exported["_source_file"] = Path(item["path"]).name
    extracted_export.append({"path": f"__PLACEHOLDER__/{Path(item['path']).name}", "data": exported})

print(json.dumps(extracted_export, indent=2))

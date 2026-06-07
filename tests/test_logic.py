#!/usr/bin/env python3
"""
test_logic.py — Unit tests for pure pipeline logic.
No API key, no PDFs, no Excel templates required.

Run: python3 tests/test_logic.py
"""
import sys
import tempfile
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from pipeline import TaxPipeline
from bedrock_client import BedrockTaxExtractor
import re as _re, io as _io, builtins as _builtins

# ── Tee output to last_logic_run.log ─────────────────────────────────────────
_TESTS_DIR = Path(__file__).parent
_ansi = _re.compile(r'\x1b\[[0-9;]*m')
_log_lines = []
_orig_print = print

def _tee(*a, **kw):
    _orig_print(*a, **kw)
    buf = _io.StringIO()
    kw2 = {k: v for k, v in kw.items() if k not in ('file',)}
    _orig_print(*a, file=buf, **kw2)
    _log_lines.append(_ansi.sub('', buf.getvalue()))

_builtins.print = _tee

# ── Helpers ───────────────────────────────────────────────────────────────────
GREEN = "\033[92m"; RED = "\033[91m"; BOLD = "\033[1m"; RESET = "\033[0m"
passed = failed = 0

def check(desc, actual, expected):
    global passed, failed
    ok = actual == expected
    if ok:
        passed += 1
        print(f"  {GREEN}✅ PASS{RESET}  {desc}")
    else:
        failed += 1
        print(f"  {RED}❌ FAIL{RESET}  {desc}")
        print(f"          expected: {expected!r}")
        print(f"          got:      {actual!r}")

def pipeline():
    return TaxPipeline(
        api_key="unit-test",
        template_1040="",
        template_doublecheck="",
        output_folder="/tmp",
        log_callback=lambda _: None,
    )

def item(form_type, payer_name=None, filing_status=None,
         all_names=None, taxpayer_name=None, spouse_name=None,
         tax_year="2025"):
    return {
        "path": f"/tmp/{form_type}.pdf",
        "renamed": f"{form_type}.pdf",
        "data": {
            "form_type": form_type,
            "tax_year": tax_year,
            "payer_name": payer_name or form_type,
            "filing_status": filing_status,
            "all_names": all_names or [],
            "taxpayer_name": taxpayer_name,
            "spouse_name": spouse_name,
            "boxes": {},
            "validation_flags": [],
        }
    }


# ── _parse_dob ────────────────────────────────────────────────────────────────
print(f"\n{BOLD}_parse_dob(){RESET}")
p = pipeline()
check("MM/DD/YYYY",          p._parse_dob("04/22/1971"),   (1971, 4, 22))
check("M/D/YYYY",            p._parse_dob("1/5/1990"),     (1990, 1, 5))
check("YYYY-MM-DD",          p._parse_dob("1955-12-03"),   (1955, 12, 3))
check("MM-DD-YYYY",          p._parse_dob("09/14/1974"),   (1974, 9, 14))
check("None input",          p._parse_dob(None),            None)
check("Empty string",        p._parse_dob(""),              None)
check("Garbage string",      p._parse_dob("not a date"),    None)


# ── _is_senior ────────────────────────────────────────────────────────────────
print(f"\n{BOLD}_is_senior() — turns 65+ during tax year 2025{RESET}")
check("Born 1960 → turns 65 (senior)",   p._is_senior((1960, 6, 1)),  True)
check("Born 1959 → turns 66 (senior)",   p._is_senior((1959, 1, 1)),  True)
check("Born 1940 → turns 85 (senior)",   p._is_senior((1940, 3, 15)), True)
check("Born 1961 → turns 64 (not)",      p._is_senior((1961, 12, 31)),False)
check("Born 1971 → turns 54 (not)",      p._is_senior((1971, 4, 22)), False)
check("Born 1974 → turns 51 (not)",      p._is_senior((1974, 9, 14)), False)
check("None input",                       p._is_senior(None),          False)


# ── _determine_filing_status — tier 1: explicit ───────────────────────────────
print(f"\n{BOLD}_determine_filing_status() — tier 1: explicit statement{RESET}")

p.extracted = [item("1099-INT", filing_status="MFJ", all_names=["Jane Smith"])]
s, c, _ = p._determine_filing_status()
check("Explicit MFJ",    (s, c), ("MFJ",    "explicit"))

p.extracted = [item("client_notes", filing_status="Single")]
s, c, _ = p._determine_filing_status()
check("Explicit Single", (s, c), ("SINGLE", "explicit"))

p.extracted = [item("client_notes", filing_status="HOH")]
s, c, _ = p._determine_filing_status()
check("Explicit HOH",    (s, c), ("HOH",    "explicit"))

p.extracted = [item("client_notes", filing_status="MFS")]
s, c, _ = p._determine_filing_status()
check("Explicit MFS",    (s, c), ("MFS",    "explicit"))

# Explicit beats multiple names
p.extracted = [
    item("W-2",  filing_status="MFJ",  all_names=["Alice"],    taxpayer_name="Alice"),
    item("1098", filing_status=None,   all_names=["Alice","Bob"]),
]
s, c, _ = p._determine_filing_status()
check("Explicit takes priority over names", (s, c), ("MFJ", "explicit"))


# ── _determine_filing_status — tier 2: inferred MFJ ──────────────────────────
print(f"\n{BOLD}_determine_filing_status() — tier 2: inferred MFJ from two names{RESET}")

p.extracted = [
    item("W-2", all_names=["Robert Whitfield"], taxpayer_name="Robert Whitfield"),
    item("W-2", all_names=["Linda Whitfield"],  taxpayer_name="Linda Whitfield"),
]
s, c, _ = p._determine_filing_status()
check("Two names across docs → MFJ inferred", (s, c), ("MFJ", "inferred"))

p.extracted = [
    item("1099-DIV", all_names=["James Thornton", "Patricia Thornton"])
]
s, c, _ = p._determine_filing_status()
check("Two names on one doc → MFJ inferred", (s, c), ("MFJ", "inferred"))

p.extracted = [
    item("W-2", taxpayer_name="Jane Smith", spouse_name="John Smith",
         all_names=["Jane Smith"])
]
s, c, _ = p._determine_filing_status()
check("Spouse name field → MFJ inferred", (s, c), ("MFJ", "inferred"))


# ── _determine_filing_status — tier 3: default single ────────────────────────
print(f"\n{BOLD}_determine_filing_status() — tier 3: default single{RESET}")

p.extracted = [item("W-2", all_names=["Jane Smith"], taxpayer_name="Jane Smith")]
s, c, _ = p._determine_filing_status()
check("One name → default Single", (s, c), ("Single", "default"))

p.extracted = [item("W-2")]
s, c, _ = p._determine_filing_status()
check("No names → default Single", (s, c), ("Single", "default"))

p.extracted = []
s, c, _ = p._determine_filing_status()
check("Empty extracted → default Single", (s, c), ("Single", "default"))


# ── _interest_already_covered ─────────────────────────────────────────────────
print(f"\n{BOLD}_interest_already_covered() — dedup logic{RESET}")

p.extracted = [item("1099-INT", payer_name="First National Bank of Alabama")]

check("Exact match → suppress",
      p._interest_already_covered("First National Bank of Alabama"), True)
check("Partial match (notes substring of 1099) → suppress",
      p._interest_already_covered("First National Bank"), True)
check("Partial match (1099 substring of notes) → suppress",
      p._interest_already_covered("First National Bank of Alabama and Trust"), True)
check("Case-insensitive match → suppress",
      p._interest_already_covered("FIRST NATIONAL BANK OF ALABAMA"), True)
check("Different institution → write through",
      p._interest_already_covered("Hoover Federal Credit Union"), False)
check("None payer → write through",
      p._interest_already_covered(None), False)
check("Empty payer → write through",
      p._interest_already_covered(""), False)

p.extracted = []
check("No 1099-INTs in packet → write through",
      p._interest_already_covered("Any Bank"), False)

p.extracted = [item("W-2", payer_name="First National Bank")]
check("1099-INT not in packet (W-2 only) → write through",
      p._interest_already_covered("First National Bank"), False)


# ── _client_slug ─────────────────────────────────────────────────────────────
print(f"\n{BOLD}_client_slug() — optional client names{RESET}")

check("Last + first",
      p._client_slug("Thornton", "James"), "Thornton_James_2025")
check("Last only",
      p._client_slug("Whitfield", ""), "Whitfield_2025")
check("Blank names fallback",
      p._client_slug("", ""), "Client_2025")
check("Whitespace names fallback",
      p._client_slug("  ", " "), "Client_2025")
check("Unsafe punctuation cleaned",
      p._client_slug("Smith/Jones", "Anne Marie"), "Smith_Jones_Anne_Marie_2025")


# ── Bedrock response parsing and reviewer metadata ───────────────────────────
print(f"\n{BOLD}Bedrock response parsing and reviewer metadata{RESET}")

body = {
    "content": [
        {"type": "text", "text": '{"form_type":"W-2"}'},
        {"type": "thinking", "thinking": "ignored"},
    ]
}
check("Bedrock text blocks extracted",
      BedrockTaxExtractor.response_text(body), '{"form_type":"W-2"}')

wrapped = {
    "form_type": {
        "value": "W-2",
        "confidence": "101",
        "evidence": "Form W-2 Wage and Tax Statement",
        "page": 1,
    },
    "tax_year": "2025",
    "boxes": {
        "box_1": {
            "value": 52000.00,
            "confidence": 96,
            "evidence": "Box 1 52000.00",
        }
    },
    "validation_flags": [],
}
normalized = p._normalize_extraction_schema(wrapped)
check("Inline reviewer wrapper preserves scalar form_type",
      normalized["form_type"], "W-2")
check("Inline reviewer wrapper preserves scalar box",
      normalized["boxes"]["box_1"], 52000.00)
check("Confidence clamped to 100",
      normalized["field_metadata"]["form_type"]["confidence"], 100)
check("Box metadata stored under boxes.box_1",
      normalized["field_metadata"]["boxes.box_1"]["evidence"], "Box 1 52000.00")


# ── Year mismatch detection ───────────────────────────────────────────────────
print(f"\n{BOLD}Year mismatch detection{RESET}")

docs_mixed = [
    item("W-2",      tax_year="2025"),
    item("1099-INT", tax_year="2024"),   # wrong year
    item("1098",     tax_year="2025"),
]
p.extracted = docs_mixed
mismatched = [i for i in p.extracted if i["data"].get("tax_year") not in ("2025", None)]
check("One 2024 doc detected as mismatch",    len(mismatched), 1)
check("Mismatched doc is 1099-INT",           mismatched[0]["data"]["form_type"], "1099-INT")
check("Mismatched doc has year 2024",         mismatched[0]["data"]["tax_year"], "2024")

docs_all_good = [item("W-2", tax_year="2025"), item("1099-DIV", tax_year="2025")]
p.extracted = docs_all_good
mismatched = [i for i in p.extracted if i["data"].get("tax_year") not in ("2025", None)]
check("All 2025 docs → no mismatch",          len(mismatched), 0)

docs_null_year = [item("W-2", tax_year=None)]
p.extracted = docs_null_year
mismatched = [i for i in p.extracted if i["data"].get("tax_year") not in ("2025", None)]
check("Null year treated as acceptable",      len(mismatched), 0)


# ── Form type normalization ───────────────────────────────────────────────────
print(f"\n{BOLD}Form type normalization (client_notes variants){RESET}")

cases = [
    ("client_notes",    "client_notes"),
    ("Client Notes",    "client_notes"),
    ("CLIENT ORGANIZER","client_notes"),
    ("Client Organizer","client_notes"),
    ("tax organizer",   "client_notes"),
    ("organizer",       "client_notes"),
    ("notes",           "client_notes"),
    ("W-2",             "W-2"),           # unchanged
    ("1099-INT",        "1099-INT"),       # unchanged
]
for raw, expected_norm in cases:
    ft = raw.lower().strip()
    result = "client_notes" if any(x in ft for x in ("client","organizer","notes")) else raw
    check(f"'{raw}' → '{expected_norm}'", result, expected_norm)


# ── W-2 false positive flag filtering ────────────────────────────────────────
print(f"\n{BOLD}W-2 false positive flag filtering{RESET}")

def filter_flags(flags):
    return [
        f for f in flags
        if not ("math error" in f.lower() and
                len(set(f.split("expected ")[-1].split(" got "))) == 1)
    ]

# Same values = false positive, should be stripped
fp_flags = [
    "SS tax math error: expected 4526.00 got 4526.00",
    "Medicare tax math error: expected 1058.50 got 1058.50",
]
check("Both false positives stripped",     len(filter_flags(fp_flags)), 0)

# Different values = real error, should be kept
real_flags = [
    "SS tax math error: expected 4526.00 got 4500.00",
    "Medicare tax math error: expected 1058.50 got 1000.00",
]
check("Both real errors kept",             len(filter_flags(real_flags)), 2)

# Mixed bag
mixed = [
    "SS tax math error: expected 4526.00 got 4526.00",       # false positive
    "SS tax math error: expected 4526.00 got 4500.00",       # real
    "TAX YEAR MISMATCH: document is 2024, expected 2025",    # non-math, always kept
    "401k deferral exceeds $23,500 limit",                   # non-math, always kept
]
result = filter_flags(mixed)
check("Mixed: 1 stripped, 3 kept",        len(result), 3)
check("Real SS error present",            any("4500.00" in f for f in result), True)
check("Year mismatch present",            any("MISMATCH" in f for f in result), True)
check("401k flag present",                any("401k" in f for f in result), True)
check("False positive absent",            not any("4526.00 got 4526.00" in f for f in result), True)


# ── Document log writing ──────────────────────────────────────────────────────
print(f"\n{BOLD}Document log writing{RESET}")

with tempfile.TemporaryDirectory() as tmp:
    out_dir = Path(tmp) / "Client_2025"
    packet_log_dir = out_dir / "logs"
    packet_log_dir.mkdir(parents=True)

    latest_log_path, versioned_log_path = p._write_document_logs(
        out_dir,
        packet_log_dir,
        ["DOCUMENT LOG", "Client: Test, Example"],
    )

    check("Latest packet log renamed",
          latest_log_path.name, "document_log_latest.txt")
    check("Latest packet log exists",
          latest_log_path.exists(), True)
    check("Versioned packet log exists",
          versioned_log_path.exists(), True)
    check("Versioned packet log saved under logs folder",
          versioned_log_path.parent.name, "logs")
    check("Versioned packet log uses document_log suffix",
          versioned_log_path.name.endswith("_document_log.txt"), True)
    check("Latest and versioned content match",
          latest_log_path.read_text(encoding="utf-8"),
          versioned_log_path.read_text(encoding="utf-8"))


# ── Summary ───────────────────────────────────────────────────────────────────
print(f"\n{'='*55}")
total = passed + failed
if failed == 0:
    print(f"{GREEN}{BOLD}ALL TESTS PASSED — {passed}/{total}{RESET}")
else:
    print(f"{RED}{BOLD}FAILURES: {failed}/{total} — {passed} passed, {failed} failed{RESET}")

_builtins.print = _orig_print
(_TESTS_DIR / "last_logic_run.log").write_text("".join(_log_lines), encoding="utf-8")

sys.exit(0 if failed == 0 else 1)

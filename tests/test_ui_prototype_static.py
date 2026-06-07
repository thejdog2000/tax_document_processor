#!/usr/bin/env python3
"""
Static checks for the backend-free web UI prototype.

Run: python3 tests/test_ui_prototype_static.py
"""
import sys
from pathlib import Path


PROJECT_DIR = Path(__file__).parent.parent
PROTOTYPE_DIR = PROJECT_DIR / "ui_prototype"


def main():
    html = (PROTOTYPE_DIR / "index.html").read_text(encoding="utf-8")
    js = (PROTOTYPE_DIR / "app.js").read_text(encoding="utf-8")
    css = (PROTOTYPE_DIR / "styles.css").read_text(encoding="utf-8")
    failures = []

    required_html = [
        'id="dropZone"',
        'id="fileInput"',
        'id="processButton"',
        'data-tab="organization"',
        'data-panel="organization"',
        "File &amp; Folder Organization",
        "Process Documents",
        "document_log_latest.txt",
    ]
    for text in required_html:
        if text not in html:
            failures.append(f"index.html missing {text!r}")

    required_js = [
        "function setFiles",
        "function simulateProcessing",
        "function activateTab",
        "function addFolderRow",
        "dropZone.addEventListener(\"drop\"",
    ]
    for text in required_js:
        if text not in js:
            failures.append(f"app.js missing {text!r}")

    required_css = [
        ".drop-zone.is-dragging",
        ".tab-panel.active",
        ".locked-panel.review-alert",
    ]
    for text in required_css:
        if text not in css:
            failures.append(f"styles.css missing {text!r}")

    visible_text = html.lower()
    if "zip" in visible_text:
        failures.append("Visible prototype HTML should not reference zip output.")

    if failures:
        print("UI prototype static checks failed:")
        for failure in failures:
            print(f"  - {failure}")
        return 1

    print("UI prototype static checks passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

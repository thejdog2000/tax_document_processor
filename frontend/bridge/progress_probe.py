#!/usr/bin/env python3
"""
Harmless Python probe for the Tauri bridge spike.

This intentionally does not import or run the tax pipeline. It only proves that
the desktop shell can invoke Python and stream progress lines back to React.
"""
import json
import time


steps = [
    {"step": "python-started", "message": "Python bridge process started."},
    {"step": "inputs-ready", "message": "Bridge received a test command from the UI."},
    {"step": "complete", "message": "Python bridge returned a success payload."},
]

for item in steps:
    print(json.dumps(item), flush=True)
    time.sleep(0.35)

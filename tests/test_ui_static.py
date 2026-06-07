#!/usr/bin/env python3
"""
Static UI checks that do not require a display server.

Run: python3 tests/test_ui_static.py
"""
import ast
import sys
from pathlib import Path


PROJECT_DIR = Path(__file__).parent.parent
APP_PATH = PROJECT_DIR / "app.py"


def main():
    tree = ast.parse(APP_PATH.read_text())
    failures = []

    for node in ast.walk(tree):
        if not isinstance(node, ast.Call):
            continue
        func = node.func
        if not (
            isinstance(func, ast.Attribute)
            and func.attr in {"Frame", "Label", "Button", "Entry", "Text", "Scrollbar"}
        ):
            continue
        for keyword in node.keywords:
            if keyword.arg in {"padx", "pady"} and isinstance(keyword.value, ast.Tuple):
                failures.append((keyword.arg, node.lineno))

    if failures:
        print("UI static check failed: widget constructor padx/pady must be scalar.")
        for arg, line in failures:
            print(f"  app.py:{line} uses tuple for {arg}; put tuple spacing on .pack/.grid instead.")
        return 1

    print("UI static checks passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())


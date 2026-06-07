#!/usr/bin/env python3
"""
Static checks for the React frontend scaffold.

Run: python3 tests/test_react_frontend_static.py
"""
import json
import sys
from pathlib import Path


PROJECT_DIR = Path(__file__).parent.parent
FRONTEND_DIR = PROJECT_DIR / "frontend"


def main():
    failures = []
    package = json.loads((FRONTEND_DIR / "package.json").read_text(encoding="utf-8"))
    app = (FRONTEND_DIR / "src" / "App.jsx").read_text(encoding="utf-8")
    main_jsx = (FRONTEND_DIR / "src" / "main.jsx").read_text(encoding="utf-8")

    if package.get("scripts", {}).get("dev") != "vite":
        failures.append("frontend/package.json should expose `npm run dev` via Vite.")

    deps = package.get("dependencies", {})
    if "react" not in deps or "react-dom" not in deps:
        failures.append("frontend/package.json must include React dependencies.")

    forbidden = ["electron", "zip"]
    combined = f"{json.dumps(package).lower()}\n{app.lower()}\n{main_jsx.lower()}"
    for word in forbidden:
        if word in combined:
            failures.append(f"React frontend should not reference {word!r} yet.")

    required_app_text = [
        "export function App",
        "function HeroCard",
        "function ConfigShell",
        "Process Documents",
        "File & Folder Organization",
        "document_log_latest.txt",
        "Tauri",
    ]
    readme = (FRONTEND_DIR / "README.md").read_text(encoding="utf-8")
    for text in required_app_text:
        source = readme if text == "Tauri" else app
        if text not in source:
            failures.append(f"React frontend missing {text!r}.")

    if failures:
        print("React frontend static checks failed:")
        for failure in failures:
            print(f"  - {failure}")
        return 1

    print("React frontend static checks passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

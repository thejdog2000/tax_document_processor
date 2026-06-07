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
    bridge = (FRONTEND_DIR / "src" / "tauriBridge.js").read_text(encoding="utf-8")
    tauri_conf = (FRONTEND_DIR / "src-tauri" / "tauri.conf.json").read_text(encoding="utf-8")
    tauri_lib = (FRONTEND_DIR / "src-tauri" / "src" / "lib.rs").read_text(encoding="utf-8")
    tauri_cargo = (FRONTEND_DIR / "src-tauri" / "Cargo.toml").read_text(encoding="utf-8")
    dev_requirements = (PROJECT_DIR / "requirements-dev.txt").read_text(encoding="utf-8")

    if package.get("scripts", {}).get("dev") != "vite":
        failures.append("frontend/package.json should expose `npm run dev` via Vite.")

    deps = package.get("dependencies", {})
    if "react" not in deps or "react-dom" not in deps:
        failures.append("frontend/package.json must include React dependencies.")

    forbidden = ["electron", "zip"]
    combined = (
        f"{json.dumps(package).lower()}\n{app.lower()}\n{main_jsx.lower()}\n"
        f"{bridge.lower()}\n{tauri_conf.lower()}\n{tauri_lib.lower()}"
    )
    for word in forbidden:
        if word in combined:
            failures.append(f"React frontend should not reference {word!r} yet.")

    required_app_text = [
        "export function App",
        "function HeroCard",
        "function ConfigShell",
        "function BridgePanel",
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

    required_bridge_text = [
        "runPythonBridge",
        "run_python_bridge",
        "python-bridge-progress",
    ]
    for text in required_bridge_text:
        if text not in bridge and text not in app:
            failures.append(f"React/Tauri bridge missing {text!r}.")

    if "frontendDist" not in tauri_conf or "devUrl" not in tauri_conf:
        failures.append("Tauri config should define Vite devUrl and frontendDist.")

    tauri_config = json.loads(tauri_conf)
    if tauri_config.get("identifier", "").endswith(".app"):
        failures.append("Tauri identifier should not end with `.app`.")

    if "externalBin" not in tauri_config.get("bundle", {}):
        failures.append("Tauri config should package the Python bridge sidecar.")

    if "tauri-plugin-shell" not in tauri_cargo:
        failures.append("Tauri bridge should use the shell plugin for sidecars.")

    if "python3" in tauri_lib:
        failures.append("Tauri bridge should invoke the packaged sidecar, not system python3.")

    if "pyinstaller" not in dev_requirements.lower():
        failures.append("requirements-dev.txt should include PyInstaller for sidecar packaging.")

    if failures:
        print("React frontend static checks failed:")
        for failure in failures:
            print(f"  - {failure}")
        return 1

    print("React frontend static checks passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

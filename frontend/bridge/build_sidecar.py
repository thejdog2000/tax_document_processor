#!/usr/bin/env python3
"""Build the harmless Python bridge probe as a Tauri sidecar binary."""
from __future__ import annotations

import shutil
import subprocess
import sys
import os
from pathlib import Path


BRIDGE_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = BRIDGE_DIR.parent
PROJECT_DIR = FRONTEND_DIR.parent
SOURCE = BRIDGE_DIR / "progress_probe.py"
BUILDER = Path(__file__).resolve()
BINARIES_DIR = FRONTEND_DIR / "src-tauri" / "binaries"
SIDECAR_NAME = "tax-bridge-probe"


def venv_python() -> Path:
    if sys.platform == "win32":
        return PROJECT_DIR / ".venv" / "Scripts" / "python.exe"
    return PROJECT_DIR / ".venv" / "bin" / "python"


def reexec_in_venv_if_available() -> None:
    project_venv_python = venv_python()
    if not project_venv_python.exists():
        return
    if Path(sys.prefix).resolve() == (PROJECT_DIR / ".venv").resolve():
        return
    os.execv(str(project_venv_python), [str(project_venv_python), *sys.argv])


def run(command: list[str], cwd: Path = FRONTEND_DIR) -> str:
    result = subprocess.run(command, cwd=cwd, check=True, text=True, capture_output=True)
    return result.stdout.strip()


def host_triple() -> str:
    try:
        return run(["rustc", "--print", "host-tuple"])
    except (subprocess.CalledProcessError, FileNotFoundError) as exc:
        raise SystemExit(
            "Rust/Cargo is required to build the Tauri sidecar. "
            'Run `source "$HOME/.cargo/env"` and confirm `rustc --print host-tuple` works.'
        ) from exc


def pyinstaller_command() -> list[str]:
    if shutil.which("pyinstaller"):
        return ["pyinstaller"]
    try:
        run([sys.executable, "-m", "PyInstaller", "--version"], cwd=PROJECT_DIR)
    except (subprocess.CalledProcessError, FileNotFoundError) as exc:
        raise SystemExit(
            "PyInstaller is required to build the Python sidecar. "
            "Install dev dependencies with `python3 -m pip install -r requirements-dev.txt`."
        ) from exc
    return [sys.executable, "-m", "PyInstaller"]


def is_current(sidecar_binary: Path) -> bool:
    if "--force" in sys.argv:
        return False
    if not sidecar_binary.exists():
        return False
    newest_source = max(SOURCE.stat().st_mtime, BUILDER.stat().st_mtime)
    return sidecar_binary.stat().st_mtime >= newest_source


def main() -> int:
    reexec_in_venv_if_available()

    if not SOURCE.exists():
        raise SystemExit(f"Missing sidecar source: {SOURCE}")

    target_triple = host_triple()
    extension = ".exe" if sys.platform == "win32" else ""
    dist_binary = BRIDGE_DIR / "dist" / f"{SIDECAR_NAME}{extension}"
    sidecar_binary = BINARIES_DIR / f"{SIDECAR_NAME}-{target_triple}{extension}"

    BINARIES_DIR.mkdir(parents=True, exist_ok=True)

    if is_current(sidecar_binary):
        print(f"Tauri sidecar is current: {sidecar_binary.relative_to(PROJECT_DIR)}")
        return 0

    command = [
        *pyinstaller_command(),
        "--onefile",
        "--clean",
        "--name",
        SIDECAR_NAME,
        "--distpath",
        str(BRIDGE_DIR / "dist"),
        "--workpath",
        str(BRIDGE_DIR / "build"),
        "--specpath",
        str(BRIDGE_DIR / "build"),
        str(SOURCE),
    ]
    env = os.environ.copy()
    env["PYINSTALLER_CONFIG_DIR"] = str(BRIDGE_DIR / "build" / "pyinstaller-cache")
    subprocess.run(command, cwd=FRONTEND_DIR, check=True, env=env)

    if not dist_binary.exists():
        raise SystemExit(f"PyInstaller did not produce expected binary: {dist_binary}")

    shutil.copy2(dist_binary, sidecar_binary)
    sidecar_binary.chmod(0o755)
    print(f"Built Tauri sidecar: {sidecar_binary.relative_to(PROJECT_DIR)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

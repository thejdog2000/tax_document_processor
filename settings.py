"""
settings.py — Persistent settings and app-data paths for Tax Document Processor.
Stores config/logs in ~/.tax_processor/ (never in the app folder).
"""
import json
from pathlib import Path

APP_DATA_DIR = Path.home() / ".tax_processor"
CONFIG_PATH = APP_DATA_DIR / "config.json"
APP_LOG_DIR = APP_DATA_DIR / "logs"
APP_LOG_PATH = APP_LOG_DIR / "app.log"


class Settings:
    def __init__(self):
        self._data = {}
        self._load()

    def _load(self):
        if CONFIG_PATH.exists():
            try:
                self._data = json.loads(CONFIG_PATH.read_text())
            except Exception:
                self._data = {}

    def get(self, key, default=None):
        return self._data.get(key, default)

    def set(self, key, value):
        self._data[key] = value

    def save(self):
        CONFIG_PATH.parent.mkdir(parents=True, exist_ok=True)
        CONFIG_PATH.write_text(json.dumps(self._data, indent=2))

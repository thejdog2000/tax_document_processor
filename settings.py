"""
settings.py — Persistent settings for Tax Document Processor
Stores config in ~/.tax_processor/config.json (never in the app folder)
"""
import json
from pathlib import Path

CONFIG_PATH = Path.home() / ".tax_processor" / "config.json"


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

"""
app_logging.py - Internal diagnostic logging.

These logs are for support/debugging and live in app data, not in client output
folders.
"""
import logging
from logging.handlers import RotatingFileHandler

from settings import APP_LOG_DIR, APP_LOG_PATH


def configure_app_logging():
    APP_LOG_DIR.mkdir(parents=True, exist_ok=True)
    logger = logging.getLogger("tax_document_processor")
    logger.setLevel(logging.INFO)
    logger.propagate = False

    if not any(isinstance(handler, RotatingFileHandler) for handler in logger.handlers):
        handler = RotatingFileHandler(
            APP_LOG_PATH,
            maxBytes=1_000_000,
            backupCount=5,
            encoding="utf-8",
        )
        handler.setFormatter(logging.Formatter(
            "%(asctime)s %(levelname)s %(name)s - %(message)s"
        ))
        logger.addHandler(handler)

    return logger


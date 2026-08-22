import logging
import sys
import re

class SensitiveDataFilter(logging.Filter):
    """Masks sensitive parameters like passwords, tokens, and raw journal text from log files."""
    PATTERNS = [
        (re.compile(r'("password"\s*:\s*)"[^"]+"', re.IGNORECASE), r'\1"***MASKED***"'),
        (re.compile(r'("token"\s*:\s*)"[^"]+"', re.IGNORECASE), r'\1"***MASKED***"'),
        (re.compile(r'("refresh_token"\s*:\s*)"[^"]+"', re.IGNORECASE), r'\1"***MASKED***"'),
        (re.compile(r'("journal_text"\s*:\s*)"[^"]+"', re.IGNORECASE), r'\1"***ENCRYPTED_AT_REST***"'),
    ]

    def filter(self, record: logging.LogRecord) -> bool:
        if isinstance(record.msg, str):
            for pattern, repl in self.PATTERNS:
                record.msg = pattern.sub(repl, record.msg)
        return True

def setup_logging():
    logger = logging.getLogger("mindsaathi")
    logger.setLevel(logging.INFO)

    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setLevel(logging.INFO)
        formatter = logging.Formatter(
            "[%(asctime)s] [%(levelname)s] [%(name)s] %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )
        handler.setFormatter(formatter)
        handler.addFilter(SensitiveDataFilter())
        logger.addHandler(handler)

    return logger

logger = setup_logging()

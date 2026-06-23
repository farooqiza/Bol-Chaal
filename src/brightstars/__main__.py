import signal
import sys

from .cli import main

# Die quietly when output is piped to `head`/`less` and the reader closes early.
try:
    signal.signal(signal.SIGPIPE, signal.SIG_DFL)
except (AttributeError, ValueError):  # not available on some platforms
    pass

if __name__ == "__main__":
    sys.exit(main())

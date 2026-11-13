#!/usr/bin/env python3
"""Start the EncoVault development server and open its local UI."""

import importlib.util
import os
import threading
import time
import webbrowser


def main() -> None:
    missing = [name for name in ("fastapi", "uvicorn", "Crypto") if importlib.util.find_spec(name) is None]
    if missing:
        print("Dependencies are missing. From the project root, run:")
        print("  python3 -m pip install -r backend/requirements.txt")
        raise SystemExit(1)

    root = os.path.dirname(os.path.abspath(__file__))
    os.chdir(os.path.join(root, "backend"))
    url = "http://127.0.0.1:8000"
    print(f"EncoVault is starting at {url} (API docs: {url}/docs)")
    threading.Thread(target=lambda: (time.sleep(1.2), webbrowser.open(url)), daemon=True).start()

    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000)


if __name__ == "__main__":
    main()

"""Serve the local EncoVault learning studio."""

from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import webbrowser


WEB_ROOT = Path(__file__).with_name("web")


def run_server(port: int = 8765, open_browser: bool = True) -> None:
    """Serve the static learning app on the local machine."""
    handler = partial(SimpleHTTPRequestHandler, directory=str(WEB_ROOT))
    server = ThreadingHTTPServer(("127.0.0.1", port), handler)
    address = f"http://127.0.0.1:{port}/"
    print(f"EncoVault is running at {address}")
    print("Press Ctrl+C to stop the local server.")
    if open_browser:
        opened = webbrowser.open_new_tab(address)
        if not opened:
            print(f"Open this address in your browser: {address}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nEncoVault Learning Studio stopped.")
    finally:
        server.server_close()

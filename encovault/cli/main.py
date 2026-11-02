"""Command-line interface for EncoVault."""

import argparse
from collections.abc import Sequence
from typing import Optional

from encovault import __version__
from encovault.core.app_info import APP_NAME


def build_parser() -> argparse.ArgumentParser:
    """Build the command-line argument parser."""
    parser = argparse.ArgumentParser(
        prog="encovault",
        description="Explore interactive data security and compression lessons.",
    )
    parser.add_argument("--version", action="version", version=f"{APP_NAME} {__version__}")
    commands = parser.add_subparsers(dest="command", metavar="COMMAND")
    web = commands.add_parser("web", help="Launch the browser-based learning studio.")
    web.add_argument("--port", type=int, default=8765, help="Local web port (default: 8765).")
    return parser


def main(argv: Optional[Sequence[str]] = None) -> int:
    """Run the CLI and return a process exit code."""
    args = build_parser().parse_args(argv)
    if args.command == "web":
        from encovault.web_server import run_server

        run_server(port=args.port)
        return 0

    build_parser().print_help()
    return 0

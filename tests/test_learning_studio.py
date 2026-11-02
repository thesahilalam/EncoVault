"""Checks for the local EncoVault file tool and bundled labs."""

import unittest

from encovault.cli.main import build_parser
from encovault.web_server import WEB_ROOT


class LearningStudioTests(unittest.TestCase):
    def test_web_command_defaults_to_local_port(self) -> None:
        args = build_parser().parse_args(["web"])
        self.assertEqual(args.port, 8765)

    def test_course_site_assets_are_bundled(self) -> None:
        self.assertTrue((WEB_ROOT / "index.html").is_file())
        self.assertTrue((WEB_ROOT / "styles.css").is_file())
        self.assertTrue((WEB_ROOT / "app.js").is_file())

    def test_file_workflow_and_security_profiles_are_present(self) -> None:
        app = (WEB_ROOT / "app.js").read_text(encoding="utf-8")
        page = (WEB_ROOT / "index.html").read_text(encoding="utf-8")
        self.assertIn("File security", page)
        self.assertIn('data-file-mode="lock"', app)
        self.assertIn('data-file-mode="unlock"', app)
        self.assertIn("webkitdirectory", app)
        self.assertIn("AES-GCM", app)
        self.assertIn("600000", app)
        self.assertIn("900000", app)
        self.assertIn(".encovault", app)
        self.assertIn("Compress before locking", app)

    def test_labs_cover_security_and_compression(self) -> None:
        app = (WEB_ROOT / "app.js").read_text(encoding="utf-8")
        for lab in ("Caesar cipher", "Vigenère cipher", "SHA-256 hash", "Run-length encoding", "Entropy explorer", "Firewall rules"):
            self.assertIn(lab, app)
        page = (WEB_ROOT / "index.html").read_text(encoding="utf-8")
        self.assertIn("Compression lab", page)
        self.assertNotIn("Syllabus map", page)
        self.assertIn("Security reference", page)
        self.assertIn("data-learn", page)
        for method in ("Run-length encoding", "Huffman coding", "Arithmetic coding", "Lossless vs lossy", "Entropy"):
            self.assertIn(method, app)
        self.assertIn("Compression lab", app)
        for phrase in ("HOW IT WORKS", "TYPES", "EXAMPLES", "APPLICATIONS", "compressionInfoMarkup"):
            self.assertIn(phrase, app)
        self.assertIn("data-compression-method", app)
        self.assertIn("data-loss-mode", app)
        self.assertIn("compressImage", app)
        self.assertIn("sizeChange", app)
        self.assertIn("lossless fallback", app)
        self.assertIn("PDFs, DOCX, videos", app)
        self.assertNotIn('"Unit I"', app)


if __name__ == "__main__":
    unittest.main()

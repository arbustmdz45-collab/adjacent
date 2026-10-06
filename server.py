"""One page, one action: serve the page and append interest to signups.csv.

No accounts, no dashboard, no database. Augusto reads signups.csv by hand.
Run: python3 server.py   (then open http://localhost:8000)
"""

import csv
import os
import re
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs

ROOT = Path(__file__).resolve().parent
SIGNUPS = ROOT / "signups.csv"
STATIC = {
    "/": ("index.html", "text/html; charset=utf-8"),
    "/jobs.json": ("jobs.json", "application/json; charset=utf-8"),
}
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
MAX_BODY = 10_000


def clean(value, limit):
    value = " ".join(value.split())[:limit]
    # Stop spreadsheet apps from treating a cell as a formula.
    if value[:1] in ("=", "+", "-", "@"):
        value = "'" + value
    return value


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        path = self.path.split("?", 1)[0]
        if path not in STATIC:
            self.send_error(404)
            return
        name, ctype = STATIC[path]
        body = (ROOT / name).read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        if self.path != "/interest":
            self.send_error(404)
            return
        length = int(self.headers.get("Content-Length") or 0)
        if length > MAX_BODY:
            self.send_error(413)
            return
        form = parse_qs(self.rfile.read(length).decode("utf-8", "replace"))
        get = lambda k: (form.get(k) or [""])[0].strip()

        # Honeypot: real people never see or fill this field.
        if get("website"):
            self.redirect("/?gracias=1#interes")
            return

        email = get("email")
        if not EMAIL_RE.match(email) or len(email) > 254:
            self.redirect("/?error=email#interes")
            return

        new_file = not SIGNUPS.exists()
        with SIGNUPS.open("a", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            if new_file:
                writer.writerow(["timestamp_utc", "email", "trabajo_actual", "por_que"])
            writer.writerow([
                datetime.now(timezone.utc).isoformat(timespec="seconds"),
                clean(email, 254),
                clean(get("trabajo"), 200),
                clean(get("nota"), 1000),
            ])
        self.redirect("/?gracias=1#interes")

    def redirect(self, location):
        self.send_response(303)
        self.send_header("Location", location)
        self.send_header("Content-Length", "0")
        self.end_headers()


if __name__ == "__main__":
    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", "8000"))
    print(f"Serving on http://localhost:{port}  (signups -> {SIGNUPS.name})")
    ThreadingHTTPServer((host, port), Handler).serve_forever()

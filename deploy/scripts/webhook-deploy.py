#!/usr/bin/env python3
"""
Lightweight GitHub Webhook Deployment Daemon
Listens on localhost:9000 for GitHub push events to the 'prod' branch.
"""

import hmac
import hashlib
import json
import os
import subprocess
from http.server import HTTPServer, BaseHTTPRequestHandler

PORT = int(os.environ.get("WEBHOOK_PORT", 9000))
SECRET = os.environ.get("WEBHOOK_SECRET", "akaiunsan_prod_deploy_secret_2026")
DEPLOY_SCRIPT = "/opt/akaiunsan/deploy/scripts/auto-deploy.sh"


def verify_signature(payload: bytes, signature_header: str) -> bool:
    if not SECRET or not signature_header:
        return False
    if not signature_header.startswith("sha256="):
        return False
    expected = hmac.new(SECRET.encode(), payload, hashlib.sha256).hexdigest()
    return hmac.compare_digest(f"sha256={expected}", signature_header)


class WebhookHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path.endswith("/health"):
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"status":"ok","daemon":"akaiunsan-webhook"}\n')
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        # Support token authentication via query parameter ?token=...
        query_token = None
        if "?" in self.path:
            params = self.path.split("?", 1)[1].split("&")
            for p in params:
                if p.startswith("token="):
                    query_token = p.split("=", 1)[1]

        content_len = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_len)

        # Validate authentication: either via GitHub HMAC or token
        sig = self.headers.get("X-Hub-Signature-256", "")
        is_authenticated = verify_signature(body, sig) or (query_token and query_token == SECRET)

        if not is_authenticated:
            self.send_response(401)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"error":"unauthorized"}\n')
            return

        # Check if push was to refs/heads/prod
        should_deploy = True
        try:
            payload = json.loads(body.decode("utf-8")) if body else {}
            ref = payload.get("ref", "")
            if ref and ref != "refs/heads/prod":
                should_deploy = False
        except Exception:
            pass

        if not should_deploy:
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"status":"ignored","reason":"not prod branch"}\n')
            return

        # Trigger deployment script asynchronously
        subprocess.Popen(["/bin/bash", DEPLOY_SCRIPT], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(b'{"status":"deployment_triggered","branch":"prod"}\n')

    def log_message(self, format, *args):
        # Clean logging
        print(f"[{self.log_date_time_string()}] {format % args}")


if __name__ == "__main__":
    server = HTTPServer(("0.0.0.0", PORT), WebhookHandler)
    print(f"Webhook deployment listener active on 0.0.0.0:{PORT}")
    server.serve_forever()

import json
import os
import sys
import requests
from flask import Flask, Response, request, send_from_directory
from flask_cors import CORS

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from proxy_utils import (
    demo_mode_enabled,
    load_local_env,
    resolve_auth,
    sanitize_chat_body,
    server_api_key,
)
from contact_mail import status_payload as contact_status_payload
import privacy_store
import blog_store

load_local_env()

UPSTREAM = "https://api.openai.com/v1/chat/completions"
TRANSCRIBE_UPSTREAM = "https://api.openai.com/v1/audio/transcriptions"
TAROT_API_BASE = "https://tarotapi.dev/api/v1"

app = Flask(__name__, static_folder=ROOT, static_url_path="")
CORS(app, supports_credentials=True, expose_headers="*")

try:
    from privacy_routes import register_privacy_routes

    register_privacy_routes(app)
except Exception as e:
    print(f"[boot] privacy routes skipped: {e}", flush=True)

try:
    from contact_routes import register_contact_routes

    register_contact_routes(app)
except Exception as e:
    print(f"[boot] contact routes skipped: {e}", flush=True)

try:
    from blog_routes import register_blog_routes

    register_blog_routes(app)
except Exception as e:
    print(f"[boot] blog routes skipped: {e}", flush=True)

try:
    from external_routes import register_external_routes

    register_external_routes(app)
except Exception as e:
    print(f"[boot] external routes skipped: {e}", flush=True)


def _json_error(status: int, message: str):
    return Response(
        json.dumps({"error": message}, ensure_ascii=False),
        status=status,
        content_type="application/json",
    )


@app.route("/health")
def health():
    demo = demo_mode_enabled()
    has_key = bool(server_api_key())
    try:
        privacy = privacy_store.status_payload()
    except Exception as e:
        privacy = {"enabled": False, "ready": False, "error": str(e)}
    try:
        contact = contact_status_payload()
    except Exception as e:
        contact = {"ready": False, "error": str(e)}
    try:
        blog = blog_store.status_payload()
    except Exception as e:
        blog = {"configured": False, "ready": False, "error": str(e)}
    return {
        "ok": demo and has_key if demo else True,
        "demo_mode": demo,
        "ready": has_key if demo else True,
        "upstream": UPSTREAM,
        "transcribe": TRANSCRIBE_UPSTREAM,
        "tarot": TAROT_API_BASE,
        "privacy": privacy,
        "contact": contact,
        "blog": blog,
    }


@app.route("/v1/chat/completions", methods=["POST", "OPTIONS"])
def proxy_chat():
    if request.method == "OPTIONS":
        return Response(status=204)

    auth = resolve_auth(request.headers.get("Authorization", ""))
    if not auth:
        return _json_error(503, "Server API key is not configured")

    body, err = sanitize_chat_body(request.get_data())
    if err:
        return _json_error(400, err)

    headers = {"Content-Type": "application/json", "Authorization": auth}
    try:
        upstream = requests.post(
            UPSTREAM,
            headers=headers,
            data=body,
            stream=True,
            timeout=(10, 300),
        )
    except requests.RequestException as e:
        return _json_error(502, f"Upstream request failed: {e}")

    def generate():
        try:
            for chunk in upstream.iter_content(chunk_size=1024):
                if chunk:
                    yield chunk
        finally:
            upstream.close()

    return Response(
        generate(),
        status=upstream.status_code,
        content_type=upstream.headers.get("Content-Type", "text/event-stream"),
    )


@app.route("/v1/audio/transcriptions", methods=["POST", "OPTIONS"])
def proxy_transcribe():
    if request.method == "OPTIONS":
        return Response(status=204)
    if demo_mode_enabled():
        return _json_error(403, "Audio upload is disabled in demo mode")

    auth = resolve_auth(request.headers.get("Authorization", ""))
    if not auth:
        return _json_error(401, "Authorization header missing")

    headers = {"Authorization": auth}
    content_type = request.headers.get("Content-Type")
    if content_type:
        headers["Content-Type"] = content_type

    try:
        upstream = requests.post(
            TRANSCRIBE_UPSTREAM,
            headers=headers,
            data=request.get_data(),
            timeout=(10, 120),
        )
    except requests.RequestException as e:
        return _json_error(502, f"Upstream request failed: {e}")

    return Response(
        upstream.content,
        status=upstream.status_code,
        content_type=upstream.headers.get("Content-Type", "application/json"),
    )


@app.route("/tarot/random", methods=["GET", "OPTIONS"])
def tarot_proxy():
    if request.method == "OPTIONS":
        return Response(status=204)
    try:
        upstream = requests.get(
            f"{TAROT_API_BASE}/cards/random",
            params=request.args,
            timeout=15,
        )
        return Response(
            upstream.content,
            status=upstream.status_code,
            content_type=upstream.headers.get("Content-Type", "application/json"),
        )
    except requests.RequestException as e:
        return _json_error(502, f"Tarot API request failed: {e}")


@app.route("/")
def index():
    return send_from_directory(ROOT, "index.html")


@app.route("/<path:filename>")
def static_files(filename):
    # Keep API routes from colliding with missing static 404s.
    if filename.startswith("api/") or filename.startswith("v1/"):
        return _json_error(404, "Not found")
    path = os.path.join(ROOT, filename)
    if not os.path.isfile(path):
        return _json_error(404, "Not found")
    return send_from_directory(ROOT, filename)

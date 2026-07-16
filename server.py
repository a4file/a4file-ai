"""
스카이 AI 아바타 — CORS 우회용 로컬 프록시 서버
=================================================
실행:
    pip install flask flask-cors requests
    cp .env.example .env   # OPENAI_API_KEY 입력
    python server.py

그리고 브라우저에서 http://localhost:8080 접속
(별도 설정 없이 같은 폴더의 index.html이 자동으로 열립니다)
"""

import json
import os
import sys
import requests
from flask import Flask, request, Response, send_from_directory
from flask_cors import CORS

from proxy_utils import (
    demo_mode_enabled,
    load_local_env,
    resolve_auth,
    sanitize_chat_body,
    server_api_key,
)
from privacy_routes import register_privacy_routes
from contact_routes import register_contact_routes
from blog_routes import register_blog_routes
from external_routes import register_external_routes
from contact_mail import status_payload as contact_status_payload
import privacy_store
import blog_store

load_local_env()

UPSTREAM = "https://api.openai.com/v1/chat/completions"
TRANSCRIBE_UPSTREAM = "https://api.openai.com/v1/audio/transcriptions"
TAROT_API_BASE = "https://tarotapi.dev/api/v1"
PORT = int(os.environ.get("PORT", "8080"))

app = Flask(__name__, static_folder=".", static_url_path="")
CORS(app, supports_credentials=True, expose_headers="*")
try:
    register_privacy_routes(app)
except Exception as e:
    print(f"[boot] privacy routes skipped: {e}", flush=True)
try:
    register_contact_routes(app)
except Exception as e:
    print(f"[boot] contact routes skipped: {e}", flush=True)
try:
    register_blog_routes(app)
except Exception as e:
    print(f"[boot] blog routes skipped: {e}", flush=True)
try:
    register_external_routes(app)
except Exception as e:
    print(f"[boot] external routes skipped: {e}", flush=True)


@app.route("/")
def index():
    return send_from_directory(".", "index.html")


@app.route("/<path:filename>")
def static_files(filename):
    return send_from_directory(".", filename)


def _json_error(status: int, message: str):
    return Response(
        json.dumps({"error": message}, ensure_ascii=False),
        status=status,
        content_type="application/json",
    )


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


@app.route("/tarot/<path:subpath>", methods=["GET", "OPTIONS"])
def tarot_proxy(subpath):
    """tarotapi.dev 프록시 — 브라우저 CORS 우회용"""
    if request.method == "OPTIONS":
        return Response(status=204)
    try:
        upstream = requests.get(
            f"{TAROT_API_BASE}/cards/{subpath}",
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


@app.route("/health")
def health():
    demo = demo_mode_enabled()
    has_key = bool(server_api_key())
    return {
        "ok": demo and has_key if demo else True,
        "demo_mode": demo,
        "ready": has_key if demo else True,
        "upstream": UPSTREAM,
        "transcribe": TRANSCRIBE_UPSTREAM,
        "tarot": TAROT_API_BASE,
        "privacy": privacy_store.status_payload(),
        "contact": contact_status_payload(),
        "blog": blog_store.status_payload(),
    }


if __name__ == "__main__":
    banner = f"""
╔══════════════════════════════════════════════════╗
║  🐈‍⬛  스카이 AI 아바타 서버                          ║
║                                                  ║
║  브라우저에서 접속:                              ║
║    http://localhost:{PORT}                          ║
║                                                  ║
║  시연 모드: {'ON' if demo_mode_enabled() else 'OFF'}  |  API 키: {'설정됨' if server_api_key() else '없음 (.env 확인)'}     ║
║                                                  ║
║  종료: Ctrl+C                                    ║
╚══════════════════════════════════════════════════╝
"""
    print(banner, flush=True)
    if demo_mode_enabled() and not server_api_key():
        print("⚠️  DEMO_MODE=1 이지만 OPENAI_API_KEY 가 없습니다. .env 파일을 확인하세요.", file=sys.stderr)
    try:
        app.run(host="0.0.0.0", port=PORT, debug=False, threaded=True)
    except OSError as e:
        print(f"❌ 포트 {PORT} 실행 실패: {e}", file=sys.stderr)
        sys.exit(1)

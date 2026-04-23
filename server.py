"""
춘직이 AI 아바타 — CORS 우회용 로컬 프록시 서버
=================================================
실행:
    pip install flask flask-cors requests
    python server.py

그리고 브라우저에서 http://localhost:8080 접속
(별도 설정 없이 같은 폴더의 index.html이 자동으로 열립니다)
"""

import os
import sys
import requests
from flask import Flask, request, Response, send_from_directory
from flask_cors import CORS

UPSTREAM = "https://kanana-o.a2s-endpoint.kr-central-2.kakaocloud.com/v1/chat/completions"
TAROT_API_BASE = "https://tarotapi.dev/api/v1"
PORT = int(os.environ.get("PORT", "8080"))

app = Flask(__name__, static_folder=".", static_url_path="")
CORS(app, supports_credentials=True, expose_headers="*")


@app.route("/")
def index():
    return send_from_directory(".", "index.html")


@app.route("/<path:filename>")
def static_files(filename):
    return send_from_directory(".", filename)


@app.route("/v1/chat/completions", methods=["POST", "OPTIONS"])
def proxy_chat():
    if request.method == "OPTIONS":
        return Response(status=204)

    auth = request.headers.get("Authorization", "")
    if not auth:
        return Response('{"error":"Authorization header missing"}',
                        status=401, content_type="application/json")

    headers = {"Content-Type": "application/json", "Authorization": auth}

    try:
        upstream = requests.post(
            UPSTREAM,
            headers=headers,
            data=request.get_data(),
            stream=True,
            timeout=(10, 300),
        )
    except requests.RequestException as e:
        return Response(f'{{"error":"Upstream request failed: {e}"}}',
                        status=502, content_type="application/json")

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
        return Response(
            f'{{"error":"Tarot API request failed: {e}"}}',
            status=502,
            content_type="application/json",
        )


@app.route("/health")
def health():
    return {"ok": True, "upstream": UPSTREAM, "tarot": TAROT_API_BASE}


if __name__ == "__main__":
    banner = f"""
╔══════════════════════════════════════════════════╗
║  🐈‍⬛  춘직이 AI 아바타 서버                        ║
║                                                  ║
║  브라우저에서 접속:                              ║
║    http://localhost:{PORT}                          ║
║                                                  ║
║  종료: Ctrl+C                                    ║
╚══════════════════════════════════════════════════╝
"""
    print(banner, flush=True)
    try:
        app.run(host="0.0.0.0", port=PORT, debug=False, threaded=True)
    except OSError as e:
        print(f"❌ 포트 {PORT} 실행 실패: {e}", file=sys.stderr)
        sys.exit(1)

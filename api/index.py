import os
import requests
from flask import Flask, Response, request
from flask_cors import CORS

UPSTREAM = "https://kanana-o.a2s-endpoint.kr-central-2.kakaocloud.com/v1/chat/completions"
TAROT_API_BASE = "https://tarotapi.dev/api/v1"

app = Flask(__name__)
CORS(app, supports_credentials=True, expose_headers="*")


@app.route("/health")
def health():
    return {"ok": True, "upstream": UPSTREAM, "tarot": TAROT_API_BASE}


@app.route("/v1/chat/completions", methods=["POST", "OPTIONS"])
def proxy_chat():
    if request.method == "OPTIONS":
        return Response(status=204)

    inbound_auth = request.headers.get("Authorization", "")
    server_api_key = os.environ.get("KANANA_SERVER_API_KEY", "").strip()
    auth = inbound_auth or (f"Bearer {server_api_key}" if server_api_key else "")
    if not auth:
        return Response(
            '{"error":"Authorization header missing"}',
            status=401,
            content_type="application/json",
        )

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
        return Response(
            f'{{"error":"Upstream request failed: {e}"}}',
            status=502,
            content_type="application/json",
        )

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
        return Response(
            f'{{"error":"Tarot API request failed: {e}"}}',
            status=502,
            content_type="application/json",
        )

"""웹 도입·상담 문의 API."""

from __future__ import annotations

import json
from datetime import datetime, timezone

from flask import Flask, Response, request

from contact_mail import ContactMailError, send_inquiry_email, status_payload


def _json(data: dict, status: int = 200) -> Response:
    return Response(
        json.dumps(data, ensure_ascii=False),
        status=status,
        content_type="application/json",
    )


def register_contact_routes(app: Flask) -> None:
    @app.route("/api/contact/status", methods=["GET", "OPTIONS"])
    def contact_status():
        if request.method == "OPTIONS":
            return Response(status=204)
        return _json({"ok": True, **status_payload()})

    @app.route("/api/contact/inquiry", methods=["POST", "OPTIONS"])
    def contact_inquiry():
        if request.method == "OPTIONS":
            return Response(status=204)

        data = request.get_json(silent=True) or {}
        kind = str(data.get("kind") or "").strip()
        affiliation = str(data.get("affiliation") or "").strip()
        contact = str(data.get("contact") or "").strip()
        message = str(data.get("message") or "").strip()
        user_id = str(data.get("user_id") or "").strip()

        if not kind:
            return _json({"ok": False, "error": "구분을 입력해 주세요."}, 400)
        if not affiliation:
            return _json({"ok": False, "error": "소속을 입력해 주세요."}, 400)
        if not message or len(message) < 4:
            return _json({"ok": False, "error": "문의 내용을 조금 더 적어 주세요."}, 400)

        payload = {
            "kind": kind,
            "affiliation": affiliation,
            "contact": contact,
            "message": message,
            "user_id": user_id,
            "submitted_at": datetime.now(timezone.utc).isoformat(),
        }

        try:
            result = send_inquiry_email(payload)
        except ContactMailError as e:
            return _json({"ok": False, "error": str(e)}, 503)
        except Exception as e:  # noqa: BLE001
            return _json({"ok": False, "error": f"메일 전송 실패: {e}"}, 502)

        return _json({"ok": True, **result})

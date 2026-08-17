"""좋은 집 찾기 · 구독 신청 API."""

from __future__ import annotations

import json
import re
from datetime import datetime, timezone

from flask import Flask, Response, request

import house_data
from contact_mail import ContactMailError, send_inquiry_email
from privacy_store import data_dir

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _json(data: dict, status: int = 200) -> Response:
    return Response(
        json.dumps(data, ensure_ascii=False),
        status=status,
        content_type="application/json",
    )


def _json_error(status: int, message: str) -> Response:
    return _json({"ok": False, "error": message}, status)


def _waitlist_path():
    root = data_dir()
    root.mkdir(parents=True, exist_ok=True)
    return root / "house-waitlist.jsonl"


def register_house_routes(app: Flask) -> None:
    @app.route("/api/house/catalog", methods=["GET", "OPTIONS"])
    def house_catalog():
        if request.method == "OPTIONS":
            return Response(status=204)
        return _json(house_data.catalog())

    @app.route("/api/house/search", methods=["GET", "OPTIONS"])
    def house_search():
        if request.method == "OPTIONS":
            return Response(status=204)
        q = (request.args.get("q") or "").strip()
        layer = (request.args.get("layer") or "all").strip()
        if not q:
            return _json_error(400, "동네나 구를 적어 주세요.")
        hit = house_data.match_area(q)
        cat = house_data.catalog()
        nearby = []
        if hit:
            nearby = [
                m
                for m in cat["moa"]
                if m["gu"] == hit.get("gu") or (hit.get("kind") == "moa" and m["id"] == hit.get("id"))
            ]
        return _json(
            {
                "ok": True,
                "query": q,
                "layer": layer,
                "place": hit,
                "moa": nearby or cat["moa"][:6],
                "official": cat["official"],
                "disclaimer": cat["disclaimer"],
            }
        )

    @app.route("/api/house/signup", methods=["POST", "OPTIONS"])
    def house_signup():
        if request.method == "OPTIONS":
            return Response(status=204)
        data = request.get_json(silent=True) or {}
        email = str(data.get("email") or "").strip().lower()
        area = str(data.get("area") or "").strip()
        plan = str(data.get("plan") or "free").strip()
        if not EMAIL_RE.match(email):
            return _json_error(400, "메일 주소를 확인해 주세요.")
        row = {
            "email": email,
            "area": area,
            "plan": plan if plan in ("free", "month") else "free",
            "submitted_at": datetime.now(timezone.utc).isoformat(),
        }
        try:
            with _waitlist_path().open("a", encoding="utf-8") as f:
                f.write(json.dumps(row, ensure_ascii=False) + "\n")
        except OSError:
            pass
        mailed = False
        try:
            send_inquiry_email(
                {
                    "kind": "회원가입" if plan == "free" else "월 구독 신청",
                    "affiliation": "좋은 집 찾기",
                    "contact": email,
                    "message": f"관심 동네: {area or '미입력'}\n플랜: {row['plan']}",
                    "user_id": "",
                    "submitted_at": row["submitted_at"],
                }
            )
            mailed = True
        except ContactMailError:
            mailed = False
        except Exception:
            mailed = False
        return _json(
            {
                "ok": True,
                "email": email,
                "plan": row["plan"],
                "mailed": mailed,
                "note": "가입을 받아 두었어요. 구독 결제는 메일로 안내합니다."
                if mailed
                else "가입을 저장했어요. 메일이 안 가면 ai41@ai41.kr 로 보내 주세요.",
            }
        )

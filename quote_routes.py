"""견적 도구 API. 분해 / 공수 / 금액 / 초안."""

from __future__ import annotations

import json

from flask import Flask, Response, request

import quote_engine as qe


def _json(data: dict, status: int = 200) -> Response:
    return Response(
        json.dumps(data, ensure_ascii=False),
        status=status,
        content_type="application/json",
    )


def register_quote_routes(app: Flask) -> None:
    @app.route("/api/quote/catalog", methods=["GET", "OPTIONS"])
    def quote_catalog():
        if request.method == "OPTIONS":
            return Response(status=204)
        return _json(qe.catalog())

    @app.route("/api/quote/split", methods=["POST", "OPTIONS"])
    def quote_split():
        if request.method == "OPTIONS":
            return Response(status=204)
        data = request.get_json(silent=True) or {}
        return _json(qe.split_task(str(data.get("text") or ""), data.get("kind")))

    @app.route("/api/quote/effort", methods=["POST", "OPTIONS"])
    def quote_effort():
        if request.method == "OPTIONS":
            return Response(status=204)
        data = request.get_json(silent=True) or {}
        return _json(
            qe.estimate_effort(
                str(data.get("text") or ""),
                data.get("kind"),
                str(data.get("difficulty") or "normal"),
                bool(data.get("rush")),
                data.get("packages"),
            )
        )

    @app.route("/api/quote/price", methods=["POST", "OPTIONS"])
    def quote_price():
        if request.method == "OPTIONS":
            return Response(status=204)
        data = request.get_json(silent=True) or {}
        return _json(
            qe.price_effort(
                data.get("rows"),
                int(data.get("expert_sessions") or 0),
                int(data.get("expert_fee") or 500_000),
                data.get("floor"),
                data.get("kind"),
                data.get("span"),
                int(data.get("units") or 1),
            )
        )

    @app.route("/api/quote/draft", methods=["POST", "OPTIONS"])
    def quote_draft():
        if request.method == "OPTIONS":
            return Response(status=204)
        data = request.get_json(silent=True) or {}
        text = str(data.get("text") or "").strip()
        if not text:
            return _json({"ok": False, "error": "과업을 적어 주세요."}, 400)
        return _json(
            qe.draft(
                text,
                str(data.get("difficulty") or "normal"),
                bool(data.get("rush")),
                data.get("span"),
            )
        )

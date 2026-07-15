"""개인정보·보호자 API 라우트."""

from __future__ import annotations

import json

from flask import Response, request

import privacy_store as store


def _json(data, status: int = 200):
    return Response(
        json.dumps(data, ensure_ascii=False),
        status=status,
        content_type="application/json",
    )


def _json_error(status: int, message: str):
    return _json({"error": message}, status=status)


def _disabled():
    return _json_error(503, "Privacy storage is disabled")


def _bad_body():
    return None, _json_error(400, "Invalid JSON body")


def _parse_json():
    try:
        data = request.get_json(silent=True)
    except Exception:
        return None, _json_error(400, "Invalid JSON body")
    if not isinstance(data, dict):
        return None, _json_error(400, "Invalid JSON body")
    return data, None


def _user_id_from_query_or_body(data: dict | None = None):
    user_id = (request.args.get("user_id") or (data or {}).get("user_id") or "").strip()
    if not user_id:
        return None, _json_error(400, "user_id is required")
    return user_id, None


def _guardian_token() -> str:
    return (request.headers.get("X-Guardian-Token") or "").strip()


def _require_guardian():
    token = _guardian_token()
    if not store.validate_guardian_session(token):
        return _json_error(401, "Guardian authentication required")
    return None


def _require_store():
    if not store.privacy_enabled():
        return _disabled()
    if not store.ensure_db():
        return _json_error(503, "Privacy storage unavailable")
    return None


def register_privacy_routes(app):
    # Never crash app import on read-only serverless filesystems.
    try:
        store.init_db()
    except Exception as e:
        print(f"[privacy] init skipped: {e}", flush=True)

    @app.route("/api/privacy/status", methods=["GET", "OPTIONS"])
    def privacy_status():
        if request.method == "OPTIONS":
            return Response(status=204)
        if not store.privacy_enabled():
            return _disabled()
        store.ensure_db()
        return _json(store.status_payload())

    @app.route("/api/privacy/consent", methods=["GET", "POST", "OPTIONS"])
    def privacy_consent():
        if request.method == "OPTIONS":
            return Response(status=204)
        blocked = _require_store()
        if blocked:
            return blocked

        if request.method == "GET":
            user_id, err = _user_id_from_query_or_body()
            if err:
                return err
            consent = store.get_consent(user_id)
            return _json(
                {
                    "user_id": user_id,
                    "version": store.CONSENT_VERSION,
                    "accepted": bool(consent and consent.get("accepted")),
                    "consent": consent,
                }
            )

        data, err = _parse_json()
        if err:
            return err
        user_id, err = _user_id_from_query_or_body(data)
        if err:
            return err
        accepted = bool(data.get("accepted"))
        version = str(data.get("version") or store.CONSENT_VERSION)
        consent = store.set_consent(user_id, accepted, version)
        if accepted:
            store.add_activity(user_id, "consent_granted", f"version={version}")
        else:
            store.add_activity(user_id, "consent_withdrawn", f"version={version}")
        return _json({"ok": True, "consent": consent})

    @app.route("/api/privacy/messages", methods=["POST", "OPTIONS"])
    def privacy_messages():
        if request.method == "OPTIONS":
            return Response(status=204)
        blocked = _require_store()
        if blocked:
            return blocked

        data, err = _parse_json()
        if err:
            return err
        user_id, err = _user_id_from_query_or_body(data)
        if err:
            return err

        consent = store.get_consent(user_id)
        if not consent or not consent.get("accepted"):
            return _json_error(403, "Privacy consent required")

        role = str(data.get("role") or "user").strip() or "user"
        module = str(data.get("module") or "chat").strip() or "chat"
        text = str(data.get("text") or "").strip()
        if not text:
            return _json_error(400, "text is required")

        msg_id = store.add_message(user_id, role, text, module)
        return _json({"ok": True, "id": msg_id})

    @app.route("/api/privacy/activity", methods=["POST", "OPTIONS"])
    def privacy_activity():
        if request.method == "OPTIONS":
            return Response(status=204)
        blocked = _require_store()
        if blocked:
            return blocked

        data, err = _parse_json()
        if err:
            return err
        user_id, err = _user_id_from_query_or_body(data)
        if err:
            return err

        consent = store.get_consent(user_id)
        if not consent or not consent.get("accepted"):
            return _json_error(403, "Privacy consent required")

        event_type = str(data.get("event_type") or "").strip()
        if not event_type:
            return _json_error(400, "event_type is required")
        detail = str(data.get("detail") or "").strip() or None
        act_id = store.add_activity(user_id, event_type, detail)
        return _json({"ok": True, "id": act_id})

    @app.route("/api/privacy/export", methods=["GET", "OPTIONS"])
    def privacy_export():
        if request.method == "OPTIONS":
            return Response(status=204)
        blocked = _require_store()
        if blocked:
            return blocked

        user_id, err = _user_id_from_query_or_body()
        if err:
            return err
        payload = store.export_user_data(user_id)
        return _json(payload)

    @app.route("/api/privacy/data", methods=["DELETE", "OPTIONS"])
    def privacy_delete_data():
        if request.method == "OPTIONS":
            return Response(status=204)
        blocked = _require_store()
        if blocked:
            return blocked

        user_id, err = _user_id_from_query_or_body()
        if err:
            return err
        result = store.delete_user_data(user_id)
        return _json({"ok": True, **result})

    @app.route("/api/privacy/guardian/login", methods=["POST", "OPTIONS"])
    def guardian_login():
        if request.method == "OPTIONS":
            return Response(status=204)
        blocked = _require_store()
        if blocked:
            return blocked
        if not store.guardian_pin_configured():
            return _json_error(503, "Guardian PIN is not configured")

        data, err = _parse_json()
        if err:
            return err
        pin = str(data.get("pin") or "")
        if not store.verify_guardian_pin(pin):
            return _json_error(401, "Invalid guardian PIN")
        session = store.create_guardian_session()
        return _json({"ok": True, **session})

    @app.route("/api/privacy/guardian/logout", methods=["POST", "OPTIONS"])
    def guardian_logout():
        if request.method == "OPTIONS":
            return Response(status=204)
        token = _guardian_token()
        if token and store.db_ready():
            store.revoke_guardian_session(token)
        return _json({"ok": True})

    @app.route("/api/privacy/guardian/users", methods=["GET", "OPTIONS"])
    def guardian_users():
        if request.method == "OPTIONS":
            return Response(status=204)
        blocked = _require_store()
        if blocked:
            return blocked
        auth_err = _require_guardian()
        if auth_err:
            return auth_err
        return _json({"users": store.list_users()})

    @app.route("/api/privacy/guardian/dashboard", methods=["GET", "OPTIONS"])
    def guardian_dashboard():
        if request.method == "OPTIONS":
            return Response(status=204)
        blocked = _require_store()
        if blocked:
            return blocked
        auth_err = _require_guardian()
        if auth_err:
            return auth_err
        user_id, err = _user_id_from_query_or_body()
        if err:
            return err
        return _json(store.guardian_dashboard(user_id))
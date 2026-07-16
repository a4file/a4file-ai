"""공개 블로그 + 관리자 CRUD API."""

from __future__ import annotations

import json

from flask import Response, request

import blog_store as store


def _json(data, status: int = 200):
    return Response(
        json.dumps(data, ensure_ascii=False),
        status=status,
        content_type="application/json",
    )


def _json_error(status: int, message: str):
    return _json({"ok": False, "error": message}, status)


def _parse_json():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return None, _json_error(400, "Invalid JSON body")
    return data, None


def _admin_token() -> str:
    return (request.headers.get("X-Admin-Token") or "").strip()


def _require_admin():
    if not store.admin_configured():
        return _json_error(503, "Admin PIN is not configured")
    if not store.db_configured() or not store.ensure_ready():
        return _json_error(503, "Database unavailable")
    if not store.verify_admin_token(_admin_token()):
        return _json_error(401, "Admin authentication required")
    return None


def register_blog_routes(app):
    try:
        store.init_schema()
    except Exception as e:
        print(f"[blog] init skipped: {e}", flush=True)

    @app.route("/api/blog/status", methods=["GET", "OPTIONS"])
    def blog_status():
        if request.method == "OPTIONS":
            return Response(status=204)
        store.ensure_ready()
        return _json({"ok": True, **store.status_payload()})

    @app.route("/api/blog/posts", methods=["GET", "OPTIONS"])
    def blog_list_public():
        if request.method == "OPTIONS":
            return Response(status=204)
        page = request.args.get("page", "1")
        limit = request.args.get("limit", "3")
        try:
            page_i = int(page)
            limit_i = int(limit)
        except ValueError:
            return _json_error(400, "page and limit must be integers")
        return _json({"ok": True, **store.list_published(page_i, limit_i)})

    @app.route("/api/blog/posts/<slug>", methods=["GET", "OPTIONS"])
    def blog_get_public(slug: str):
        if request.method == "OPTIONS":
            return Response(status=204)
        post = store.get_published_by_slug(slug)
        if not post:
            return _json_error(404, "Post not found")
        return _json({"ok": True, "post": post})

    @app.route("/api/blog/admin/login", methods=["POST", "OPTIONS"])
    def blog_admin_login():
        if request.method == "OPTIONS":
            return Response(status=204)
        if not store.admin_configured():
            return _json_error(503, "Admin PIN is not configured")
        if not store.db_configured() or not store.ensure_ready():
            return _json_error(503, "Database unavailable")
        data, err = _parse_json()
        if err:
            return err
        pin = str(data.get("pin") or "")
        if not store.verify_admin_pin(pin):
            return _json_error(401, "Invalid admin PIN")
        session = store.create_admin_token()
        return _json({"ok": True, **session})

    @app.route("/api/blog/admin/posts", methods=["GET", "POST", "OPTIONS"])
    def blog_admin_posts():
        if request.method == "OPTIONS":
            return Response(status=204)
        auth = _require_admin()
        if auth:
            return auth
        if request.method == "GET":
            return _json({"ok": True, "items": store.list_admin_posts()})
        data, err = _parse_json()
        if err:
            return err
        try:
            post = store.create_post(data)
        except ValueError as e:
            return _json_error(400, str(e))
        except Exception as e:
            return _json_error(500, f"Create failed: {e}")
        return _json({"ok": True, "post": post}, 201)

    @app.route("/api/blog/admin/posts/<post_id>", methods=["GET", "PATCH", "DELETE", "OPTIONS"])
    def blog_admin_post(post_id: str):
        if request.method == "OPTIONS":
            return Response(status=204)
        auth = _require_admin()
        if auth:
            return auth
        if request.method == "GET":
            post = store.get_post_by_id(post_id)
            if not post:
                return _json_error(404, "Post not found")
            return _json({"ok": True, "post": post})
        if request.method == "DELETE":
            try:
                ok = store.delete_post(post_id)
            except Exception as e:
                return _json_error(500, f"Delete failed: {e}")
            if not ok:
                return _json_error(404, "Post not found")
            return _json({"ok": True})
        data, err = _parse_json()
        if err:
            return err
        try:
            post = store.update_post(post_id, data)
        except Exception as e:
            return _json_error(500, f"Update failed: {e}")
        if not post:
            return _json_error(404, "Post not found")
        return _json({"ok": True, "post": post})

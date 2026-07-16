"""Neon Postgres blog posts — soft-fail when DATABASE_URL is missing."""

from __future__ import annotations

import hashlib
import hmac
import os
import re
import secrets
import time
import uuid
from contextlib import contextmanager
from datetime import datetime, timezone
from typing import Any, Iterator

_SCHEMA_READY = False
_SEED_DONE = False

ADMIN_TOKEN_TTL_SEC = 8 * 3600

SEED_POSTS = [
    {
        "title": "AI41을 소개합니다",
        "slug": "meet-ai41",
        "summary": "한 사람을 위한 AI, AI FOR ONE.",
        "body": (
            "AI41(주식회사 AI41)은 신경다양성 당사자와 가족을 위한 AI를 만듭니다.\n\n"
            "이름은 AI FOR ONE — 모두를 위한 AI와 한 사람을 위한 AI를 함께 만든다는 뜻이에요.\n"
            "사회적기업 창업지원사업에 선정된 딥테크 임팩트 팀으로, 서울에 본점을 두고 2025년 설립되었습니다."
        ),
        "thumbnail_url": "/logo.png",
    },
    {
        "title": "스카이 — 저자극 AI 도우미",
        "slug": "about-sky",
        "summary": "일상 지원 도구와 함께하는 대화형 AI.",
        "body": (
            "스카이는 신경다양성 당사자·가족을 위한 저자극 AI 컴패니언입니다.\n\n"
            "타로, 사회성 연습, 감각·행동 조절, 루틴, 미니게임 등 일상에 필요한 도구를 앱 안에서 바로 열어 줍니다.\n"
            "치료·진단을 대체하지 않는 보조 도구예요."
        ),
        "thumbnail_url": "/logo.png",
    },
    {
        "title": "임팩트와 숫자",
        "slug": "impact-numbers",
        "summary": "TRL6 시연, 커뮤니티, 시드 투자.",
        "body": (
            "AI41은 2025년 설립 이후 스카이 TRL6 시연, 200+ 커뮤니티, 110+ 검증 참여, "
            "시드 2,500만 원, Managed 3+1 팀 모델로 성장을 이어가고 있습니다.\n\n"
            "공공·디지털 생태계(NIA), 카카오 AI 실험, 오티즘엑스포 공개 시연 등 현장에서 증명합니다."
        ),
        "thumbnail_url": "/logo.png",
    },
    {
        "title": "연대 허브와 파트너",
        "slug": "partners-hub",
        "summary": "함께 걷는 기관·커뮤니티.",
        "body": (
            "자폐인사랑협회, 민윤기치료센터, 한국피플퍼스트, 사회적기업진흥원, "
            "유디임팩트, 뉴키즈인베스트먼트, 타임뱅크코리아, 소소한소통 등 "
            "다양한 파트너와 연대합니다.\n\n"
            "도입·PoC·파트너십 문의는 웹사이트에서 스카이에게 「도입 문의」라고 말해 주세요."
        ),
        "thumbnail_url": "/logo.png",
    },
]


def database_url() -> str:
    return (os.environ.get("DATABASE_URL") or "").strip()


def db_configured() -> bool:
    return bool(database_url())


def admin_pin() -> str:
    return (os.environ.get("ADMIN_PIN") or "").strip()


def admin_configured() -> bool:
    return bool(admin_pin())


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _slugify(text: str) -> str:
    s = re.sub(r"[^\w\s-]", "", (text or "").strip().lower(), flags=re.UNICODE)
    s = re.sub(r"[-\s]+", "-", s).strip("-")
    return s or secrets.token_hex(4)


@contextmanager
def _conn() -> Iterator[Any]:
    import psycopg
    from psycopg.rows import dict_row

    url = database_url()
    if not url:
        raise RuntimeError("DATABASE_URL is not configured")
    with psycopg.connect(url, row_factory=dict_row) as conn:
        yield conn


def init_schema() -> bool:
    """Create tables and seed if empty. Returns False if DB unavailable."""
    global _SCHEMA_READY, _SEED_DONE
    if not db_configured():
        _SCHEMA_READY = False
        return False
    try:
        with _conn() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS posts (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    slug TEXT NOT NULL UNIQUE,
                    summary TEXT NOT NULL DEFAULT '',
                    body TEXT NOT NULL DEFAULT '',
                    thumbnail_url TEXT NOT NULL DEFAULT '',
                    status TEXT NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft', 'published')),
                    published_at TIMESTAMPTZ,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                );
                CREATE INDEX IF NOT EXISTS idx_posts_published
                    ON posts (published_at DESC NULLS LAST)
                    WHERE status = 'published';
                """
            )
            conn.commit()
        _SCHEMA_READY = True
        _ensure_seed()
        return True
    except Exception as e:
        _SCHEMA_READY = False
        print(f"[blog] init_schema failed: {e}", flush=True)
        return False


def _ensure_seed() -> None:
    global _SEED_DONE
    if _SEED_DONE or not _SCHEMA_READY:
        return
    try:
        with _conn() as conn:
            row = conn.execute("SELECT COUNT(*) AS n FROM posts").fetchone()
            if row and int(row["n"]) > 0:
                _SEED_DONE = True
                return
            now = _now()
            for item in SEED_POSTS:
                conn.execute(
                    """
                    INSERT INTO posts (
                        id, title, slug, summary, body, thumbnail_url,
                        status, published_at, created_at, updated_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, 'published', %s, %s, %s)
                    ON CONFLICT (slug) DO NOTHING
                    """,
                    (
                        str(uuid.uuid4()),
                        item["title"],
                        item["slug"],
                        item["summary"],
                        item["body"],
                        item["thumbnail_url"],
                        now,
                        now,
                        now,
                    ),
                )
            conn.commit()
        _SEED_DONE = True
    except Exception as e:
        print(f"[blog] seed failed: {e}", flush=True)


def ensure_ready() -> bool:
    if _SCHEMA_READY:
        return True
    return init_schema()


def status_payload() -> dict[str, Any]:
    return {
        "configured": db_configured(),
        "ready": _SCHEMA_READY,
        "admin_configured": admin_configured(),
    }


def _row_to_post(row: dict[str, Any] | None, *, include_body: bool = True) -> dict[str, Any] | None:
    if not row:
        return None
    out = {
        "id": row["id"],
        "title": row["title"],
        "slug": row["slug"],
        "summary": row.get("summary") or "",
        "thumbnail_url": row.get("thumbnail_url") or "",
        "status": row["status"],
        "published_at": row["published_at"].isoformat() if row.get("published_at") else None,
        "created_at": row["created_at"].isoformat() if row.get("created_at") else None,
        "updated_at": row["updated_at"].isoformat() if row.get("updated_at") else None,
    }
    if include_body:
        out["body"] = row.get("body") or ""
    return out


def list_published(page: int = 1, limit: int = 3) -> dict[str, Any]:
    if not ensure_ready():
        return {"items": [], "page": page, "limit": limit, "total": 0, "pages": 0}
    page = max(1, int(page or 1))
    limit = max(1, min(12, int(limit or 3)))
    offset = (page - 1) * limit
    with _conn() as conn:
        total_row = conn.execute(
            "SELECT COUNT(*) AS n FROM posts WHERE status = 'published'"
        ).fetchone()
        total = int(total_row["n"]) if total_row else 0
        rows = conn.execute(
            """
            SELECT id, title, slug, summary, thumbnail_url, status,
                   published_at, created_at, updated_at
            FROM posts
            WHERE status = 'published'
            ORDER BY published_at DESC NULLS LAST, created_at DESC
            LIMIT %s OFFSET %s
            """,
            (limit, offset),
        ).fetchall()
    items = [_row_to_post(r, include_body=False) for r in rows]
    pages = (total + limit - 1) // limit if total else 0
    return {"items": items, "page": page, "limit": limit, "total": total, "pages": pages}


def get_published_by_slug(slug: str) -> dict[str, Any] | None:
    if not ensure_ready():
        return None
    with _conn() as conn:
        row = conn.execute(
            """
            SELECT * FROM posts
            WHERE slug = %s AND status = 'published'
            """,
            (slug,),
        ).fetchone()
    return _row_to_post(row, include_body=True)


def list_admin_posts() -> list[dict[str, Any]]:
    if not ensure_ready():
        return []
    with _conn() as conn:
        rows = conn.execute(
            """
            SELECT id, title, slug, summary, thumbnail_url, status,
                   published_at, created_at, updated_at
            FROM posts
            ORDER BY updated_at DESC
            """
        ).fetchall()
    return [_row_to_post(r, include_body=False) for r in rows]  # type: ignore[misc]


def get_post_by_id(post_id: str) -> dict[str, Any] | None:
    if not ensure_ready():
        return None
    with _conn() as conn:
        row = conn.execute("SELECT * FROM posts WHERE id = %s", (post_id,)).fetchone()
    return _row_to_post(row, include_body=True)


def create_post(data: dict[str, Any]) -> dict[str, Any]:
    if not ensure_ready():
        raise RuntimeError("Database unavailable")
    now = _now()
    post_id = str(uuid.uuid4())
    title = str(data.get("title") or "").strip()
    if not title:
        raise ValueError("title is required")
    slug = str(data.get("slug") or "").strip() or _slugify(title)
    summary = str(data.get("summary") or "").strip()
    body = str(data.get("body") or "").strip()
    thumbnail_url = str(data.get("thumbnail_url") or "").strip()
    status = str(data.get("status") or "draft").strip().lower()
    if status not in ("draft", "published"):
        status = "draft"
    published_at = now if status == "published" else None
    with _conn() as conn:
        conn.execute(
            """
            INSERT INTO posts (
                id, title, slug, summary, body, thumbnail_url,
                status, published_at, created_at, updated_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                post_id,
                title,
                slug,
                summary,
                body,
                thumbnail_url,
                status,
                published_at,
                now,
                now,
            ),
        )
        conn.commit()
    return get_post_by_id(post_id) or {}


def update_post(post_id: str, data: dict[str, Any]) -> dict[str, Any] | None:
    if not ensure_ready():
        raise RuntimeError("Database unavailable")
    existing = get_post_by_id(post_id)
    if not existing:
        return None
    title = str(data.get("title", existing["title"])).strip()
    slug = str(data.get("slug", existing["slug"])).strip() or existing["slug"]
    summary = str(data.get("summary", existing.get("summary") or "")).strip()
    body = str(data.get("body", existing.get("body") or "")).strip()
    thumbnail_url = str(data.get("thumbnail_url", existing.get("thumbnail_url") or "")).strip()
    status = str(data.get("status", existing["status"])).strip().lower()
    if status not in ("draft", "published"):
        status = existing["status"]
    published_at = existing.get("published_at")
    if status == "published":
        if not published_at:
            published_at = _now()
        elif isinstance(published_at, str):
            try:
                published_at = datetime.fromisoformat(published_at.replace("Z", "+00:00"))
            except ValueError:
                published_at = _now()
    else:
        published_at = None
    now = _now()
    with _conn() as conn:
        conn.execute(
            """
            UPDATE posts SET
                title = %s, slug = %s, summary = %s, body = %s,
                thumbnail_url = %s, status = %s,
                published_at = %s, updated_at = %s
            WHERE id = %s
            """,
            (
                title,
                slug,
                summary,
                body,
                thumbnail_url,
                status,
                published_at,
                now,
                post_id,
            ),
        )
        conn.commit()
    return get_post_by_id(post_id)


def delete_post(post_id: str) -> bool:
    if not ensure_ready():
        raise RuntimeError("Database unavailable")
    with _conn() as conn:
        cur = conn.execute("DELETE FROM posts WHERE id = %s", (post_id,))
        conn.commit()
        return cur.rowcount > 0


def _admin_secret() -> bytes:
    raw = (os.environ.get("ADMIN_TOKEN_SECRET") or admin_pin() or "ai41-admin").encode("utf-8")
    return hashlib.sha256(raw).digest()


def create_admin_token() -> dict[str, Any]:
    if not admin_configured():
        raise RuntimeError("ADMIN_PIN is not configured")
    exp = int(time.time()) + ADMIN_TOKEN_TTL_SEC
    nonce = secrets.token_hex(8)
    payload = f"{exp}.{nonce}"
    sig = hmac.new(_admin_secret(), payload.encode("utf-8"), hashlib.sha256).hexdigest()
    token = f"{payload}.{sig}"
    return {"token": token, "expires_in": ADMIN_TOKEN_TTL_SEC}


def verify_admin_token(token: str) -> bool:
    if not token or not admin_configured():
        return False
    parts = token.split(".")
    if len(parts) != 3:
        return False
    exp_s, nonce, sig = parts
    try:
        exp = int(exp_s)
    except ValueError:
        return False
    if exp < int(time.time()):
        return False
    payload = f"{exp_s}.{nonce}"
    expect = hmac.new(_admin_secret(), payload.encode("utf-8"), hashlib.sha256).hexdigest()
    return hmac.compare_digest(expect, sig)


def verify_admin_pin(pin: str) -> bool:
    expected = admin_pin()
    if not expected:
        return False
    return hmac.compare_digest(expected, str(pin or ""))

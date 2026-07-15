"""암호화 저장소 — 동의, 대화, 활동 로그, 보호자 세션."""

from __future__ import annotations

import base64
import hashlib
import json
import os
import secrets
import sqlite3
import threading
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

try:
    from cryptography.fernet import Fernet, InvalidToken
except ImportError:  # pragma: no cover
    Fernet = None
    InvalidToken = Exception

CONSENT_VERSION = "1.0"
SESSION_TTL_SEC = 3600
_lock = threading.RLock()


def _root_dir() -> Path:
    return Path(os.path.dirname(os.path.abspath(__file__)))


def data_dir() -> Path:
    raw = os.environ.get("DATA_DIR", "").strip()
    return Path(raw) if raw else _root_dir() / "data"


def db_path() -> Path:
    return data_dir() / "privacy.db"


def privacy_enabled() -> bool:
    return os.environ.get("PRIVACY_ENABLED", "1").strip().lower() in ("1", "true", "yes", "on")


def guardian_pin_configured() -> bool:
    return bool(os.environ.get("GUARDIAN_PIN", "").strip())


def _encryption_key() -> bytes:
    raw = os.environ.get("PRIVACY_ENCRYPTION_KEY", "").strip()
    if raw:
        return raw.encode("utf-8")
    pin = os.environ.get("GUARDIAN_PIN", "change-me")
    digest = hashlib.sha256(f"sky-privacy:{pin}".encode("utf-8")).digest()
    return base64.urlsafe_b64encode(digest)


def _fernet() -> Fernet:
    if Fernet is None:
        raise RuntimeError("cryptography package is required for privacy storage")
    return Fernet(_encryption_key())


def encrypt_text(text: str) -> str:
    return _fernet().encrypt(text.encode("utf-8")).decode("ascii")


def decrypt_text(token: str) -> str:
    try:
        return _fernet().decrypt(token.encode("ascii")).decode("utf-8")
    except InvalidToken:
        return "[복호화 실패]"


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _connect() -> sqlite3.Connection:
    conn = sqlite3.connect(db_path(), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    data_dir().mkdir(parents=True, exist_ok=True)
    with _lock, _connect() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS consents (
                user_id TEXT PRIMARY KEY,
                version TEXT NOT NULL,
                accepted INTEGER NOT NULL,
                accepted_at TEXT,
                updated_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                role TEXT NOT NULL,
                module TEXT NOT NULL DEFAULT 'chat',
                body_enc TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_messages_user ON messages(user_id, created_at);
            CREATE TABLE IF NOT EXISTS activity_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                event_type TEXT NOT NULL,
                detail_enc TEXT,
                created_at TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_logs(user_id, created_at);
            CREATE TABLE IF NOT EXISTS guardian_sessions (
                token TEXT PRIMARY KEY,
                created_at TEXT NOT NULL,
                expires_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS deletion_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                requested_at TEXT NOT NULL,
                completed_at TEXT NOT NULL
            );
            """
        )


def get_consent(user_id: str) -> dict[str, Any] | None:
    with _lock, _connect() as conn:
        row = conn.execute(
            "SELECT user_id, version, accepted, accepted_at, updated_at FROM consents WHERE user_id = ?",
            (user_id,),
        ).fetchone()
    if not row:
        return None
    return {
        "user_id": row["user_id"],
        "version": row["version"],
        "accepted": bool(row["accepted"]),
        "accepted_at": row["accepted_at"],
        "updated_at": row["updated_at"],
    }


def set_consent(user_id: str, accepted: bool, version: str = CONSENT_VERSION) -> dict[str, Any]:
    now = _now_iso()
    accepted_at = now if accepted else None
    with _lock, _connect() as conn:
        conn.execute(
            """
            INSERT INTO consents (user_id, version, accepted, accepted_at, updated_at)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
                version = excluded.version,
                accepted = excluded.accepted,
                accepted_at = excluded.accepted_at,
                updated_at = excluded.updated_at
            """,
            (user_id, version, int(accepted), accepted_at, now),
        )
        conn.commit()
    return get_consent(user_id) or {}


def add_message(user_id: str, role: str, text: str, module: str = "chat") -> int:
    now = _now_iso()
    body_enc = encrypt_text(text)
    with _lock, _connect() as conn:
        cur = conn.execute(
            """
            INSERT INTO messages (user_id, role, module, body_enc, created_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (user_id, role, module, body_enc, now),
        )
        conn.commit()
        return int(cur.lastrowid)


def add_activity(user_id: str, event_type: str, detail: str | None = None) -> int:
    now = _now_iso()
    detail_enc = encrypt_text(detail) if detail else None
    with _lock, _connect() as conn:
        cur = conn.execute(
            """
            INSERT INTO activity_logs (user_id, event_type, detail_enc, created_at)
            VALUES (?, ?, ?, ?)
            """,
            (user_id, event_type, detail_enc, now),
        )
        conn.commit()
        return int(cur.lastrowid)


def _rows_messages(conn: sqlite3.Connection, user_id: str, limit: int = 200) -> list[dict[str, Any]]:
    rows = conn.execute(
        """
        SELECT id, role, module, body_enc, created_at
        FROM messages WHERE user_id = ?
        ORDER BY created_at DESC LIMIT ?
        """,
        (user_id, limit),
    ).fetchall()
    out = []
    for row in reversed(rows):
        out.append(
            {
                "id": row["id"],
                "role": row["role"],
                "module": row["module"],
                "text": decrypt_text(row["body_enc"]),
                "created_at": row["created_at"],
            }
        )
    return out


def _rows_activity(conn: sqlite3.Connection, user_id: str, limit: int = 100) -> list[dict[str, Any]]:
    rows = conn.execute(
        """
        SELECT id, event_type, detail_enc, created_at
        FROM activity_logs WHERE user_id = ?
        ORDER BY created_at DESC LIMIT ?
        """,
        (user_id, limit),
    ).fetchall()
    out = []
    for row in reversed(rows):
        detail = decrypt_text(row["detail_enc"]) if row["detail_enc"] else None
        out.append(
            {
                "id": row["id"],
                "event_type": row["event_type"],
                "detail": detail,
                "created_at": row["created_at"],
            }
        )
    return out


def export_user_data(user_id: str) -> dict[str, Any]:
    with _lock, _connect() as conn:
        consent = get_consent(user_id)
        messages = _rows_messages(conn, user_id, limit=500)
        activity = _rows_activity(conn, user_id, limit=200)
        message_count = conn.execute(
            "SELECT COUNT(*) AS c FROM messages WHERE user_id = ?", (user_id,)
        ).fetchone()["c"]
        activity_count = conn.execute(
            "SELECT COUNT(*) AS c FROM activity_logs WHERE user_id = ?", (user_id,)
        ).fetchone()["c"]
    return {
        "user_id": user_id,
        "exported_at": _now_iso(),
        "consent": consent,
        "summary": {
            "message_count": message_count,
            "activity_count": activity_count,
        },
        "messages": messages,
        "activity": activity,
    }


def delete_user_data(user_id: str) -> dict[str, Any]:
    now = _now_iso()
    with _lock, _connect() as conn:
        msg_deleted = conn.execute("DELETE FROM messages WHERE user_id = ?", (user_id,)).rowcount
        act_deleted = conn.execute("DELETE FROM activity_logs WHERE user_id = ?", (user_id,)).rowcount
        conn.execute("DELETE FROM consents WHERE user_id = ?", (user_id,))
        conn.execute(
            "INSERT INTO deletion_logs (user_id, requested_at, completed_at) VALUES (?, ?, ?)",
            (user_id, now, now),
        )
        conn.commit()
    return {
        "user_id": user_id,
        "deleted_at": now,
        "messages_deleted": msg_deleted,
        "activity_deleted": act_deleted,
    }


def list_users(limit: int = 100) -> list[dict[str, Any]]:
    with _lock, _connect() as conn:
        rows = conn.execute(
            """
            SELECT
                m.user_id,
                MAX(m.created_at) AS last_message_at,
                COUNT(m.id) AS message_count
            FROM messages m
            GROUP BY m.user_id
            ORDER BY last_message_at DESC
            LIMIT ?
            """,
            (limit,),
        ).fetchall()
    users = []
    for row in rows:
        consent = get_consent(row["user_id"])
        users.append(
            {
                "user_id": row["user_id"],
                "last_message_at": row["last_message_at"],
                "message_count": row["message_count"],
                "consent_accepted": bool(consent and consent.get("accepted")),
            }
        )
    return users


def guardian_dashboard(user_id: str) -> dict[str, Any]:
    with _lock, _connect() as conn:
        consent = get_consent(user_id)
        messages = _rows_messages(conn, user_id, limit=100)
        activity = _rows_activity(conn, user_id, limit=50)
    return {
        "user_id": user_id,
        "consent": consent,
        "messages": messages,
        "activity": activity,
    }


def verify_guardian_pin(pin: str) -> bool:
    expected = os.environ.get("GUARDIAN_PIN", "").strip()
    if not expected:
        return False
    return secrets.compare_digest(str(pin), expected)


def create_guardian_session() -> dict[str, Any]:
    token = secrets.token_urlsafe(32)
    created = datetime.now(timezone.utc)
    expires = created + timedelta(seconds=SESSION_TTL_SEC)
    with _lock, _connect() as conn:
        conn.execute(
            "INSERT INTO guardian_sessions (token, created_at, expires_at) VALUES (?, ?, ?)",
            (token, created.isoformat(), expires.isoformat()),
        )
        conn.commit()
    return {"token": token, "expires_at": expires.isoformat()}


def validate_guardian_session(token: str) -> bool:
    if not token:
        return False
    now = datetime.now(timezone.utc)
    with _lock, _connect() as conn:
        row = conn.execute(
            "SELECT expires_at FROM guardian_sessions WHERE token = ?", (token,)
        ).fetchone()
        if not row:
            return False
        expires = datetime.fromisoformat(row["expires_at"])
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=timezone.utc)
        if now >= expires:
            conn.execute("DELETE FROM guardian_sessions WHERE token = ?", (token,))
            conn.commit()
            return False
    return True


def revoke_guardian_session(token: str) -> None:
    with _lock, _connect() as conn:
        conn.execute("DELETE FROM guardian_sessions WHERE token = ?", (token,))
        conn.commit()


def status_payload() -> dict[str, Any]:
    return {
        "enabled": privacy_enabled(),
        "consent_version": CONSENT_VERSION,
        "guardian_configured": guardian_pin_configured(),
        "encryption": "fernet-aes",
        "storage": "sqlite",
    }

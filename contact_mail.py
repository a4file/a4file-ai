"""문의 메일 발송 — Resend API 또는 SMTP."""

from __future__ import annotations

import json
import os
import smtplib
import ssl
from email.message import EmailMessage
from typing import Any

import requests


class ContactMailError(Exception):
    pass


def contact_to() -> str:
    return (os.environ.get("CONTACT_TO") or "ai41@ai41.kr").strip()


def contact_mail_ready() -> bool:
    if (os.environ.get("RESEND_API_KEY") or "").strip():
        return True
    host = (os.environ.get("SMTP_HOST") or "").strip()
    user = (os.environ.get("SMTP_USER") or "").strip()
    password = (os.environ.get("SMTP_PASS") or "").strip()
    return bool(host and user and password)


def status_payload() -> dict[str, Any]:
    return {
        "ready": contact_mail_ready(),
        "to": contact_to(),
        "via": (
            "resend"
            if (os.environ.get("RESEND_API_KEY") or "").strip()
            else ("smtp" if contact_mail_ready() else None)
        ),
    }


def _build_body(payload: dict[str, Any]) -> str:
    kind = str(payload.get("kind") or "").strip() or "(미입력)"
    affiliation = str(payload.get("affiliation") or "").strip() or "(미입력)"
    contact = str(payload.get("contact") or "").strip() or "(미입력)"
    message = str(payload.get("message") or "").strip() or "(미입력)"
    user_id = str(payload.get("user_id") or "").strip() or "-"
    submitted_at = str(payload.get("submitted_at") or "").strip() or "-"
    return (
        "[AI41 웹사이트 도입·상담 문의]\n\n"
        f"구분: {kind}\n"
        f"소속: {affiliation}\n"
        f"회신 연락처: {contact}\n\n"
        f"문의 내용:\n{message}\n\n"
        f"제출 시각: {submitted_at}\n"
        f"이용자 ID: {user_id}\n"
    )


def _send_via_resend(subject: str, body: str, reply_to: str | None) -> None:
    api_key = (os.environ.get("RESEND_API_KEY") or "").strip()
    if not api_key:
        raise ContactMailError("RESEND_API_KEY is not configured")
    from_addr = (os.environ.get("SMTP_FROM") or os.environ.get("CONTACT_FROM") or "AI41 <onboarding@resend.dev>").strip()
    payload: dict[str, Any] = {
        "from": from_addr,
        "to": [contact_to()],
        "subject": subject,
        "text": body,
    }
    if reply_to and "@" in reply_to:
        payload["reply_to"] = reply_to
    res = requests.post(
        "https://api.resend.com/emails",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        data=json.dumps(payload),
        timeout=30,
    )
    if res.status_code >= 400:
        detail = res.text[:300]
        raise ContactMailError(f"Resend failed ({res.status_code}): {detail}")


def _send_via_smtp(subject: str, body: str, reply_to: str | None) -> None:
    host = (os.environ.get("SMTP_HOST") or "").strip()
    user = (os.environ.get("SMTP_USER") or "").strip()
    password = (os.environ.get("SMTP_PASS") or "").strip()
    if not (host and user and password):
        raise ContactMailError("SMTP is not configured")

    port = int(os.environ.get("SMTP_PORT") or "587")
    use_tls = (os.environ.get("SMTP_USE_TLS") or "1").strip() not in ("0", "false", "False")
    from_addr = (os.environ.get("SMTP_FROM") or user).strip()

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = from_addr
    msg["To"] = contact_to()
    if reply_to and "@" in reply_to:
        msg["Reply-To"] = reply_to
    msg.set_content(body)

    if use_tls:
        context = ssl.create_default_context()
        with smtplib.SMTP(host, port, timeout=30) as smtp:
            smtp.starttls(context=context)
            smtp.login(user, password)
            smtp.send_message(msg)
    else:
        with smtplib.SMTP_SSL(host, port, timeout=30) as smtp:
            smtp.login(user, password)
            smtp.send_message(msg)


def send_inquiry_email(payload: dict[str, Any]) -> dict[str, Any]:
    if not contact_mail_ready():
        raise ContactMailError(
            "메일 전송 설정이 없습니다. RESEND_API_KEY 또는 SMTP_HOST/SMTP_USER/SMTP_PASS 를 설정해 주세요."
        )

    kind = str(payload.get("kind") or "").strip() or "문의"
    affiliation = str(payload.get("affiliation") or "").strip()
    subject = f"[AI41 문의] {kind}" + (f" · {affiliation}" if affiliation else "")
    body = _build_body(payload)
    reply_to = str(payload.get("contact") or "").strip()
    if reply_to and "@" not in reply_to:
        reply_to = None

    if (os.environ.get("RESEND_API_KEY") or "").strip():
        _send_via_resend(subject, body, reply_to)
        via = "resend"
    else:
        _send_via_smtp(subject, body, reply_to)
        via = "smtp"

    return {"ok": True, "to": contact_to(), "via": via}

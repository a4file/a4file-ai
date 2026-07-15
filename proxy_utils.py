import json
import os

BLOCKED_PART_TYPES = frozenset({"image_url", "input_audio", "audio", "image"})


def load_local_env():
    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
    if not os.path.isfile(env_path):
        return
    with open(env_path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, val = line.split("=", 1)
            key, val = key.strip(), val.strip().strip('"').strip("'")
            if key and key not in os.environ:
                os.environ[key] = val


def demo_mode_enabled() -> bool:
    return os.environ.get("DEMO_MODE", "1").strip().lower() in ("1", "true", "yes", "on")


def server_api_key() -> str:
    return (
        os.environ.get("OPENAI_API_KEY", "").strip()
        or os.environ.get("KANANA_SERVER_API_KEY", "").strip()
    )


def resolve_auth(inbound_auth: str) -> str:
    key = server_api_key()
    if demo_mode_enabled():
        return f"Bearer {key}" if key else ""
    if inbound_auth:
        return inbound_auth
    return f"Bearer {key}" if key else ""


def _text_from_content(content):
    if isinstance(content, str):
        return content
    if not isinstance(content, list):
        return str(content) if content is not None else ""
    parts = []
    for part in content:
        if isinstance(part, str):
            parts.append(part)
            continue
        if not isinstance(part, dict):
            continue
        part_type = part.get("type") or "text"
        if part_type in BLOCKED_PART_TYPES:
            continue
        if part_type == "text" and isinstance(part.get("text"), str):
            parts.append(part["text"])
    return "\n".join(parts)


def sanitize_chat_body(raw: bytes):
    try:
        data = json.loads(raw)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return None, "Invalid JSON body"
    if not isinstance(data, dict):
        return None, "Invalid request body"

    data.pop("modalities", None)

    # gpt-5.x 계열은 max_tokens 대신 max_completion_tokens 사용
    raw_limit = data.get("max_completion_tokens", data.get("max_tokens"))
    if not isinstance(raw_limit, int) or raw_limit <= 0:
        raw_limit = 256
    elif raw_limit > 600:
        raw_limit = 600
    data.pop("max_tokens", None)
    data["max_completion_tokens"] = raw_limit

    messages = data.get("messages")
    if not isinstance(messages, list):
        return None, "messages must be an array"

    for msg in messages:
        if not isinstance(msg, dict):
            continue
        if "content" in msg:
            msg["content"] = _text_from_content(msg["content"])

    return json.dumps(data, ensure_ascii=False).encode("utf-8"), None

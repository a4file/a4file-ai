const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_TRANSCRIBE_URL = "https://api.openai.com/v1/audio/transcriptions";
const TAROT_RANDOM_URL = "https://tarotapi.dev/api/v1/cards/random";
const BLOCKED_PART_TYPES = new Set(["image_url", "input_audio", "audio", "image"]);

const CORS_HEADERS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-headers": "authorization, content-type",
  "access-control-max-age": "86400",
};

function demoModeEnabled(env) {
  const raw = String(env.DEMO_MODE ?? "1").trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes" || raw === "on";
}

function serverApiKey(env) {
  return String(env.OPENAI_API_KEY || env.KANANA_API_KEY || "").trim();
}

function resolveAuth(request, env) {
  const key = serverApiKey(env);
  if (demoModeEnabled(env)) return key ? `Bearer ${key}` : "";
  const inbound = request.headers.get("authorization");
  if (inbound) return inbound;
  return key ? `Bearer ${key}` : "";
}

function textFromContent(content) {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return content == null ? "" : String(content);
  const parts = [];
  for (const part of content) {
    if (typeof part === "string") {
      parts.push(part);
      continue;
    }
    if (!part || typeof part !== "object") continue;
    const type = part.type || "text";
    if (BLOCKED_PART_TYPES.has(type)) continue;
    if (type === "text" && typeof part.text === "string") parts.push(part.text);
  }
  return parts.join("\n");
}

function sanitizeChatBody(rawText) {
  let data;
  try {
    data = JSON.parse(rawText);
  } catch {
    return { error: "Invalid JSON body" };
  }
  if (!data || typeof data !== "object") return { error: "Invalid request body" };
  delete data.modalities;
  if (!Array.isArray(data.messages)) return { error: "messages must be an array" };
  for (const msg of data.messages) {
    if (!msg || typeof msg !== "object") continue;
    if ("content" in msg) msg.content = textFromContent(msg.content);
  }
  return { body: JSON.stringify(data) };
}

function withCors(response) {
  const headers = new Headers(response.headers);
  Object.entries(CORS_HEADERS).forEach(([key, value]) => headers.set(key, value));
  return new Response(response.body, {
    status: response.status,
    headers,
  });
}

function jsonError(status, message) {
  return withCors(
    new Response(JSON.stringify({ error: message }), {
      status,
      headers: { "content-type": "application/json; charset=utf-8" },
    }),
  );
}

export default {
  async fetch(request, env) {
    const { pathname, search } = new URL(request.url);
    const demo = demoModeEnabled(env);
    const hasKey = !!serverApiKey(env);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (pathname === "/health") {
      return withCors(
        new Response(
          JSON.stringify({
            ok: demo ? hasKey : true,
            demo_mode: demo,
            ready: demo ? hasKey : true,
            chat_upstream: OPENAI_CHAT_URL,
            transcribe_upstream: OPENAI_TRANSCRIBE_URL,
            tarot_upstream: TAROT_RANDOM_URL,
          }),
          { headers: { "content-type": "application/json; charset=utf-8" } },
        ),
      );
    }

    if (pathname === "/v1/chat/completions") {
      if (request.method !== "POST") return jsonError(405, "Method not allowed");

      const authorization = resolveAuth(request, env);
      if (!authorization) return jsonError(503, "Server API key is not configured");

      const rawText = await request.text();
      const sanitized = sanitizeChatBody(rawText);
      if (sanitized.error) return jsonError(400, sanitized.error);

      const upstreamRes = await fetch(OPENAI_CHAT_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization,
        },
        body: sanitized.body,
      });
      return withCors(upstreamRes);
    }

    if (pathname === "/v1/audio/transcriptions") {
      if (request.method !== "POST") return jsonError(405, "Method not allowed");
      if (demo) return jsonError(403, "Audio upload is disabled in demo mode");

      const authorization = resolveAuth(request, env);
      if (!authorization) return jsonError(401, "Authorization header missing");

      const headers = { authorization };
      const contentType = request.headers.get("content-type");
      if (contentType) headers["content-type"] = contentType;

      const upstreamRes = await fetch(OPENAI_TRANSCRIBE_URL, {
        method: "POST",
        headers,
        body: request.body,
      });
      return withCors(upstreamRes);
    }

    if (pathname === "/tarot/random") {
      if (request.method !== "GET") return jsonError(405, "Method not allowed");
      const upstreamRes = await fetch(`${TAROT_RANDOM_URL}${search}`);
      return withCors(upstreamRes);
    }

    return jsonError(404, "Not found");
  },
};

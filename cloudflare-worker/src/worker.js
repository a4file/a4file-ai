const KANANA_CHAT_URL = "https://kanana-o.a2s-endpoint.kr-central-2.kakaocloud.com/v1/chat/completions";
const TAROT_RANDOM_URL = "https://tarotapi.dev/api/v1/cards/random";

const CORS_HEADERS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-headers": "authorization, content-type",
  "access-control-max-age": "86400",
};

function withCors(response) {
  const headers = new Headers(response.headers);
  Object.entries(CORS_HEADERS).forEach(([key, value]) => headers.set(key, value));
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
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

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (pathname === "/health") {
      return withCors(
        new Response(
          JSON.stringify({
            ok: true,
            chat_upstream: KANANA_CHAT_URL,
            tarot_upstream: TAROT_RANDOM_URL,
          }),
          { headers: { "content-type": "application/json; charset=utf-8" } },
        ),
      );
    }

    if (pathname === "/v1/chat/completions") {
      if (request.method !== "POST") return jsonError(405, "Method not allowed");

      const inboundAuth = request.headers.get("authorization");
      const fallbackApiKey = env.KANANA_API_KEY ? `Bearer ${env.KANANA_API_KEY}` : "";
      const authorization = inboundAuth || fallbackApiKey;
      if (!authorization) return jsonError(401, "Authorization header missing");

      const upstreamRes = await fetch(KANANA_CHAT_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization,
        },
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

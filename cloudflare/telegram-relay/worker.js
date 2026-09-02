const encoder = new TextEncoder();

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function hexToBytes(hex) {
  if (!/^[0-9a-f]{64}$/i.test(hex)) return null;
  const bytes = new Uint8Array(32);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

async function verifySignature(secret, timestamp, body, signature) {
  const supplied = signature.startsWith("v1=") ? hexToBytes(signature.slice(3)) : null;
  if (!supplied) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  return crypto.subtle.verify(
    "HMAC",
    key,
    supplied,
    encoder.encode(`${timestamp}.${body}`),
  );
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== "/v1/telegram") {
      return json({ ok: false, code: "not_found" }, 404);
    }
    if (request.method !== "POST") {
      return json({ ok: false, code: "method_not_allowed" }, 405);
    }

    if (
      !env.RELAY_SHARED_SECRET ||
      env.RELAY_SHARED_SECRET.length < 32 ||
      !env.TELEGRAM_BOT_TOKEN ||
      !env.TELEGRAM_CHAT_ID
    ) {
      console.error("CLIP Search Telegram relay configuration is incomplete");
      return json({ ok: false, code: "service_unavailable" }, 503);
    }
    if (env.ORIGIN_IP && request.headers.get("CF-Connecting-IP") !== env.ORIGIN_IP) {
      return json({ ok: false, code: "forbidden" }, 403);
    }

    const declaredLength = Number(request.headers.get("Content-Length") || "0");
    if (declaredLength > 16384) {
      return json({ ok: false, code: "payload_too_large" }, 413);
    }
    const body = await request.text();
    const bodyBytes = encoder.encode(body).byteLength;
    if (bodyBytes < 2 || bodyBytes > 16384) {
      return json({ ok: false, code: "invalid_payload_size" }, 413);
    }

    const timestamp = request.headers.get("X-Clipsearch-Timestamp") || "";
    const signature = request.headers.get("X-Clipsearch-Signature") || "";
    if (!/^\d{10}$/.test(timestamp)) {
      return json({ ok: false, code: "unauthorized" }, 401);
    }
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - Number(timestamp)) > 300) {
      return json({ ok: false, code: "stale_request" }, 401);
    }
    if (!(await verifySignature(env.RELAY_SHARED_SECRET, timestamp, body, signature))) {
      return json({ ok: false, code: "unauthorized" }, 401);
    }

    let payload;
    try {
      payload = JSON.parse(body);
    } catch {
      return json({ ok: false, code: "invalid_json" }, 400);
    }
    if (
      !payload ||
      typeof payload !== "object" ||
      typeof payload.text !== "string" ||
      payload.text.trim() === "" ||
      encoder.encode(payload.text).byteLength > 3900
    ) {
      return json({ ok: false, code: "invalid_payload" }, 422);
    }

    const telegramPayload = {
      chat_id: env.TELEGRAM_CHAT_ID,
      text: payload.text,
      disable_web_page_preview: true,
    };
    const threadId = Number(env.TELEGRAM_MESSAGE_THREAD_ID || "0");
    if (Number.isSafeInteger(threadId) && threadId > 0) {
      telegramPayload.message_thread_id = threadId;
    }

    let telegramResponse;
    try {
      telegramResponse = await fetch(
        `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: "POST",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json; charset=UTF-8",
          },
          body: JSON.stringify(telegramPayload),
        },
      );
    } catch {
      // Never log the fetch error or request URL: either can contain the bot token.
      console.error("CLIP Search Telegram transport failed");
      return json({ ok: false, code: "telegram_unavailable" }, 502);
    }

    let telegramResult = null;
    try {
      telegramResult = await telegramResponse.json();
    } catch {
      // The request URL contains the bot token, so it is deliberately never logged.
    }
    if (!telegramResponse.ok || telegramResult?.ok !== true) {
      console.error("Telegram rejected CLIP Search relay delivery", {
        status: telegramResponse.status,
        description: typeof telegramResult?.description === "string"
          ? telegramResult.description
          : "invalid response",
      });
      return json({ ok: false, code: "telegram_failed" }, 502);
    }

    return json({ ok: true, code: "sent" });
  },
};

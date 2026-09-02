import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import worker from "../cloudflare/telegram-relay/worker.js";

const relaySecret = "test-relay-secret-which-is-longer-than-32-characters";
const environment = {
  RELAY_SHARED_SECRET: relaySecret,
  TELEGRAM_BOT_TOKEN: "test-token",
  TELEGRAM_CHAT_ID: "-1001234567890",
  TELEGRAM_MESSAGE_THREAD_ID: "19",
};
const originalFetch = globalThis.fetch;
let telegramPayload = null;

globalThis.fetch = async (url, options) => {
  assert.match(String(url), /^https:\/\/api\.telegram\.org\/bot[^/]+\/sendMessage$/);
  telegramPayload = JSON.parse(options.body);
  return new Response(JSON.stringify({ ok: true, result: {} }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

try {
  const body = JSON.stringify({ text: "Тестовая заявка CLIP Search" });
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = createHmac("sha256", relaySecret)
    .update(`${timestamp}.${body}`)
    .digest("hex");

  const validRequest = new Request("https://relay.example/v1/telegram", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Clipsearch-Timestamp": timestamp,
      "X-Clipsearch-Signature": `v1=${signature}`,
    },
    body,
  });
  const validResponse = await worker.fetch(validRequest, environment);
  assert.equal(validResponse.status, 200);
  assert.deepEqual(await validResponse.json(), { ok: true, code: "sent" });
  assert.equal(telegramPayload.text, "Тестовая заявка CLIP Search");
  assert.equal(telegramPayload.message_thread_id, 19);

  const invalidRequest = new Request("https://relay.example/v1/telegram", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Clipsearch-Timestamp": timestamp,
      "X-Clipsearch-Signature": `v1=${"0".repeat(64)}`,
    },
    body,
  });
  assert.equal((await worker.fetch(invalidRequest, environment)).status, 401);

  const staleTimestamp = String(Number(timestamp) - 301);
  const staleSignature = createHmac("sha256", relaySecret)
    .update(`${staleTimestamp}.${body}`)
    .digest("hex");
  const staleRequest = new Request("https://relay.example/v1/telegram", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Clipsearch-Timestamp": staleTimestamp,
      "X-Clipsearch-Signature": `v1=${staleSignature}`,
    },
    body,
  });
  assert.equal((await worker.fetch(staleRequest, environment)).status, 401);
} finally {
  globalThis.fetch = originalFetch;
}

console.log("CLIP Search Cloudflare Telegram relay checks passed.");

import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";
import worker from "../worker/index.js";

test("serves existing static assets without a fallback", async () => {
  const calls = [];
  const response = await worker.fetch(new Request("https://example.test/assets/app.js"), {
    ASSETS: {
      fetch: async (request) => {
        calls.push(new URL(request.url).pathname);
        return new Response("asset", { status: 200 });
      },
    },
  });

  assert.equal(response.status, 200);
  assert.deepEqual(calls, ["/assets/app.js"]);
});

test("falls back to index.html for an unknown app route", async () => {
  const calls = [];
  const response = await worker.fetch(
    new Request("https://example.test/flow/step-two?source=share", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async (request) => {
          const url = new URL(request.url);
          calls.push(url.pathname + url.search);
          return new Response(url.pathname === "/index.html" ? "app" : "missing", {
            status: url.pathname === "/index.html" ? 200 : 404,
          });
        },
      },
    },
  );

  assert.equal(response.status, 200);
  assert.deepEqual(calls, ["/flow/step-two?source=share", "/index.html"]);
});

test("does not turn missing API or write requests into the app shell", async () => {
  const missingApi = await worker.fetch(new Request("https://example.test/api/missing", { headers: { accept: "application/json" } }), {
    ASSETS: {
      fetch: async () => {
        throw new Error("API requests should not hit static assets");
      },
    },
  });

  assert.equal(missingApi.status, 404);
  assert.deepEqual(await missingApi.json(), { error: "not_found" });

  let calls = 0;
  const writeResponse = await worker.fetch(new Request("https://example.test/flow", { method: "POST", headers: { accept: "text/html" } }), {
    ASSETS: {
      fetch: async () => {
        calls += 1;
        return new Response("missing", { status: 404 });
      },
    },
  });

  assert.equal(writeResponse.status, 404);
  assert.equal(calls, 1);
});

test("returns pricing and generation estimate API contracts", async () => {
  const pricing = await worker.fetch(new Request("https://example.test/api/pricing"), {
    ASSETS: {
      fetch: async () => new Response("missing", { status: 404 }),
    },
  });
  const pricingBody = await pricing.json();

  assert.equal(pricing.status, 200);
  assert.equal(pricingBody.policy.coinsPerDollar, 20);
  assert.equal(pricingBody.policy.tokensPerCoin, 500);
  assert.equal(pricingBody.policy.imageModel, "GPT-image");
  assert.equal(pricingBody.policy.videoModel, "Sora");
  assert.equal(pricingBody.packages[1].coins, 110);

  const estimate = await worker.fetch(new Request("https://example.test/api/generation/estimate", {
    method: "POST",
    body: JSON.stringify({ tool: "Video Sprint" }),
  }), {
    ASSETS: {
      fetch: async () => new Response("missing", { status: 404 }),
    },
  });
  const estimateBody = await estimate.json();

  assert.equal(estimate.status, 200);
  assert.equal(estimateBody.charge.model, "Sora");
  assert.equal(estimateBody.charge.coins, 24);
  assert.equal(estimateBody.grossRevenueUsd, 1.2);
});

test("returns wallet, recharge, spend, and insufficient-balance contracts", async () => {
  const env = {
    ASSETS: {
      fetch: async () => {
        throw new Error("Wallet API requests should not hit static assets");
      },
    },
  };

  const wallet = await worker.fetch(new Request("https://example.test/api/wallet"), env);
  const walletBody = await wallet.json();

  assert.equal(wallet.status, 200);
  assert.equal(walletBody.source, "demo-memory");
  assert.equal(walletBody.wallet.coins, 80);
  assert.equal(walletBody.summary.estimatedRemainingTokens, 40000);

  const recharge = await worker.fetch(new Request("https://example.test/api/wallet/recharge", {
    method: "POST",
    body: JSON.stringify({ packageLabel: "Creator", idempotencyKey: "test-recharge" }),
  }), env);
  const rechargeBody = await recharge.json();

  assert.equal(recharge.status, 200);
  assert.equal(rechargeBody.entry.id, "credit-test-recharge");
  assert.equal(rechargeBody.wallet.coins, 190);

  const spend = await worker.fetch(new Request("https://example.test/api/wallet/spend", {
    method: "POST",
    body: JSON.stringify({ tool: "Product Kit", idempotencyKey: "test-spend" }),
  }), env);
  const spendBody = await spend.json();

  assert.equal(spend.status, 200);
  assert.equal(spendBody.entry.id, "spend-test-spend");
  assert.equal(spendBody.charge.model, "GPT-image");
  assert.equal(spendBody.wallet.coins, 68);

  const insufficient = await worker.fetch(new Request("https://example.test/api/wallet/spend", {
    method: "POST",
    body: JSON.stringify({ charge: { coins: 999, label: "Huge render", model: "Sora", tokens: 499500 } }),
  }), env);
  const insufficientBody = await insufficient.json();

  assert.equal(insufficient.status, 402);
  assert.equal(insufficientBody.reason, "insufficient_balance");
});

test("runs generation API in demo mode and blocks unavailable live Sora", async () => {
  const env = {
    ASSETS: {
      fetch: async () => {
        throw new Error("Generation API requests should not hit static assets");
      },
    },
  };

  const demo = await worker.fetch(new Request("https://example.test/api/generation/run", {
    method: "POST",
    body: JSON.stringify({
      kind: "image",
      prompt: "Create a premium skincare marketplace hero image.",
      demo: true,
    }),
  }), env);
  const demoBody = await demo.json();

  assert.equal(demo.status, 200);
  assert.equal(demoBody.ok, true);
  assert.equal(demoBody.mode, "demo");
  assert.equal(demoBody.settlement, "not_charged");
  assert.equal(demoBody.charge.model, "GPT-image");
  assert.equal(demoBody.artifacts[0].model, "GPT-image");

  const liveVideo = await worker.fetch(new Request("https://example.test/api/generation/run", {
    method: "POST",
    body: JSON.stringify({
      kind: "video",
      prompt: "Create a six second launch video.",
      mode: "live",
    }),
  }), {
    ...env,
    ENABLE_LIVE_OPENAI_GENERATION: "true",
    OPENAI_API_KEY: "test-key",
  });
  const liveVideoBody = await liveVideo.json();

  assert.equal(liveVideo.status, 410);
  assert.equal(liveVideoBody.error, "sora_api_unavailable");
  assert.equal(liveVideoBody.settlement, "not_charged");

  const liveImageMissingConfig = await worker.fetch(new Request("https://example.test/api/generation/run", {
    method: "POST",
    body: JSON.stringify({
      kind: "image",
      prompt: "Create a premium skincare marketplace hero image.",
      mode: "live",
    }),
  }), env);
  const missingConfigBody = await liveImageMissingConfig.json();

  assert.equal(liveImageMissingConfig.status, 503);
  assert.equal(missingConfigBody.error, "openai_provider_not_configured");
  assert.equal(missingConfigBody.settlement, "not_charged");
});

test("reads OpenAI Sites authenticated user headers", async () => {
  const response = await worker.fetch(new Request("https://example.test/api/account/me", {
    headers: {
      "oai-authenticated-user-id": "user_123",
      "oai-authenticated-user-email": "merchant@example.com",
      "oai-authenticated-user-full-name": "Mia%20Carter",
      "oai-authenticated-user-full-name-encoding": "percent-encoded-utf-8",
    },
  }), {
    ASSETS: {
      fetch: async () => new Response("missing", { status: 404 }),
    },
  });
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.user.signedIn, true);
  assert.equal(body.user.email, "merchant@example.com");
  assert.equal(body.user.name, "Mia Carter");
});

test("emits the files required by Sites packaging", async () => {
  await access(new URL("../dist/client/index.html", import.meta.url));
  await access(new URL("../dist/server/index.js", import.meta.url));
  await access(new URL("../dist/server/ledger.js", import.meta.url));
  await access(new URL("../dist/server/generation.js", import.meta.url));
  await access(new URL("../dist/src/lib/commerce.js", import.meta.url));
  await access(new URL("../dist/db/schema.ts", import.meta.url));
  await access(new URL("../dist/.openai/hosting.json", import.meta.url));

  const hosting = JSON.parse(await readFile(new URL("../dist/.openai/hosting.json", import.meta.url), "utf8"));
  assert.equal(hosting.d1, "DB");
});

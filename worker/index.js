import {
  coinPackages,
  commercePolicy,
  createGenerationCharge,
  createVideoCharge,
  getToolCharge,
  packageCoins,
  tokensForCoins,
} from "../src/lib/commerce.js";
import { runGeneration } from "./generation.js";
import { getServerWallet, rechargeServerWallet, spendServerWallet } from "./ledger.js";

function json(data, init = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...(init.headers || {}),
    },
  });
}

function readUserFromHeaders(headers) {
  const id = headers.get("oai-authenticated-user-id");
  const email = headers.get("oai-authenticated-user-email");
  const encodedName = headers.get("oai-authenticated-user-full-name");
  const encoding = headers.get("oai-authenticated-user-full-name-encoding");
  let name = email || "Demo merchant";

  if (encodedName && encoding === "percent-encoded-utf-8") {
    try {
      name = decodeURIComponent(encodedName);
    } catch {
      name = email || "Demo merchant";
    }
  }

  return {
    signedIn: Boolean(id || email),
    id: id || null,
    email: email || null,
    name,
  };
}

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

async function handleApi(request, env) {
  const url = new URL(request.url);
  const user = readUserFromHeaders(request.headers);

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "access-control-allow-methods": "GET,POST,OPTIONS",
        "access-control-allow-headers": "content-type",
        "access-control-max-age": "86400",
      },
    });
  }

  if (url.pathname === "/api/health" && request.method === "GET") {
    return json({
      ok: true,
      service: "MarketForge OS API",
      policyVersion: commercePolicy.version,
      capabilities: ["pricing", "account", "wallet", "generation-estimate", "generation-run"],
    });
  }

  if (url.pathname === "/api/pricing" && request.method === "GET") {
    return json({
      policy: commercePolicy,
      packages: coinPackages.map((pack) => ({
        ...pack,
        coins: packageCoins(pack),
        billableTokens: tokensForCoins(packageCoins(pack)),
      })),
    });
  }

  if (url.pathname === "/api/account/me" && request.method === "GET") {
    return json({
      user,
      authProvider: "OpenAI Sites user headers",
    });
  }

  if (url.pathname === "/api/wallet" && request.method === "GET") {
    return json(await getServerWallet(env, user));
  }

  if (url.pathname === "/api/wallet/recharge" && request.method === "POST") {
    const result = await rechargeServerWallet(env, user, await readJson(request));
    return json(result, { status: result.status || 200 });
  }

  if (url.pathname === "/api/wallet/spend" && request.method === "POST") {
    const result = await spendServerWallet(env, user, await readJson(request));
    return json(result, { status: result.status || 200 });
  }

  if (url.pathname === "/api/generation/estimate" && request.method === "POST") {
    const body = await readJson(request);
    const charge = body.tool
      ? getToolCharge(body.tool)
      : body.kind === "video"
        ? createVideoCharge(body.seconds)
        : createGenerationCharge();

    return json({
      charge,
      grossRevenueUsd: charge.coins / commercePolicy.coinsPerDollar,
      policyVersion: commercePolicy.version,
    });
  }

  if (url.pathname === "/api/generation/run" && request.method === "POST") {
    const result = await runGeneration(env, user, await readJson(request));
    return json(result, { status: result.status || 200 });
  }

  if (url.pathname.startsWith("/api/")) {
    return json({ error: "not_found" }, { status: 404 });
  }

  return null;
}

export default {
  async fetch(request, env) {
    const apiResponse = await handleApi(request, env);
    if (apiResponse) return apiResponse;

    const response = await env.ASSETS.fetch(request);
    const acceptsHtml = request.headers.get("accept")?.includes("text/html");

    if (response.status !== 404 || !acceptsHtml || !["GET", "HEAD"].includes(request.method)) {
      return response;
    }

    const indexUrl = new URL(request.url);
    indexUrl.pathname = "/index.html";
    indexUrl.search = "";
    return env.ASSETS.fetch(new Request(indexUrl, request));
  },
};

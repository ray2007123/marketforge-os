import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  coinPackages,
  commercePolicy,
  createGenerationCharge,
  createVideoCharge,
  getToolCharge,
  packageCoins,
  tokensForCoins,
} from "../../src/lib/commerce.js";
import { loginUser, logoutUser, registerUser, userFromRequest } from "./auth.mjs";
import { databaseConfigured, getPool, migrate } from "./db.mjs";
import { loadDotEnv } from "./env.mjs";
import { runHostingerGeneration } from "./generation.mjs";
import { readWallet, rechargeWallet, spendWallet } from "./ledger.mjs";

loadDotEnv();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../..");
const staticRoot = path.join(root, "dist", "client");

const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".ico", "image/x-icon"],
]);

function json(response, status, data, headers = {}) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    ...headers,
  });
  response.end(JSON.stringify(data, null, 2));
}

async function readBody(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 1024 * 1024) throw new Error("request_too_large");
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function resolveStaticPath(urlPath) {
  const cleanPath = decodeURIComponent(urlPath.split("?")[0]);
  const requested = path.normalize(cleanPath === "/" ? "/index.html" : cleanPath);
  const fullPath = path.join(staticRoot, requested);
  if (!fullPath.startsWith(staticRoot)) return null;
  return fullPath;
}

function serveStatic(request, response) {
  const url = new URL(request.url, "http://localhost");
  let filePath = resolveStaticPath(url.pathname);
  if (!filePath || !existsSync(filePath) || statSync(filePath).isDirectory()) {
    filePath = path.join(staticRoot, "index.html");
  }
  if (!existsSync(filePath)) {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Build output not found. Run npm run build first.");
    return;
  }

  const contentType = mimeTypes.get(path.extname(filePath)) || "application/octet-stream";
  response.writeHead(200, {
    "content-type": contentType,
    "cache-control": filePath.endsWith("index.html") ? "no-cache" : "public, max-age=31536000, immutable",
  });
  createReadStream(filePath).pipe(response);
}

function poolOr503(response) {
  const pool = getPool();
  if (!pool) {
    json(response, 503, {
      ok: false,
      error: "database_not_configured",
      requiredEnv: ["DB_HOST", "DB_PORT", "DB_NAME", "DB_USER", "DB_PASSWORD"],
    });
    return null;
  }
  return pool;
}

async function requireUser(pool, request, response) {
  const user = await userFromRequest(pool, request);
  if (!user.signedIn) {
    json(response, 401, { ok: false, error: "sign_in_required" });
    return null;
  }
  return user;
}

function generationEstimate(body = {}) {
  const charge = body.tool
    ? getToolCharge(body.tool)
    : body.kind === "video"
      ? createVideoCharge(body.seconds)
      : createGenerationCharge();
  return {
    charge,
    grossRevenueUsd: charge.coins / commercePolicy.coinsPerDollar,
    policyVersion: commercePolicy.version,
  };
}

async function handleApi(request, response) {
  const url = new URL(request.url, "http://localhost");
  const pathName = url.pathname;

  if (request.method === "OPTIONS") {
    response.writeHead(204, {
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-headers": "content-type",
      "access-control-max-age": "86400",
    });
    response.end();
    return true;
  }

  if (!pathName.startsWith("/api/")) return false;

  if (pathName === "/api/health" && request.method === "GET") {
    json(response, 200, {
      ok: true,
      service: "MarketForge OS Hostinger API",
      databaseConfigured: databaseConfigured(),
      policyVersion: commercePolicy.version,
      liveImageGenerationEnabled: process.env.ENABLE_LIVE_OPENAI_GENERATION === "true" && Boolean(process.env.OPENAI_API_KEY),
    });
    return true;
  }

  if (pathName === "/api/pricing" && request.method === "GET") {
    json(response, 200, {
      policy: commercePolicy,
      packages: coinPackages.map((pack) => ({
        ...pack,
        coins: packageCoins(pack),
        billableTokens: tokensForCoins(packageCoins(pack)),
      })),
    });
    return true;
  }

  if (pathName === "/api/generation/estimate" && request.method === "POST") {
    json(response, 200, generationEstimate(await readBody(request)));
    return true;
  }

  const pool = poolOr503(response);
  if (!pool) return true;

  if (pathName === "/api/auth/register" && request.method === "POST") {
    const result = await registerUser(pool, await readBody(request), process.env);
    json(response, result.status || 200, { ok: result.ok, user: result.user, error: result.error }, result.cookie ? { "set-cookie": result.cookie } : {});
    return true;
  }

  if (pathName === "/api/auth/login" && request.method === "POST") {
    const result = await loginUser(pool, await readBody(request), process.env);
    json(response, result.status || 200, { ok: result.ok, user: result.user, error: result.error }, result.cookie ? { "set-cookie": result.cookie } : {});
    return true;
  }

  if (pathName === "/api/auth/logout" && request.method === "POST") {
    const result = await logoutUser(pool, request);
    json(response, 200, { ok: true }, { "set-cookie": result.cookie });
    return true;
  }

  if (pathName === "/api/account/me" && request.method === "GET") {
    json(response, 200, { user: await userFromRequest(pool, request), authProvider: "MarketForge email session" });
    return true;
  }

  if (pathName === "/api/wallet" && request.method === "GET") {
    const user = await requireUser(pool, request, response);
    if (!user) return true;
    json(response, 200, await readWallet(pool, user));
    return true;
  }

  if (pathName === "/api/wallet/recharge" && request.method === "POST") {
    const user = await requireUser(pool, request, response);
    if (!user) return true;
    const result = await rechargeWallet(pool, user, await readBody(request));
    json(response, result.status || 200, result);
    return true;
  }

  if (pathName === "/api/wallet/spend" && request.method === "POST") {
    const user = await requireUser(pool, request, response);
    if (!user) return true;
    const result = await spendWallet(pool, user, await readBody(request));
    json(response, result.status || 200, result);
    return true;
  }

  if (pathName === "/api/generation/run" && request.method === "POST") {
    const user = await requireUser(pool, request, response);
    if (!user) return true;
    const result = await runHostingerGeneration(pool, user, await readBody(request), process.env);
    json(response, result.status || 200, result);
    return true;
  }

  if (pathName === "/api/payments/webhook" && request.method === "POST") {
    const body = await readBody(request);
    if (!process.env.PAYMENT_WEBHOOK_SECRET || body.secret !== process.env.PAYMENT_WEBHOOK_SECRET) {
      json(response, 401, { ok: false, error: "invalid_webhook_secret" });
      return true;
    }
    if (!body.userId) {
      json(response, 400, { ok: false, error: "user_id_required" });
      return true;
    }
    const user = { id: body.userId, signedIn: true, email: body.email || "", name: body.name || "" };
    const result = await rechargeWallet(pool, user, body);
    json(response, result.status || 200, result);
    return true;
  }

  if (pathName.startsWith("/api/")) {
    json(response, 404, { ok: false, error: "not_found" });
    return true;
  }

  return false;
}

export function createHostingerServer() {
  return createServer(async (request, response) => {
    try {
      if (await handleApi(request, response)) return;
      if (request.method !== "GET" && request.method !== "HEAD") {
        json(response, 405, { ok: false, error: "method_not_allowed" });
        return;
      }
      serveStatic(request, response);
    } catch (error) {
      json(response, error.message === "request_too_large" ? 413 : 500, {
        ok: false,
        error: error.message || "server_error",
      });
    }
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.env.AUTO_MIGRATE === "true") {
    await migrate(getPool());
  }
  const port = Number(process.env.PORT || 3000);
  createHostingerServer().listen(port, () => {
    console.log(`MarketForge OS running on port ${port}`);
  });
}

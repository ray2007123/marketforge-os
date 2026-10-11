import {
  commercePolicy,
  createGenerationCharge,
  createVideoCharge,
  getToolCharge,
  imageModel,
  videoModel,
} from "../../src/lib/commerce.js";
import { readWallet, spendWallet } from "./ledger.mjs";

export const soraProviderNotice = {
  code: "sora_api_unavailable",
  status: "unavailable",
  detail: "OpenAI's Videos API / Sora 2 API is marked deprecated and shut down as of 2026-09-24.",
};

function jobId() {
  return `job_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function nowSql() {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}

function normalizePrompt(prompt) {
  return String(prompt || "").trim().slice(0, 4000);
}

function chargeFromBody(body = {}) {
  if (body.charge) return body.charge;
  if (body.tool) return getToolCharge(body.tool);
  if (body.kind === "video") return createVideoCharge(body.seconds);
  if (body.kind === "image") return getToolCharge("Product Kit");
  return createGenerationCharge();
}

function modalityFromBody(body = {}, charge) {
  if (body.kind === "video" || charge.model === videoModel) return "video";
  if (body.kind === "image" || charge.model === imageModel) return "image";
  if (String(charge.model).includes(videoModel) && String(charge.model).includes(imageModel)) return "mixed";
  return String(charge.model).includes(videoModel) ? "video" : "image";
}

function planFromBody(body = {}, env = process.env) {
  const charge = chargeFromBody(body);
  const modality = modalityFromBody(body, charge);
  return {
    id: body.jobId || jobId(),
    kind: body.kind || (body.tool ? "tool" : "launch"),
    tool: body.tool || null,
    market: body.market || "US",
    prompt: normalizePrompt(body.prompt),
    modality,
    charge,
    liveRequested: body.mode === "live" || body.live === true || env.GENERATION_DEFAULT_MODE === "live",
    policyVersion: commercePolicy.version,
  };
}

function demoArtifacts(plan) {
  if (plan.modality === "video") {
    return [{ type: "video-brief", model: videoModel, title: `${plan.market} Sora storyboard`, notice: soraProviderNotice.detail }];
  }
  if (plan.modality === "mixed") {
    return [
      { type: "image", model: imageModel, title: `${plan.market} GPT-image hero` },
      { type: "video-brief", model: videoModel, title: `${plan.market} Sora sequence`, notice: soraProviderNotice.detail },
    ];
  }
  return [
    { type: "image", model: imageModel, title: `${plan.market} GPT-image hero` },
    { type: "image", model: imageModel, title: `${plan.market} marketplace tile` },
  ];
}

function providerEnabled(env = process.env) {
  return env.ENABLE_LIVE_OPENAI_GENERATION === "true" && Boolean(env.OPENAI_API_KEY);
}

async function parseJson(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

async function callOpenAIImage(prompt, env = process.env) {
  const model = env.OPENAI_IMAGE_MODEL || "gpt-image-2.5-sunburst";
  const size = env.OPENAI_IMAGE_SIZE || "1024x1024";
  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.OPENAI_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ model, prompt, size }),
  });
  const data = await parseJson(response);
  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error: data?.error?.message || "OpenAI image generation failed.",
    };
  }
  return {
    ok: true,
    provider: "openai",
    model,
    images: (data.data || []).map((item, index) => ({
      index,
      url: item.url || null,
      b64_json: item.b64_json || null,
    })),
    rawId: data.id || null,
  };
}

async function saveJob(pool, user, plan, status, result = {}, errorCode = null) {
  const created = nowSql();
  await pool.execute(
    `INSERT INTO generation_jobs
      (id, user_id, kind, modality, market, model, status, prompt, charge_coins, provider_job_id, result_json, error_code, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE status = VALUES(status), result_json = VALUES(result_json), error_code = VALUES(error_code), updated_at = VALUES(updated_at)`,
    [
      plan.id,
      user.id,
      plan.kind,
      plan.modality,
      plan.market,
      plan.charge.model,
      status,
      plan.prompt,
      plan.charge.coins,
      result.rawId || null,
      JSON.stringify(result || {}),
      errorCode,
      created,
      created,
    ],
  );
}

export async function runHostingerGeneration(pool, user, body = {}, env = process.env) {
  const plan = planFromBody(body, env);
  if (!plan.prompt) return { ok: false, status: 400, error: "prompt_required" };

  const wallet = await readWallet(pool, user);
  if (wallet.wallet.coins < plan.charge.coins) {
    return { ok: false, status: 402, reason: "insufficient_balance", charge: plan.charge, ...wallet };
  }

  if (plan.liveRequested && (plan.modality === "video" || plan.modality === "mixed")) {
    await saveJob(pool, user, plan, "provider_unavailable", { providerStatus: soraProviderNotice }, soraProviderNotice.code);
    return {
      ok: false,
      status: 410,
      error: soraProviderNotice.code,
      providerStatus: soraProviderNotice,
      settlement: "not_charged",
      charge: plan.charge,
    };
  }

  if (!plan.liveRequested || body.demo === true) {
    const result = { artifacts: demoArtifacts(plan), mode: "demo" };
    await saveJob(pool, user, plan, "preview", result);
    return {
      ok: true,
      mode: "demo",
      settlement: "not_charged",
      job: { id: plan.id, status: "preview", kind: plan.kind, market: plan.market, modality: plan.modality },
      charge: plan.charge,
      artifacts: result.artifacts,
      ...wallet,
    };
  }

  if (!providerEnabled(env)) {
    await saveJob(pool, user, plan, "provider_not_configured", {}, "openai_provider_not_configured");
    return { ok: false, status: 503, error: "openai_provider_not_configured", settlement: "not_charged", charge: plan.charge };
  }

  const provider = await callOpenAIImage(plan.prompt, env);
  if (!provider.ok) {
    await saveJob(pool, user, plan, "provider_failed", { providerError: provider.error }, "openai_image_generation_failed");
    return {
      ok: false,
      status: provider.status,
      error: "openai_image_generation_failed",
      providerError: provider.error,
      settlement: "not_charged",
      charge: plan.charge,
    };
  }

  const spend = await spendWallet(pool, user, { charge: plan.charge, idempotencyKey: body.idempotencyKey || plan.id, kind: plan.kind, tool: plan.tool });
  if (!spend.ok) return spend;

  await saveJob(pool, user, plan, "ready", { provider, settlement: "charged" });
  return {
    ok: true,
    mode: "live",
    settlement: "charged",
    job: { id: plan.id, status: "ready", kind: plan.kind, market: plan.market, modality: plan.modality },
    charge: plan.charge,
    providerResult: provider,
    wallet: spend.wallet,
    summary: spend.summary,
  };
}

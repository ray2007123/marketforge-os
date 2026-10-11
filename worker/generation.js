import {
  commercePolicy,
  createGenerationCharge,
  createVideoCharge,
  getToolCharge,
  imageModel,
  videoModel,
} from "../src/lib/commerce.js";
import { getServerWallet, spendServerWallet } from "./ledger.js";

export const soraProviderNotice = {
  code: "sora_api_unavailable",
  status: "unavailable",
  detail: "OpenAI's Videos API / Sora 2 API is marked deprecated and shut down as of 2026-09-24.",
};

function id(prefix = "gen") {
  const randomId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${randomId}`;
}

function normalizePrompt(prompt) {
  return String(prompt || "").trim().slice(0, 4000);
}

function determineCharge(body = {}) {
  if (body.charge) return body.charge;
  if (body.tool) return getToolCharge(body.tool);
  if (body.kind === "video") return createVideoCharge(body.seconds);
  if (body.kind === "image") return getToolCharge("Product Kit");
  return createGenerationCharge();
}

function determineModality(body = {}, charge) {
  if (body.kind === "video" || charge.model === videoModel) return "video";
  if (body.kind === "image" || charge.model === imageModel) return "image";
  if (String(charge.model).includes(videoModel) && String(charge.model).includes(imageModel)) return "mixed";
  if (String(charge.model).includes(videoModel)) return "video";
  return "image";
}

export function createGenerationPlan(body = {}) {
  const charge = determineCharge(body);
  const prompt = normalizePrompt(body.prompt);
  const modality = determineModality(body, charge);
  const liveRequested = body.mode === "live" || body.live === true;

  return {
    id: body.jobId || id("job"),
    kind: body.kind || (body.tool ? "tool" : "launch"),
    tool: body.tool || null,
    market: body.market || "US",
    prompt,
    modality,
    charge,
    liveRequested,
    policyVersion: commercePolicy.version,
  };
}

function demoArtifacts(plan) {
  const base = `${plan.market} ${plan.tool || plan.kind}`;
  if (plan.modality === "video") {
    return [
      {
        type: "video-brief",
        model: videoModel,
        title: `${base} Sora storyboard`,
        status: "demo-preview",
        notice: soraProviderNotice.detail,
      },
    ];
  }
  if (plan.modality === "mixed") {
    return [
      { type: "image", model: imageModel, title: `${base} GPT-image hero`, status: "demo-preview" },
      {
        type: "video-brief",
        model: videoModel,
        title: `${base} Sora sequence`,
        status: "demo-preview",
        notice: soraProviderNotice.detail,
      },
    ];
  }
  return [
    { type: "image", model: imageModel, title: `${base} GPT-image hero`, status: "demo-preview" },
    { type: "image", model: imageModel, title: `${base} marketplace tile`, status: "demo-preview" },
  ];
}

function providerEnabled(env) {
  return env?.ENABLE_LIVE_OPENAI_GENERATION === "true" && Boolean(env?.OPENAI_API_KEY);
}

async function parseOpenAIResponse(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

async function callOpenAIImage(env, prompt) {
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
  const data = await parseOpenAIResponse(response);

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error: {
        code: "openai_image_generation_failed",
        message: data?.error?.message || "OpenAI image generation failed.",
      },
    };
  }

  return {
    ok: true,
    provider: "openai",
    endpoint: "/v1/images/generations",
    model,
    data: {
      id: data.id || null,
      images: (data.data || []).map((item, index) => ({
        index,
        url: item.url || null,
        b64_json: item.b64_json ? "[base64 omitted]" : null,
      })),
    },
  };
}

function canAfford(wallet, coins) {
  return wallet?.coins >= coins;
}

export async function runGeneration(env, user, body = {}) {
  const plan = createGenerationPlan(body);
  if (!plan.prompt) {
    return { ok: false, status: 400, error: "prompt_required" };
  }

  const walletResult = await getServerWallet(env, user);
  if (!canAfford(walletResult.wallet, plan.charge.coins)) {
    return {
      ok: false,
      status: 402,
      reason: "insufficient_balance",
      charge: plan.charge,
      wallet: walletResult.wallet,
      summary: walletResult.summary,
    };
  }

  if (plan.liveRequested && (plan.modality === "video" || plan.modality === "mixed")) {
    return {
      ok: false,
      status: 410,
      error: soraProviderNotice.code,
      providerStatus: soraProviderNotice,
      charge: plan.charge,
      settlement: "not_charged",
    };
  }

  if (!plan.liveRequested || body.demo === true) {
    return {
      ok: true,
      mode: "demo",
      settlement: "not_charged",
      providerStatus: plan.modality === "image" ? { status: "demo-preview" } : soraProviderNotice,
      job: {
        id: plan.id,
        status: "preview",
        kind: plan.kind,
        market: plan.market,
        modality: plan.modality,
      },
      charge: plan.charge,
      artifacts: demoArtifacts(plan),
      wallet: walletResult.wallet,
      summary: walletResult.summary,
    };
  }

  if (!providerEnabled(env)) {
    return {
      ok: false,
      status: 503,
      error: "openai_provider_not_configured",
      charge: plan.charge,
      settlement: "not_charged",
    };
  }

  const providerResult = await callOpenAIImage(env, plan.prompt);
  if (!providerResult.ok) {
    return {
      ok: false,
      status: providerResult.status,
      error: providerResult.error.code,
      providerError: providerResult.error.message,
      settlement: "not_charged",
      charge: plan.charge,
    };
  }

  const spend = await spendServerWallet(env, user, {
    charge: plan.charge,
    kind: plan.kind,
    tool: plan.tool,
    idempotencyKey: body.idempotencyKey || plan.id,
  });
  if (!spend.ok) return spend;

  return {
    ok: true,
    mode: "live",
    settlement: "charged",
    providerStatus: { status: "complete", provider: "openai" },
    job: {
      id: plan.id,
      status: "ready",
      kind: plan.kind,
      market: plan.market,
      modality: plan.modality,
    },
    charge: plan.charge,
    providerResult,
    wallet: spend.wallet,
    summary: spend.summary,
  };
}

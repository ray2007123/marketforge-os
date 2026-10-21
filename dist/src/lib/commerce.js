export const imageModel = "GPT-image";
export const videoModel = "Sora";
export const coinsPerDollar = 20;
export const tokensPerCoin = 500;
export const soraCoinsPerSecond = 4;
export const defaultSoraSeconds = 6;

export const coinPackages = [
  { dollars: 1, label: "Starter", bonus: 0 },
  { dollars: 5, label: "Creator", bonus: 10 },
  { dollars: 10, label: "Studio", bonus: 30 },
  { dollars: 25, label: "Scale", bonus: 100 },
];

export const defaultAccount = {
  signedIn: true,
  name: "Mia Carter",
  email: "mia@northstarmerchant.com",
  role: "Creative lead",
  region: "United States",
  workspace: "Northstar Merchant",
  plan: "MarketForge Pro",
  apiKeyStatus: "Connected",
};

export const defaultWallet = {
  coins: 80,
  spentCoins: 0,
  lifetimePurchased: 80,
  tokensUsed: 0,
  ledger: [
    {
      id: "ledger-welcome",
      type: "credit",
      label: "Welcome trial balance",
      coins: 80,
      tokens: 40000,
      model: "Trial",
      created: "Today",
    },
  ],
};

export const toolCharges = {
  "Product Kit": { coins: 12, model: imageModel, label: "Product Kit generation" },
  "A+ Page Builder": { coins: 8, model: imageModel, label: "A+ page generation" },
  "Social Ad Lab": { coins: 18, model: `${imageModel} + ${videoModel}`, label: "Social ad lab run" },
  "Video Sprint": {
    coins: soraCoinsPerSecond * defaultSoraSeconds,
    model: videoModel,
    label: `${defaultSoraSeconds}s Sora video sprint`,
    videoSeconds: defaultSoraSeconds,
  },
  "Smart Cutout": { coins: 5, model: imageModel, label: "Smart cutout" },
  "AI Eraser": { coins: 6, model: imageModel, label: "AI eraser" },
  "Brand Translator": { coins: 4, model: imageModel, label: "Brand translation" },
  "Batch Export": { coins: 2, model: `${imageModel} / ${videoModel}`, label: "Batch export prep" },
};

export const commercePolicy = {
  version: "2026-10-02",
  currency: "USD",
  coinsPerDollar,
  tokensPerCoin,
  imageModel,
  videoModel,
  soraCoinsPerSecond,
  defaultSoraSeconds,
  defaultImageOutputTokenCostPerMillion: 30,
  defaultSora720pCostPerSecond: 0.1,
};

export const productionReadinessItems = [
  {
    title: "Server ledger",
    status: "D1-ready API",
    detail: "Wallet read, recharge, and spend routes can use a server-side ledger when a DB binding is available.",
  },
  {
    title: "Payment webhooks",
    status: "Next backend step",
    detail: "Checkout receipts should be created from provider webhooks before adding real coins.",
  },
  {
    title: "Model routing",
    status: "Image ready, video blocked",
    detail: `Image jobs are tagged for ${imageModel}; video jobs are tagged for ${videoModel}.`,
  },
  {
    title: "Sora API availability",
    status: "Provider unavailable",
    detail: "OpenAI marks the Videos API / Sora 2 API as shut down on 2026-09-24, so live video routes refuse charges.",
  },
  {
    title: "Usage reconciliation",
    status: "Next backend step",
    detail: "Server calls should reconcile estimated coins with actual OpenAI usage before final settlement.",
  },
];

export const serverApiEndpoints = [
  { method: "GET", path: "/api/pricing", purpose: "Coin packages and model pricing policy" },
  { method: "GET", path: "/api/wallet", purpose: "Server wallet summary and latest ledger" },
  { method: "POST", path: "/api/wallet/recharge", purpose: "Webhook-confirmed coin recharge" },
  { method: "POST", path: "/api/wallet/spend", purpose: "Server-side coin debit for generation or export" },
  { method: "POST", path: "/api/generation/estimate", purpose: "Preflight estimate before running GPT-image or Sora" },
  { method: "POST", path: "/api/generation/run", purpose: "Server-side generation gate with wallet and provider checks" },
];

export function tokensForCoins(coins) {
  return coins * tokensPerCoin;
}

export function formatCoins(coins) {
  return `${coins.toLocaleString()} coins`;
}

export function packageCoins(pack) {
  return pack.dollars * coinsPerDollar + pack.bonus;
}

export function normalizeCharge(charge) {
  return {
    coins: charge.coins,
    label: charge.label,
    model: charge.model,
    tokens: charge.tokens ?? tokensForCoins(charge.coins),
    videoSeconds: charge.videoSeconds ?? null,
  };
}

export function getToolCharge(toolTitle) {
  return normalizeCharge(toolCharges[toolTitle] || { coins: 6, model: imageModel, label: `${toolTitle} run` });
}

export function createGenerationCharge() {
  return normalizeCharge({
    coins: 18,
    label: "Launch kit generation",
    model: `${imageModel} + ${videoModel}`,
  });
}

export function createExportCharge() {
  return normalizeCharge({ coins: 1, label: "Draft pack export", model: "Export" });
}

export function createVideoCharge(seconds = defaultSoraSeconds) {
  const safeSeconds = Math.max(1, Number(seconds) || defaultSoraSeconds);
  return normalizeCharge({
    coins: safeSeconds * soraCoinsPerSecond,
    label: `${safeSeconds}s Sora video generation`,
    model: videoModel,
    videoSeconds: safeSeconds,
  });
}

export function applySpend(wallet, rawCharge, created = "Just now", entryId = `spend-${Date.now()}`) {
  const charge = normalizeCharge(rawCharge);
  if (wallet.coins < charge.coins) {
    return {
      ok: false,
      reason: "insufficient_balance",
      charge,
      wallet,
    };
  }

  const entry = {
    id: entryId,
    type: "debit",
    label: charge.label,
    coins: charge.coins,
    tokens: charge.tokens,
    model: charge.model,
    created,
  };

  return {
    ok: true,
    entry,
    charge,
    wallet: {
      ...wallet,
      coins: Math.max(0, wallet.coins - charge.coins),
      spentCoins: wallet.spentCoins + charge.coins,
      tokensUsed: wallet.tokensUsed + charge.tokens,
      ledger: [entry, ...wallet.ledger].slice(0, 20),
    },
  };
}

export function applyRecharge(wallet, pack, created = "Just now", entryId = `credit-${Date.now()}`) {
  const coins = packageCoins(pack);
  const entry = {
    id: entryId,
    type: "credit",
    label: `${pack.label} recharge`,
    coins,
    tokens: tokensForCoins(coins),
    model: "$1 = 20 coins",
    created,
  };

  return {
    entry,
    coins,
    wallet: {
      ...wallet,
      coins: wallet.coins + coins,
      lifetimePurchased: wallet.lifetimePurchased + coins,
      ledger: [entry, ...wallet.ledger].slice(0, 20),
    },
  };
}

export function summarizeWallet(wallet) {
  return {
    availableCoins: wallet.coins,
    spentCoins: wallet.spentCoins,
    lifetimePurchased: wallet.lifetimePurchased,
    trackedTokens: wallet.tokensUsed,
    estimatedRemainingTokens: tokensForCoins(wallet.coins),
  };
}

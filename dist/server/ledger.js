import {
  applyRecharge,
  applySpend,
  coinPackages,
  createGenerationCharge,
  createVideoCharge,
  defaultWallet,
  getToolCharge,
  normalizeCharge,
  summarizeWallet,
} from "../src/lib/commerce.js";

const demoUser = {
  signedIn: false,
  id: "demo-user",
  email: "demo@marketforge.local",
  name: "Demo merchant",
};

function cloneWallet() {
  return JSON.parse(JSON.stringify(defaultWallet));
}

function nowIso() {
  return new Date().toISOString();
}

function userIdFor(user) {
  return user.id || user.email || demoUser.id;
}

function entryId(prefix, idempotencyKey) {
  const randomId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${idempotencyKey || randomId}`;
}

function statement(db, sql, ...values) {
  return db.prepare(sql).bind(...values);
}

async function runBatch(db, statements) {
  if (typeof db.batch === "function") return db.batch(statements);
  const results = [];
  for (const prepared of statements) {
    results.push(await prepared.run());
  }
  return results;
}

function hasDatabase(env) {
  return Boolean(env?.DB?.prepare);
}

function packFromRequest(body) {
  if (body.packageLabel) {
    return coinPackages.find((pack) => pack.label === body.packageLabel);
  }
  if (body.dollars) {
    return coinPackages.find((pack) => pack.dollars === Number(body.dollars));
  }
  return coinPackages[0];
}

function chargeFromRequest(body) {
  if (body.charge) return normalizeCharge(body.charge);
  if (body.tool) return getToolCharge(body.tool);
  if (body.kind === "video") return createVideoCharge(body.seconds);
  return createGenerationCharge();
}

function mapLedgerRow(row) {
  return {
    id: row.id,
    type: row.type,
    label: row.label,
    coins: row.coins,
    tokens: row.tokens,
    model: row.model,
    created: row.created_at,
  };
}

function mapWalletRow(row, ledgerRows = []) {
  return {
    coins: row.coins,
    spentCoins: row.spent_coins,
    lifetimePurchased: row.lifetime_purchased,
    tokensUsed: row.tokens_used,
    ledger: ledgerRows.map(mapLedgerRow),
  };
}

async function ensureUserWallet(db, user) {
  const created = nowIso();
  const userId = userIdFor(user);
  const email = user.email || demoUser.email;
  const name = user.name || email;
  const welcomeId = `credit-welcome-${userId}`;

  await runBatch(db, [
    statement(
      db,
      "INSERT OR IGNORE INTO users (id, email, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
      userId,
      email,
      name,
      created,
      created,
    ),
    statement(db, "UPDATE users SET email = ?, name = ?, updated_at = ? WHERE id = ?", email, name, created, userId),
    statement(
      db,
      "INSERT OR IGNORE INTO wallets (user_id, coins, spent_coins, lifetime_purchased, tokens_used, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
      userId,
      defaultWallet.coins,
      defaultWallet.spentCoins,
      defaultWallet.lifetimePurchased,
      defaultWallet.tokensUsed,
      created,
    ),
    statement(
      db,
      "INSERT OR IGNORE INTO ledger_entries (id, user_id, type, label, coins, tokens, model, created_at, metadata_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      welcomeId,
      userId,
      "credit",
      "Welcome trial balance",
      defaultWallet.coins,
      defaultWallet.ledger[0].tokens,
      "Trial",
      created,
      "{}",
    ),
  ]);

  return userId;
}

async function readWalletFromDb(db, userId) {
  const row = await statement(
    db,
    "SELECT coins, spent_coins, lifetime_purchased, tokens_used FROM wallets WHERE user_id = ?",
    userId,
  ).first();
  const ledger = await statement(
    db,
    "SELECT id, type, label, coins, tokens, model, created_at FROM ledger_entries WHERE user_id = ? ORDER BY created_at DESC LIMIT 20",
    userId,
  ).all();

  return mapWalletRow(row, ledger.results || []);
}

export async function getServerWallet(env, user = demoUser) {
  if (!hasDatabase(env)) {
    const wallet = cloneWallet();
    return {
      source: "demo-memory",
      user,
      wallet,
      summary: summarizeWallet(wallet),
    };
  }

  const userId = await ensureUserWallet(env.DB, user);
  const wallet = await readWalletFromDb(env.DB, userId);
  return {
    source: "d1",
    user: { ...user, id: userId },
    wallet,
    summary: summarizeWallet(wallet),
  };
}

export async function rechargeServerWallet(env, user = demoUser, body = {}) {
  const pack = packFromRequest(body);
  if (!pack) {
    return { ok: false, status: 400, error: "unknown_coin_package" };
  }

  const id = entryId("credit", body.idempotencyKey);
  if (!hasDatabase(env)) {
    const recharge = applyRecharge(cloneWallet(), pack, "Just now", id);
    return {
      ok: true,
      source: "demo-memory",
      duplicate: false,
      entry: recharge.entry,
      wallet: recharge.wallet,
      summary: summarizeWallet(recharge.wallet),
    };
  }

  const userId = await ensureUserWallet(env.DB, user);
  const existing = await statement(env.DB, "SELECT id FROM ledger_entries WHERE id = ? AND user_id = ?", id, userId).first();
  if (existing) {
    const wallet = await readWalletFromDb(env.DB, userId);
    return { ok: true, source: "d1", duplicate: true, wallet, summary: summarizeWallet(wallet) };
  }

  const currentWallet = await readWalletFromDb(env.DB, userId);
  const recharge = applyRecharge(currentWallet, pack, nowIso(), id);

  await runBatch(env.DB, [
    statement(
      env.DB,
      "UPDATE wallets SET coins = ?, lifetime_purchased = ?, updated_at = ? WHERE user_id = ?",
      recharge.wallet.coins,
      recharge.wallet.lifetimePurchased,
      nowIso(),
      userId,
    ),
    statement(
      env.DB,
      "INSERT INTO ledger_entries (id, user_id, type, label, coins, tokens, model, created_at, metadata_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      recharge.entry.id,
      userId,
      recharge.entry.type,
      recharge.entry.label,
      recharge.entry.coins,
      recharge.entry.tokens,
      recharge.entry.model,
      recharge.entry.created,
      JSON.stringify({ packageLabel: pack.label, dollars: pack.dollars }),
    ),
  ]);

  const wallet = await readWalletFromDb(env.DB, userId);
  return { ok: true, source: "d1", duplicate: false, entry: recharge.entry, wallet, summary: summarizeWallet(wallet) };
}

export async function spendServerWallet(env, user = demoUser, body = {}) {
  const charge = chargeFromRequest(body);
  const id = entryId("spend", body.idempotencyKey);

  if (!hasDatabase(env)) {
    const spend = applySpend(cloneWallet(), charge, "Just now", id);
    return {
      ok: spend.ok,
      status: spend.ok ? 200 : 402,
      source: "demo-memory",
      reason: spend.reason,
      entry: spend.entry,
      charge: spend.charge,
      wallet: spend.wallet,
      summary: summarizeWallet(spend.wallet),
    };
  }

  const userId = await ensureUserWallet(env.DB, user);
  const existing = await statement(env.DB, "SELECT id FROM ledger_entries WHERE id = ? AND user_id = ?", id, userId).first();
  if (existing) {
    const wallet = await readWalletFromDb(env.DB, userId);
    return { ok: true, status: 200, source: "d1", duplicate: true, charge, wallet, summary: summarizeWallet(wallet) };
  }

  const currentWallet = await readWalletFromDb(env.DB, userId);
  const spend = applySpend(currentWallet, charge, nowIso(), id);
  if (!spend.ok) {
    return {
      ok: false,
      status: 402,
      source: "d1",
      reason: spend.reason,
      charge: spend.charge,
      wallet: spend.wallet,
      summary: summarizeWallet(spend.wallet),
    };
  }

  await runBatch(env.DB, [
    statement(
      env.DB,
      "UPDATE wallets SET coins = ?, spent_coins = ?, tokens_used = ?, updated_at = ? WHERE user_id = ?",
      spend.wallet.coins,
      spend.wallet.spentCoins,
      spend.wallet.tokensUsed,
      nowIso(),
      userId,
    ),
    statement(
      env.DB,
      "INSERT INTO ledger_entries (id, user_id, type, label, coins, tokens, model, created_at, metadata_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      spend.entry.id,
      userId,
      spend.entry.type,
      spend.entry.label,
      spend.entry.coins,
      spend.entry.tokens,
      spend.entry.model,
      spend.entry.created,
      JSON.stringify({ tool: body.tool || null, kind: body.kind || null }),
    ),
  ]);

  const wallet = await readWalletFromDb(env.DB, userId);
  return { ok: true, status: 200, source: "d1", duplicate: false, entry: spend.entry, charge: spend.charge, wallet, summary: summarizeWallet(wallet) };
}

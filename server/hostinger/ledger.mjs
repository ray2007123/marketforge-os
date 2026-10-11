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
} from "../../src/lib/commerce.js";
import { withTransaction } from "./db.mjs";

function nowSql() {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}

function id(prefix, key) {
  return `${prefix}-${key || `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;
}

function packFromBody(body = {}) {
  if (body.packageLabel) return coinPackages.find((pack) => pack.label === body.packageLabel);
  if (body.dollars) return coinPackages.find((pack) => pack.dollars === Number(body.dollars));
  return coinPackages[0];
}

function chargeFromBody(body = {}) {
  if (body.charge) return normalizeCharge(body.charge);
  if (body.tool) return getToolCharge(body.tool);
  if (body.kind === "video") return createVideoCharge(body.seconds);
  return createGenerationCharge();
}

function mapEntry(row) {
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

function mapWallet(row, entries = []) {
  return {
    coins: row.coins,
    spentCoins: row.spent_coins,
    lifetimePurchased: row.lifetime_purchased,
    tokensUsed: row.tokens_used,
    ledger: entries.map(mapEntry),
  };
}

export async function ensureWallet(pool, user) {
  const created = nowSql();
  const welcomeId = `credit-welcome-${user.id}`;

  await pool.execute(
    "INSERT IGNORE INTO wallets (user_id, coins, spent_coins, lifetime_purchased, tokens_used, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
    [user.id, defaultWallet.coins, defaultWallet.spentCoins, defaultWallet.lifetimePurchased, defaultWallet.tokensUsed, created],
  );
  await pool.execute(
    "INSERT IGNORE INTO ledger_entries (id, user_id, type, label, coins, tokens, model, created_at, metadata_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [welcomeId, user.id, "credit", "Welcome trial balance", defaultWallet.coins, defaultWallet.ledger[0].tokens, "Trial", created, "{}"],
  );
}

async function readWalletUsing(executor, user) {
  const [[walletRow]] = await executor.execute(
    "SELECT coins, spent_coins, lifetime_purchased, tokens_used FROM wallets WHERE user_id = ? LIMIT 1",
    [user.id],
  );
  const [ledgerRows] = await executor.execute(
    "SELECT id, type, label, coins, tokens, model, created_at FROM ledger_entries WHERE user_id = ? ORDER BY created_at DESC LIMIT 20",
    [user.id],
  );
  const wallet = mapWallet(walletRow, ledgerRows);
  return { ok: true, source: "mysql", wallet, summary: summarizeWallet(wallet) };
}

export async function readWallet(pool, user) {
  await ensureWallet(pool, user);
  return readWalletUsing(pool, user);
}

export async function rechargeWallet(pool, user, body = {}) {
  const pack = packFromBody(body);
  if (!pack) return { ok: false, status: 400, error: "unknown_coin_package" };
  const entryId = id("credit", body.idempotencyKey);

  return withTransaction(pool, async (connection) => {
    await ensureWallet(connection, user);
    const [[existing]] = await connection.execute(
      "SELECT id FROM ledger_entries WHERE id = ? AND user_id = ? LIMIT 1",
      [entryId, user.id],
    );
    if (existing) {
      return { ...(await readWalletUsing(connection, user)), duplicate: true };
    }

    const [[row]] = await connection.execute(
      "SELECT coins, spent_coins, lifetime_purchased, tokens_used FROM wallets WHERE user_id = ? LIMIT 1",
      [user.id],
    );
    const recharge = applyRecharge(mapWallet(row, []), pack, nowSql(), entryId);

    await connection.execute(
      "UPDATE wallets SET coins = ?, lifetime_purchased = ?, updated_at = ? WHERE user_id = ?",
      [recharge.wallet.coins, recharge.wallet.lifetimePurchased, nowSql(), user.id],
    );
    await connection.execute(
      "INSERT INTO ledger_entries (id, user_id, type, label, coins, tokens, model, created_at, metadata_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        recharge.entry.id,
        user.id,
        recharge.entry.type,
        recharge.entry.label,
        recharge.entry.coins,
        recharge.entry.tokens,
        recharge.entry.model,
        recharge.entry.created,
        JSON.stringify({ packageLabel: pack.label, dollars: pack.dollars }),
      ],
    );

    return { ...(await readWalletUsing(connection, user)), duplicate: false, entry: recharge.entry };
  });
}

export async function spendWallet(pool, user, body = {}) {
  const charge = chargeFromBody(body);
  const entryId = id("spend", body.idempotencyKey);

  return withTransaction(pool, async (connection) => {
    await ensureWallet(connection, user);
    const [[existing]] = await connection.execute(
      "SELECT id FROM ledger_entries WHERE id = ? AND user_id = ? LIMIT 1",
      [entryId, user.id],
    );
    if (existing) {
      return { ...(await readWalletUsing(connection, user)), ok: true, status: 200, duplicate: true, charge };
    }

    const [[row]] = await connection.execute(
      "SELECT coins, spent_coins, lifetime_purchased, tokens_used FROM wallets WHERE user_id = ? LIMIT 1",
      [user.id],
    );
    const spend = applySpend(mapWallet(row, []), charge, nowSql(), entryId);
    if (!spend.ok) {
      return {
        ok: false,
        status: 402,
        reason: spend.reason,
        charge: spend.charge,
        wallet: spend.wallet,
        summary: summarizeWallet(spend.wallet),
      };
    }

    await connection.execute(
      "UPDATE wallets SET coins = ?, spent_coins = ?, tokens_used = ?, updated_at = ? WHERE user_id = ?",
      [spend.wallet.coins, spend.wallet.spentCoins, spend.wallet.tokensUsed, nowSql(), user.id],
    );
    await connection.execute(
      "INSERT INTO ledger_entries (id, user_id, type, label, coins, tokens, model, created_at, metadata_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        spend.entry.id,
        user.id,
        spend.entry.type,
        spend.entry.label,
        spend.entry.coins,
        spend.entry.tokens,
        spend.entry.model,
        spend.entry.created,
        JSON.stringify({ tool: body.tool || null, kind: body.kind || null }),
      ],
    );

    return { ...(await readWalletUsing(connection, user)), ok: true, status: 200, duplicate: false, entry: spend.entry, charge: spend.charge };
  });
}

import { pbkdf2Sync, randomBytes, timingSafeEqual } from "node:crypto";

const sessionCookie = "mf_session";
const sessionDays = 30;

function nowSql() {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}

function userId() {
  return `user_${randomBytes(12).toString("hex")}`;
}

function sessionId() {
  return randomBytes(32).toString("hex");
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function hashPassword(password, salt = randomBytes(16).toString("hex")) {
  const hash = pbkdf2Sync(String(password), salt, 210000, 32, "sha256").toString("hex");
  return `pbkdf2_sha256$${salt}$${hash}`;
}

function verifyPassword(password, storedHash) {
  const [, salt, hash] = String(storedHash || "").split("$");
  if (!salt || !hash) return false;
  const attempted = hashPassword(password, salt).split("$")[2];
  return timingSafeEqual(Buffer.from(attempted, "hex"), Buffer.from(hash, "hex"));
}

export function parseCookies(header = "") {
  return Object.fromEntries(
    String(header)
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf("=");
        return [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
      }),
  );
}

export function clearSessionCookie() {
  return `${sessionCookie}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

function makeSessionCookie(id, env = process.env) {
  const secure = env.COOKIE_SECURE === "false" ? "" : "; Secure";
  return `${sessionCookie}=${encodeURIComponent(id)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${sessionDays * 86400}${secure}`;
}

function publicUser(row) {
  if (!row) return { signedIn: false };
  return {
    signedIn: true,
    id: row.id,
    email: row.email,
    name: row.name,
  };
}

async function createSession(pool, user, env) {
  const id = sessionId();
  const created = nowSql();
  const expires = new Date(Date.now() + sessionDays * 86400 * 1000).toISOString().slice(0, 19).replace("T", " ");
  await pool.execute(
    "INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)",
    [id, user.id, expires, created],
  );
  return makeSessionCookie(id, env);
}

export async function registerUser(pool, body = {}, env = process.env) {
  const email = normalizeEmail(body.email);
  const password = String(body.password || "");
  const name = String(body.name || email || "Merchant").trim();

  if (!email || !email.includes("@")) return { ok: false, status: 400, error: "valid_email_required" };
  if (password.length < 8) return { ok: false, status: 400, error: "password_minimum_8_chars" };

  const created = nowSql();
  const user = { id: userId(), email, name };
  try {
    await pool.execute(
      "INSERT INTO users (id, email, name, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
      [user.id, email, name, hashPassword(password), created, created],
    );
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") return { ok: false, status: 409, error: "email_already_registered" };
    throw error;
  }

  return {
    ok: true,
    user: publicUser(user),
    cookie: await createSession(pool, user, env),
  };
}

export async function loginUser(pool, body = {}, env = process.env) {
  const email = normalizeEmail(body.email);
  const password = String(body.password || "");
  const [rows] = await pool.execute("SELECT id, email, name, password_hash FROM users WHERE email = ? LIMIT 1", [email]);
  const user = rows[0];
  if (!user || !verifyPassword(password, user.password_hash)) {
    return { ok: false, status: 401, error: "invalid_email_or_password" };
  }

  return {
    ok: true,
    user: publicUser(user),
    cookie: await createSession(pool, user, env),
  };
}

export async function logoutUser(pool, request) {
  const cookies = parseCookies(request.headers.cookie || "");
  if (cookies[sessionCookie]) {
    await pool.execute("DELETE FROM sessions WHERE id = ?", [cookies[sessionCookie]]);
  }
  return { ok: true, cookie: clearSessionCookie() };
}

export async function userFromRequest(pool, request) {
  const cookies = parseCookies(request.headers.cookie || "");
  if (!cookies[sessionCookie]) return { signedIn: false };

  const [rows] = await pool.execute(
    `SELECT users.id, users.email, users.name
     FROM sessions
     JOIN users ON users.id = sessions.user_id
     WHERE sessions.id = ? AND sessions.expires_at > NOW()
     LIMIT 1`,
    [cookies[sessionCookie]],
  );

  return publicUser(rows[0]);
}

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

export function loadDotEnv(file = ".env") {
  const envPath = path.resolve(process.cwd(), file);
  if (!existsSync(envPath)) return;

  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    const rawValue = trimmed.slice(separator + 1).trim();
    const value = rawValue.replace(/^["']|["']$/g, "");
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

export function requireEnv(keys, env = process.env) {
  return keys.filter((key) => !env[key]);
}

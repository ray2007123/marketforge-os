#!/usr/bin/env node
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const index = path.join(dist, "client", "index.html");
const worker = path.join(root, "worker", "index.js");
const ledger = path.join(root, "worker", "ledger.js");
const generation = path.join(root, "worker", "generation.js");
const hosting = path.join(root, ".openai", "hosting.json");
const commerceRules = path.join(root, "src", "lib", "commerce.js");
const dbSchema = path.join(root, "db", "schema.ts");

for (const file of [index, worker, ledger, generation, hosting, commerceRules, dbSchema]) {
  if (!existsSync(file)) throw new Error("Missing Sites build input: " + file);
}

mkdirSync(path.join(dist, "server"), { recursive: true });
mkdirSync(path.join(dist, ".openai"), { recursive: true });
mkdirSync(path.join(dist, "src", "lib"), { recursive: true });
mkdirSync(path.join(dist, "db"), { recursive: true });
copyFileSync(worker, path.join(dist, "server", "index.js"));
copyFileSync(ledger, path.join(dist, "server", "ledger.js"));
copyFileSync(generation, path.join(dist, "server", "generation.js"));
copyFileSync(hosting, path.join(dist, ".openai", "hosting.json"));
copyFileSync(commerceRules, path.join(dist, "src", "lib", "commerce.js"));
copyFileSync(dbSchema, path.join(dist, "db", "schema.ts"));

console.log("Prepared Sites build: worker API, shared rules, schema, and dist/.openai/hosting.json");

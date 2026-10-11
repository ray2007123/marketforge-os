import { getPool, migrate } from "./db.mjs";
import { loadDotEnv } from "./env.mjs";

loadDotEnv();

try {
  await migrate(getPool());
  console.log("Hostinger MySQL schema is ready.");
  process.exit(0);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

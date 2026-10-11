import assert from "node:assert/strict";
import test from "node:test";

for (const key of ["DB_HOST", "DB_PORT", "DB_NAME", "DB_USER", "DB_PASSWORD", "AUTO_MIGRATE"]) {
  delete process.env[key];
}
process.env.COOKIE_SECURE = "false";

const { createHostingerServer } = await import("../server/hostinger/server.mjs");

async function withServer(callback) {
  const server = createHostingerServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  try {
    return await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test("Hostinger server exposes health, pricing, and static app fallback", async () => {
  await withServer(async (baseUrl) => {
    const health = await fetch(`${baseUrl}/api/health`);
    const healthBody = await health.json();

    assert.equal(health.status, 200);
    assert.equal(healthBody.ok, true);
    assert.equal(healthBody.service, "MarketForge OS Hostinger API");
    assert.equal(healthBody.databaseConfigured, false);

    const pricing = await fetch(`${baseUrl}/api/pricing`);
    const pricingBody = await pricing.json();

    assert.equal(pricing.status, 200);
    assert.equal(pricingBody.policy.tokensPerCoin, 500);
    assert.equal(pricingBody.packages[0].coins, 20);

    const app = await fetch(`${baseUrl}/unknown/app/route`, { headers: { accept: "text/html" } });
    const html = await app.text();

    assert.equal(app.status, 200);
    assert.match(html, /<div id="root"><\/div>/);
  });
});

test("Hostinger server does not run account or wallet APIs without database configuration", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "merchant@example.com", password: "password123", name: "Merchant" }),
    });
    const body = await response.json();

    assert.equal(response.status, 503);
    assert.equal(body.error, "database_not_configured");
  });
});

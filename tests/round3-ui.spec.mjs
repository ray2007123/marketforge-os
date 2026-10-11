import { expect, test } from "@playwright/test";

const appUrl = process.env.APP_URL || "http://localhost:5173/";

const toolTitles = [
  "Product Kit",
  "A+ Page Builder",
  "Social Ad Lab",
  "Video Sprint",
  "Smart Cutout",
  "AI Eraser",
  "Brand Translator",
  "Batch Export",
];

const templateTitles = [
  "Clean Beauty Launch",
  "European Fashion Billboard",
  "Coffee Storefront Set",
  "Warehouse Proof Stack",
  "Holiday Home Promo",
  "Travel Charger Hero",
  "Tote Brand Mockup",
  "Outdoor Bottle Details",
  "Apparel Try-on Scene",
  "Summer Social Drop",
  "Stationery Flatlay",
  "Boutique Storefront",
  "Serum Detail Poster",
  "Outdoor Gear Ad",
  "Accessories Bundle",
  "Food Delivery Brand",
  "Cosmetics Campaign",
  "Home Goods Catalog",
  "Kitchen Appliance Hero",
  "Luxury Gift Promo",
];

const categoryExpectations = [
  ["All", "Clean Beauty Launch"],
  ["Amazon A+", "Warehouse Proof Stack"],
  ["Social Ads", "European Fashion Billboard"],
  ["Shopify", "Clean Beauty Launch"],
  ["Brand System", "Clean Beauty Launch"],
  ["Japan Launch", "Apparel Try-on Scene"],
  ["Retail", "Coffee Storefront Set"],
  ["Seasonal", "Holiday Home Promo"],
];

test.use({
  channel: "chrome",
  viewport: { width: 1440, height: 1000 },
});

function watchPageErrors(page) {
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

async function openFresh(page) {
  await page.goto(appUrl, { waitUntil: "networkidle" });
  await page.evaluate(() => window.localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Turn product references into launch-ready commerce campaigns." })).toBeVisible();
}

async function closePanel(page) {
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await expect(page.locator(".detail-panel")).toHaveCount(0);
}

async function clickPrimaryAndExpectClosed(page, name) {
  await page.getByRole("button", { name, exact: true }).click();
  await expect(page.locator(".detail-panel")).toHaveCount(0);
}

test("navigation, brand return, static panels, and footer buttons respond", async ({ page }) => {
  const errors = watchPageErrors(page);
  await openFresh(page);

  const modules = [
    ["Command", "Persistent launch state"],
    ["AI Tools", "Tool queue"],
    ["Templates", "Template operations"],
    ["Projects", "Merchant launch workspace"],
    ["Insights", "Market readiness dashboard"],
  ];

  for (const [buttonName, heading] of modules) {
    await page.getByRole("button", { name: buttonName, exact: true }).click();
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
  }

  await page.getByRole("link", { name: /MarketForge OS/ }).click();
  await expect(page.getByRole("heading", { name: "Persistent launch state" })).toBeVisible();
  await expect(page.getByText("Returned to command center.")).toBeVisible();

  await page.getByRole("button", { name: /80 coins/ }).click();
  await expect(page.getByRole("heading", { name: "80 coins available" })).toBeVisible();
  await page.getByRole("button", { name: "Pricing", exact: true }).click();
  await expect(page.getByText("1 coin = 500 billable tokens")).toBeVisible();
  await expect(page.getByText("Policy 2026-10-02")).toBeVisible();
  await page.getByRole("button", { name: /Usage/ }).click();
  await expect(page.getByText("Welcome trial balance")).toBeVisible();
  await page.getByRole("button", { name: "Buy $1 pack", exact: true }).click();
  await expect(page.getByRole("heading", { name: "100 coins available" })).toBeVisible();
  await clickPrimaryAndExpectClosed(page, "Close receipt");
  await expect(page.getByText("Recharge receipt closed.")).toBeVisible();

  await page.getByRole("button", { name: "Notifications", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Notification Center" })).toBeVisible();
  await clickPrimaryAndExpectClosed(page, "Mark all as reviewed");
  await expect(page.getByText("Notifications marked as reviewed.")).toBeVisible();

  await page.getByRole("button", { name: "Account", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Northstar Merchant" })).toBeVisible();
  await page.getByRole("button", { name: "Team", exact: true }).click();
  await expect(page.getByText("3 seats")).toBeVisible();
  await page.getByRole("button", { name: "API", exact: true }).click();
  await expect(page.getByText("Webhook queue")).toBeVisible();
  await expect(page.getByText("Server ledger")).toBeVisible();
  await expect(page.getByText("Sora API availability")).toBeVisible();
  await expect(page.getByText("POST /api/wallet/spend")).toBeVisible();
  await expect(page.getByText("POST /api/generation/run")).toBeVisible();
  await page.getByRole("button", { name: "Close panel", exact: true }).click();
  await expect(page.locator(".detail-panel")).toHaveCount(0);

  await page.getByRole("button", { name: "Account", exact: true }).click();
  await clickPrimaryAndExpectClosed(page, "Save profile");
  await expect(page.getByText("Account profile saved.")).toBeVisible();

  for (const footerLink of ["Security", "Docs", "Partners", "Roadmap"]) {
    await page.getByRole("button", { name: footerLink, exact: true }).click();
    await expect(page.getByRole("heading", { name: footerLink, exact: true })).toBeVisible();
    await clickPrimaryAndExpectClosed(page, "Open notes");
    await expect(page.getByText("Notes opened for this section.")).toBeVisible();
  }

  expect(errors).toEqual([]);
});

test("launch brief, upload, assets, generate, save, jobs, and persistence work", async ({ page }) => {
  const errors = watchPageErrors(page);
  await openFresh(page);

  await page.getByRole("button", { name: "Europe", exact: true }).click();
  await expect(page.getByText("Europe launch kit")).toBeVisible();
  await expect(page.getByText("Europe market guidance loaded.")).toBeVisible();

  await page.getByRole("button", { name: "Japan", exact: true }).click();
  await expect(page.getByText("Japan launch kit")).toBeVisible();

  const brief = page.getByRole("textbox", { name: "Launch brief" });
  await brief.fill("Launch a travel mug with GPT-image visuals and Sora video for Japan.");
  await expect(brief).toHaveValue("Launch a travel mug with GPT-image visuals and Sora video for Japan.");

  const quickTasks = [
    ["Launch product kit", "Create a full product-launch kit using GPT-image"],
    ["Localize campaign", "Adapt this product campaign for US, European, and Japanese merchants"],
    ["Build social ads", "Turn this product into a social ad pack with GPT-image feed"],
    ["Polish brand system", "Create a premium brand system for an ecommerce merchant"],
  ];

  for (const [taskName, promptStart] of quickTasks) {
    await page.getByRole("button", { name: new RegExp(taskName) }).click();
    await expect(brief).toHaveValue(new RegExp(promptStart));
    await expect(page.getByText(`${taskName} loaded into the brief.`)).toBeVisible();
  }

  await page.getByRole("button", { name: "Upload", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Upload product references" })).toBeVisible();
  await page.getByRole("button", { name: "Add demo references", exact: true }).click();
  await expect(page.getByText("Demo references added")).toBeVisible();
  await expect(page.getByText("ugc-shotlist.mov")).toBeVisible();
  await closePanel(page);
  await expect(page.getByText("4 references attached")).toBeVisible();

  await page.getByRole("button", { name: "Assets", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Attached launch assets" })).toBeVisible();
  await expect(page.getByText("storefront-reference.pdf")).toBeVisible();
  await clickPrimaryAndExpectClosed(page, "Attach selected");
  await expect(page.getByText("Selected launch assets attached.")).toBeVisible();

  await page.getByRole("button", { name: "Generate", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Launch drafts are ready" })).toBeVisible();
  await expect(page.getByText("Cost: 18 coins")).toBeVisible();
  await expect(page.getByText("Image model: GPT-image")).toBeVisible();
  await expect(page.getByText("Video model: Sora")).toBeVisible();
  await clickPrimaryAndExpectClosed(page, "Export draft pack");
  await expect(page.getByText("2 persistent jobs")).toBeVisible();
  await expect(page.getByText("GPT-image Japan marketplace image set")).toBeVisible();

  await page.getByRole("button", { name: /GPT-image Japan marketplace image set/ }).click();
  await expect(page.getByRole("heading", { name: "Japan launch kit generation" })).toBeVisible();
  await closePanel(page);

  await page.getByRole("button", { name: "Open export checklist", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Draft pack export" })).toBeVisible();
  await expect(page.getByText("Confirm Sora video prompt notes")).toBeVisible();
  await clickPrimaryAndExpectClosed(page, "Export draft pack");

  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Merchant launch workspace" })).toBeVisible();
  await expect(page.getByText("Japan Launch Kit saved to Projects.")).toBeVisible();
  await page.getByRole("button", { name: /Japan Launch Kit/ }).first().click();
  await expect(page.getByRole("heading", { name: "Japan Launch Kit" })).toBeVisible();
  await clickPrimaryAndExpectClosed(page, "Open project");
  await expect(page.getByText("Project opened in the launch workspace.")).toBeVisible();

  await page.getByRole("button", { name: "Insights", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Market readiness dashboard" })).toBeVisible();

  await page.reload({ waitUntil: "networkidle" });
  await expect(page.getByText("Market readiness dashboard")).toBeVisible();
  await expect(page.getByText("Japan Launch Kit")).toBeVisible();
  await expect(page.getByText("2 persistent jobs")).toBeVisible();

  const storage = await page.evaluate(() => ({
    activeModule: JSON.parse(window.localStorage.getItem("marketforge.activeModule")),
    market: JSON.parse(window.localStorage.getItem("marketforge.market")),
    projects: JSON.parse(window.localStorage.getItem("marketforge.projects") || "[]").length,
    jobs: JSON.parse(window.localStorage.getItem("marketforge.jobs") || "[]").length,
    assets: JSON.parse(window.localStorage.getItem("marketforge.assets") || "[]").length,
    coins: JSON.parse(window.localStorage.getItem("marketforge.wallet") || "{}").coins,
  }));

  expect(storage).toEqual({
    activeModule: "Insights",
    market: "Japan",
    projects: 4,
    jobs: 2,
    assets: 4,
    coins: 60,
  });
  expect(errors).toEqual([]);
});

test("all production tool cards open, run, save outputs, and export", async ({ page }) => {
  const errors = watchPageErrors(page);
  await openFresh(page);

  await page.getByRole("button", { name: "AI Tools", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Tool queue" })).toBeVisible();
  await page.getByRole("button", { name: /80 coins/ }).click();
  await page.getByRole("button", { name: "Creator $5 110 coins, 10 bonus", exact: true }).click();
  await expect(page.getByRole("heading", { name: "190 coins available" })).toBeVisible();
  await closePanel(page);

  for (const title of toolTitles) {
    await page.locator(".tool-card").filter({ hasText: title }).click();
    await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
    await expect(page.getByText("Model:")).toBeVisible();
    await page.getByRole("button", { name: `Run ${title}`, exact: true }).click();
    await expect(page.getByRole("heading", { name: `${title} outputs are ready` })).toBeVisible();
    await expect(page.getByText("Cost:")).toBeVisible();
    await expect(page.getByText("The tool run is saved to the launch board and ready for export review.")).toBeVisible();
    await clickPrimaryAndExpectClosed(page, "Export draft pack");
  }

  await expect(page.getByText(`${toolTitles.length + 1} persistent jobs`)).toBeVisible();
  await page.getByRole("button", { name: /Batch Export run/ }).click();
  await expect(page.getByRole("heading", { name: "Batch Export run" })).toBeVisible();
  await closePanel(page);

  expect(errors).toEqual([]);
});

test("template operations, filters, all template cards, and use-template action work", async ({ page }) => {
  const errors = watchPageErrors(page);
  await openFresh(page);

  await page.getByRole("button", { name: "Templates", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Template operations" })).toBeVisible();

  await page.getByRole("button", { name: /Review export presets/ }).click();
  await expect(page.getByRole("heading", { name: "US marketplace listing set" })).toBeVisible();
  await closePanel(page);

  await page.getByRole("button", { name: /Convert selected template direction/ }).click();
  await expect(page.getByRole("heading", { name: "Merchant launch workspace" })).toBeVisible();
  await page.getByRole("button", { name: "Templates", exact: true }).click();

  for (const [category, expectedTitle] of categoryExpectations) {
    await page.getByRole("button", { name: category, exact: true }).click();
    await expect(page.getByRole("button", { name: new RegExp(expectedTitle) })).toBeVisible();
  }

  await page.getByRole("button", { name: "All", exact: true }).click();
  for (const title of templateTitles) {
    await page.getByRole("button", { name: new RegExp(title) }).click();
    await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
    await closePanel(page);
  }

  await page.getByRole("button", { name: /Clean Beauty Launch/ }).click();
  await expect(page.getByText("GPT-image visual prompts")).toBeVisible();
  await expect(page.getByText("Sora video prompt outline")).toBeVisible();
  await clickPrimaryAndExpectClosed(page, "Use template");
  await expect(page.getByRole("textbox", { name: "Launch brief" })).toHaveValue(/GPT-image product images, Sora video directions/);

  expect(errors).toEqual([]);
});

test("mobile layout exposes the primary workflow without page-level horizontal overflow", async ({ page }) => {
  const errors = watchPageErrors(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await openFresh(page);

  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 2);

  await expect(page.getByRole("button", { name: "Generate", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Generate", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Launch drafts are ready" })).toBeVisible();
  await clickPrimaryAndExpectClosed(page, "Export draft pack");
  await expect(page.getByText("2 persistent jobs")).toBeVisible();

  expect(errors).toEqual([]);
});

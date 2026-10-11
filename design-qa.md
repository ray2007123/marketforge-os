**Round 2 QA**

**Goal**
- Change the site so it no longer looks like the original reference product.
- Start the second round by making the major buttons and controls visibly functional in the frontend prototype.

**Visual Direction**
- Reworked the product from a reference-like white tool homepage into `MarketForge OS`, a dark-header merchant creative command center.
- New structure uses a horizontal product nav, launch brief console, readiness panel, workflow tool grid, launch output board, template atlas, and slide-out detail panels.
- Kept the original generated ecommerce template imagery, but the layout, typography, color system, interaction model, and product naming are now distinct.

**Implementation Evidence**
- Desktop screenshot: `/Users/mingmingwang/Documents/ChatGPT/电商推广网站/prototype/qa/round2-desktop-final.png`
- Mobile screenshot: `/Users/mingmingwang/Documents/ChatGPT/电商推广网站/prototype/qa/round2-mobile-final.png`
- Local preview: `http://localhost:5173/`

**Interaction Coverage**
- Primary navigation opens workspace panels and updates active module.
- Market selector changes US / Europe / Japan guidance.
- Upload opens a source-assets panel.
- Add demo references updates the upload panel and attached asset list.
- Assets opens the current launch asset library.
- Generate creates simulated draft outputs and opens a result panel.
- Tool cards open runnable tool panels.
- Category chips filter templates.
- Template cards open detail panels with "Use template" action.
- Footer links open connected prototype panels.
- Notification, account, and credit buttons open their own panels.

**Verification**
- `npm run build`: passed.
- `npm run test:sites`: passed, 4 tests.
- Browser interaction QA: passed for generate, upload, add demo references, Social Ad Lab panel, Japan Launch filter, and template detail.
- Browser console errors during interaction QA: none.

**Findings**
- No remaining actionable P0/P1/P2 issues found in the round 2 checks.

**Follow-up Polish**
- P3: This is still a frontend simulation. Real upload, auth, persistence, billing, and AI generation would require backend services in a later round.

final result: passed

**Service Layer And API Contract QA**

**Goal**
- Continue the account and coin work by separating business rules from the React screen.
- Add backend-facing contracts for pricing, user identity, and generation cost estimates.
- Keep the prototype honest: no real payment, OpenAI call, or durable ledger is claimed until the backend is connected.

**Product Updates**
- Added `src/lib/commerce.js` as the single source for coin packages, wallet defaults, model routing, token math, spend rules, recharge rules, and production readiness notes.
- Updated the app to run generation, tool use, export, and recharge through the shared commerce ledger functions.
- Added a wallet summary with estimated remaining billable tokens.
- Added production readiness items to the API account panel: server ledger, payment webhooks, model routing, and usage reconciliation.
- Added worker endpoints for `/api/health`, `/api/pricing`, `/api/account/me`, and `/api/generation/estimate`.
- Updated the Sites packaging script so the worker receives the shared commerce rules at build time.

**API Coverage**
- `/api/pricing` returns `$1 = 20 coins`, `1 coin = 500 billable tokens`, package totals, `GPT-image`, and `Sora`.
- `/api/account/me` reads OpenAI Sites authenticated-user headers when present.
- `/api/generation/estimate` returns a charge object and gross revenue estimate for launch generation, Sora video generation, or a named tool.

**Verification**
- `npm run build`: passed.
- `npm run test:sites`: passed, 6 tests.
- `npm run test:ui -- --reporter=line`: passed, 5 Playwright UI tests.

**Follow-up Production Work**
- P1: Move wallet and ledger writes from browser storage to D1 or another server-owned database.
- P1: Add payment-provider checkout sessions and webhook-confirmed recharge records.
- P1: Add server-side OpenAI API calls for `GPT-image` and `Sora`, then reconcile estimated coins with actual usage.
- P2: Add admin dashboards for refunds, suspicious spend, failed generations, and manual ledger adjustments.

final result: passed

**Account And Coin System QA**

**Goal**
- Add account, recharge, coin spending, and deeper button/menu behavior across the merchant creative OS.
- Route image generation to `GPT-image` and video generation to `Sora`.
- Establish a conservative coin-to-token estimate for early monetization.

**Product Updates**
- Added an account center with profile, team, security, API, webhook, and billing-linked controls.
- Added a billing center with second-level and third-level navigation for recharge, usage, and pricing.
- Added coin packages using `$1 = 20 coins`, with package bonuses and wallet ledger entries.
- Set the first operating estimate to `1 coin = 500 billable tokens`.
- Added `Sora` video billing at `4 coins/second` for the default 720p workflow.
- Wired launch generation, tool runs, and export actions to deduct coins, record token usage, and show insufficient-balance routing.
- Added persistent local account and wallet storage for the prototype.

**Implementation Evidence**
- Desktop screenshot: `/Users/mingmingwang/Documents/ChatGPT/电商推广网站/prototype/qa/coin-system-desktop-final.png`
- Mobile screenshot: `/Users/mingmingwang/Documents/ChatGPT/电商推广网站/prototype/qa/coin-system-mobile-final.png`
- Local preview: `http://localhost:5173/`

**Verification**
- `npm run build`: passed.
- `npm run test:sites`: passed, 4 tests.
- `npm run test:ui -- --reporter=line`: passed, 5 Playwright UI tests.
- Mobile screenshot reviewed after the header no-wrap fix.

**Pricing Note**
- The coin math uses OpenAI's public API pricing checked on 2026-10-02. GPT Image 2.5 image output is priced at `$30 / 1M output tokens`, and Sora 2 720p is priced at `$0.10 / second`. `1 coin = 500 billable tokens` produces `$0.05` gross revenue per coin against an estimated `$0.015` GPT Image 2.5 output-token cost at the highest referenced token rate. Sora is priced separately at `4 coins/second`, or `$0.20` gross revenue per second, before payment, hosting, storage, support, and retry costs.

**Follow-up Production Work**
- P2: Replace localStorage account and wallet data with a backend ledger before accepting real payments.
- P2: Add payment provider webhooks and idempotent recharge receipts.
- P2: Add server-side OpenAI API calls, usage reconciliation, and abuse/rate limits.

final result: passed

**Icon Update QA**

**Goal**
- Replace the previous small-dot brand icon because it looked too similar to the earlier reference direction.

**Product Updates**
- Replaced the in-app logo mark with a new abstract forge/anvil symbol built from angled facets.
- Updated `/favicon.svg` to match the new brand mark.
- Removed the old circular-dot logo styling from the CSS.

**Implementation Evidence**
- Header screenshot: `/Users/mingmingwang/Documents/ChatGPT/电商推广网站/prototype/qa/icon-update-header.png`

**Verification**
- `npm run build`: passed.
- `npm run test:sites`: passed, 4 tests.
- `npm run test:ui -- --reporter=line`: passed, 5 Playwright UI tests.

final result: passed

**Full Function Audit QA**

**Goal**
- Test every visible major control in the current frontend prototype and fix any functional gaps found.

**Fixes Made**
- Brand/logo click now actually returns the user to the Command workspace instead of only changing the status message.
- Static panel primary actions now close the panel and show user-visible feedback for notifications, profile, plan, asset attachment, project opening, and footer notes.
- Tool card `Run` actions now create a saved job, update generated outputs, and show a visible completion panel with model/output details.
- `Open export checklist` now opens a real checklist panel instead of only changing the hidden status message.
- Project and job state updates now use functional state updates to avoid stale state when users click quickly.

**Automated Coverage**
- Top navigation: Command, AI Tools, Templates, Projects, Insights.
- Header controls: credit, notifications, account, brand return.
- Launch brief: market selector, textarea editing, all four quick tasks, upload, add demo references, assets panel, generate, export, save, launch board rows.
- Workspace flows: Projects, Insights, Template operations.
- Production tools: all 8 tool cards open, run, save outputs, and export.
- Templates: all category filters and all 20 template cards open correctly.
- Footer: Security, Docs, Partners, Roadmap panels and actions.
- Mobile: primary workflow works at 390px wide with no page-level horizontal overflow.

**Implementation Evidence**
- Desktop screenshot: `/Users/mingmingwang/Documents/ChatGPT/电商推广网站/prototype/qa/full-audit-desktop.png`
- Mobile screenshot: `/Users/mingmingwang/Documents/ChatGPT/电商推广网站/prototype/qa/full-audit-mobile.png`

**Verification**
- `npm run build`: passed.
- `npm run test:sites`: passed, 4 tests.
- `npm run test:ui -- --reporter=line`: passed, 5 Playwright UI tests.

final result: passed

**Model Routing Update QA**

**Goal**
- Make the website clearly state that image generation uses `GPT-image` and video generation uses `Sora`.

**Product Updates**
- Added explicit `GPT-image` and `Sora` model constants in the app source.
- Updated launch shortcuts, hero copy, channel labels, tool cards, detail panels, generated outputs, and export board copy to show the correct models.
- Added model chips to production tool cards.
- Added display-time normalization so older locally stored job outputs without model names are shown with `GPT-image` or `Sora` labels.

**Implementation Evidence**
- Desktop screenshot: `/Users/mingmingwang/Documents/ChatGPT/电商推广网站/prototype/qa/model-update-desktop.png`
- Mobile screenshot: `/Users/mingmingwang/Documents/ChatGPT/电商推广网站/prototype/qa/model-update-mobile.png`

**Verification**
- `npm run build`: passed.
- `npm run test:sites`: passed, 4 tests.
- `npm run test:ui -- --reporter=line`: passed, 1 Playwright UI test.

final result: passed

**Round 3 QA**

**Goal**
- Continue from the redesigned `MarketForge OS` direction.
- Make the prototype feel more like a usable product by adding saved launch projects, persistent generation jobs, market readiness metrics, and repeatable UI verification.

**Product Updates**
- Added local browser persistence for active module, selected market, launch brief, attached assets, generated outputs, saved projects, generation jobs, and status messages.
- Added a Projects workspace with reusable merchant launch cards and a "Create from current brief" flow.
- Added an Insights workspace with active project counts, generation job counts, draft output counts, current market, and market mix bars.
- Updated Generate so it creates a persistent job and updates the launch board.
- Updated Save so it creates a new project from the current market and brief.
- Added product metadata and a custom SVG favicon for `MarketForge OS`.
- Added a Playwright UI test covering generate, save, project opening, insights navigation, reload persistence, and console-error checks.

**Implementation Evidence**
- Desktop screenshot: `/Users/mingmingwang/Documents/ChatGPT/电商推广网站/prototype/qa/round3-desktop.png`
- Mobile screenshot: `/Users/mingmingwang/Documents/ChatGPT/电商推广网站/prototype/qa/round3-mobile.png`
- Local preview: `http://localhost:5173/`

**Interaction Coverage**
- Market selector changes the active market and influences generated output names.
- Generate opens a result panel, creates a new job, updates draft outputs, and raises the persistent job count.
- Save creates a project and moves the user to the Projects workspace.
- Saved project cards open detail panels.
- Insights shows updated metrics and remains selected after page reload.
- Launch jobs and projects persist through normal browser reload via localStorage.

**Verification**
- `npm run build`: passed.
- `npm run test:sites`: passed, 4 tests.
- `npm run test:ui -- --reporter=line`: passed, 1 Playwright UI test.
- Desktop and mobile screenshots reviewed for layout overlap, clipping, and responsive flow.

**Findings**
- Fixed a browser 404 by adding `/favicon.svg` and wiring it in `index.html`.
- No remaining actionable P0/P1/P2 issues found in the round 3 checks.

**Follow-up Polish**
- P3: Persistence is currently device-local browser storage. Real team accounts, cloud projects, uploads, billing, and AI generation would require backend services in a later round.

final result: passed

**D1 Wallet Ledger QA**

**Goal**
- Continue the monetization work by adding a server-owned wallet ledger path.
- Keep local development working while preparing for D1-backed production storage.

**Product Updates**
- Added `worker/ledger.js` with wallet read, recharge, spend, insufficient-balance, and idempotency-key handling.
- Added `db/schema.ts` with users, wallets, and ledger entries schema definitions plus query indexes.
- Set the Sites D1 logical binding to `DB` in `.openai/hosting.json`.
- Added `/api/wallet`, `/api/wallet/recharge`, and `/api/wallet/spend` routes.
- Updated the account API panel to list the wallet and generation API endpoints.
- Updated Sites packaging so the worker ledger helper and schema ship with the build.

**Verification**
- `npm run build`: passed.
- `npm run test:sites`: passed, 7 tests.
- `npm run test:ui -- --reporter=line`: passed, 5 Playwright UI tests.

**Follow-up Production Work**
- P1: Apply the D1 schema through the Sites migration path before accepting real account balances.
- P1: Connect checkout provider webhooks to `/api/wallet/recharge` with provider idempotency keys.
- P1: Move generation execution behind server routes that call `GPT-image` and `Sora`, then settle actual usage against the wallet ledger.

final result: passed

**Generation Provider Gate QA**

**Goal**
- Continue toward production generation by adding a server-side generation gate.
- Keep OpenAI credentials out of browser code.
- Prevent video charges when the requested Sora provider is unavailable.

**Product Updates**
- Added `worker/generation.js` with generation planning, prompt validation, wallet preflight, demo previews, and a live GPT-image adapter.
- Added `/api/generation/run` as the server-side generation entrypoint.
- Added `.env.example` with server-only OpenAI generation configuration keys.
- Updated API readiness UI to show `/api/generation/run` and Sora provider availability.
- Added `generation_jobs` to `db/schema.ts` for future server-side job persistence.
- Kept demo generation as `settlement: not_charged` so local preview cannot accidentally bill users.
- Live video requests now return `410 sora_api_unavailable` and do not charge coins, because OpenAI's Videos API / Sora 2 API is marked shut down as of 2026-09-24.

**Verification**
- `npm run build`: passed.
- `npm run test:sites`: passed, 8 tests.
- `npm run test:ui -- --reporter=line`: passed, 5 Playwright UI tests.

**Follow-up Production Work**
- P1: Store generated image bytes in R2 instead of returning inline base64.
- P1: Add provider webhooks or polling for long-running generation jobs before marking them complete.
- P1: Choose a supported live video provider or wait for a replacement OpenAI video API before charging for video generation.
- P2: Add admin review for failed provider calls, refunds, and manual re-runs.

final result: passed

**Hostinger Node And MySQL QA**

**Goal**
- Prepare the product for deployment on a Hostinger account with Node.js and MySQL/MariaDB support.
- Preserve the existing frontend and Sites worker path while adding a Hostinger-compatible backend.

**Product Updates**
- Added `server/hostinger/server.mjs` to serve the Vite frontend and `/api/*` routes from one Node.js process.
- Added MySQL connection, migration, schema, auth, wallet ledger, and generation modules under `server/hostinger/`.
- Added email/password registration, login, logout, and HTTP-only session cookies.
- Added MySQL-backed wallet read, recharge, spend, and payment webhook routes.
- Added Hostinger GPT-image generation route with server-only `OPENAI_API_KEY` use.
- Kept live Sora blocked because the official Videos API / Sora 2 API is unavailable.
- Added `HOSTINGER_DEPLOY.md`, `.env.example` Hostinger variables, `build:hostinger`, `start`, `migrate:hostinger`, and `test:hostinger` scripts.

**Verification**
- `npm run build:hostinger`: passed.
- `npm run build`: passed.
- `npm run test:hostinger`: passed, 2 tests.
- `npm run test:sites`: passed, 8 tests.
- `npm run test:ui -- --reporter=line`: passed, 5 Playwright UI tests.

**Follow-up Production Work**
- P1: Enter Hostinger MySQL credentials and run `npm run migrate:hostinger`.
- P1: Replace the provider-neutral payment webhook with Stripe or PayPal signed webhook verification.
- P1: Connect the frontend account and wallet UI directly to the Hostinger APIs instead of local fallback state.
- P2: Add object storage or external asset storage for generated image files if Hostinger disk storage is not enough.

final result: passed

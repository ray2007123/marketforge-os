# Hostinger Deployment Guide

This project now has a Hostinger-ready Node.js + MySQL backend in addition to the existing local/Sites prototype.

## Required Hostinger Plan

Use a Hostinger plan that can run a Node.js app. Static-only shared hosting can serve the built frontend, but it cannot run the account, wallet, recharge, or OpenAI API routes.

## hPanel Setup

1. Create a MySQL/MariaDB database in Hostinger.
2. Copy its host, database name, username, password, and port.
3. Create or connect a Git repository for this project in hPanel.
4. Set the app build command:

```bash
npm install && npm run build:hostinger
```

5. Set the start command:

```bash
npm start
```

6. Run the database migration once:

```bash
npm run migrate:hostinger
```

If Hostinger does not expose a manual command runner for your plan, set `AUTO_MIGRATE=true` for the first launch, then set it back to `false` after the tables are created.

## Environment Variables

Set these in Hostinger, not in browser code:

```bash
PORT=3000
NODE_ENV=production

DB_HOST=your-hostinger-db-host
DB_PORT=3306
DB_NAME=your-db-name
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_CONNECTION_LIMIT=10

COOKIE_SECURE=true
AUTO_MIGRATE=false

PAYMENT_WEBHOOK_SECRET=replace-with-your-provider-webhook-secret

OPENAI_API_KEY=sk-...
ENABLE_LIVE_OPENAI_GENERATION=true
GENERATION_DEFAULT_MODE=live
OPENAI_IMAGE_MODEL=gpt-image-2.5-sunburst
OPENAI_IMAGE_SIZE=1024x1024
```

Do not expose `OPENAI_API_KEY`, database credentials, or webhook secrets to the frontend.

## Working Backend Routes

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/account/me`
- `GET /api/wallet`
- `POST /api/wallet/recharge`
- `POST /api/wallet/spend`
- `POST /api/payments/webhook`
- `POST /api/generation/estimate`
- `POST /api/generation/run`

## Payment Webhook Shape

The current webhook is provider-neutral. Your payment provider should call:

```http
POST /api/payments/webhook
Content-Type: application/json
```

```json
{
  "secret": "same value as PAYMENT_WEBHOOK_SECRET",
  "userId": "user_xxx",
  "packageLabel": "Creator",
  "idempotencyKey": "provider-event-id"
}
```

For Stripe or PayPal production use, replace this shared-secret check with that provider's signed webhook verification.

## Sora / Video Status

OpenAI currently marks the Videos API / Sora 2 API as shut down as of 2026-09-24. The app refuses live Sora charges with `410 sora_api_unavailable`. Keep video generation disabled or connect a supported video provider before charging customers for video.

## Verification Commands

Run before deploying:

```bash
npm run build:hostinger
npm run test:hostinger
npm run test:sites
npm run test:ui -- --reporter=line
```

The browser UI still has local fallback behavior for prototype flows. The Hostinger backend is ready for account, wallet, recharge, and GPT-image generation calls.

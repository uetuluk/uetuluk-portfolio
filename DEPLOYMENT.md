# Deployment

## Prerequisites

### Cloudflare Account Setup

1. Create account at [dash.cloudflare.com](https://dash.cloudflare.com)
2. Enable Workers (free tier available)
3. Note your **Account ID** from dashboard

### KV Namespace

```bash
npx wrangler kv:namespace create UI_CACHE
```

Update `wrangler.jsonc` with the returned ID:
```jsonc
"kv_namespaces": [{ "binding": "UI_CACHE", "id": "<your-id>" }]
```

### R2 Bucket

```bash
npx wrangler r2 bucket create portfolio-assets
```

### AI Gateway

1. Go to Cloudflare Dashboard → AI → AI Gateway
2. Create gateway (e.g., `personal-website`)
3. Add OpenRouter as provider
4. Configure API key using [Bring Your Own Keys](https://developers.cloudflare.com/ai-gateway/configuration/bring-your-own-keys/)
5. Update `wrangler.jsonc`:
```jsonc
"vars": { "AI_GATEWAY_ID": "your-gateway-name" }
```

## Deploy

```bash
npm run deploy
```

This runs:
1. `npm run build` - TypeScript + Vite build
2. `npm run sync-assets` - Upload images to R2
3. `wrangler deploy` - Deploy worker to Cloudflare

## What Gets Deployed

| Output | Destination |
|--------|-------------|
| `dist/` | Cloudflare Workers (static assets) |
| `worker/index.ts` | Cloudflare Workers (edge runtime) |
| `public/assets/*` | R2 bucket |

## CI/CD

GitHub Actions workflows in `.github/workflows/`:

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | Push, PR | Build, lint, test, coverage |
| `e2e.yml` | Push, PR | Playwright E2E tests |
| `promptfoo.yml` | Push, PR, weekly | AI prompt evaluation |

### Required Secrets

Set in GitHub → Settings → Secrets:
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

## Custom Domain

In `wrangler.jsonc`:
```jsonc
"routes": [{ "pattern": "yourdomain.com", "custom_domain": true }]
```

Then in Cloudflare Dashboard:
1. Add domain to your account
2. Update DNS to point to Workers

## Configuration Reference

Key `wrangler.jsonc` settings:

```jsonc
{
  "name": "uetuluk-portfolio",
  "main": "worker/index.ts",
  "assets": {
    "directory": "./dist",
    "not_found_handling": "single-page-application"
  },
  "kv_namespaces": [{ "binding": "UI_CACHE", "id": "..." }],
  "r2_buckets": [{ "binding": "ASSETS", "bucket_name": "portfolio-assets" }],
  "vars": { "AI_GATEWAY_ID": "..." },
  "ai": { "binding": "AI" },
  "analytics_engine_datasets": [{ "binding": "FEEDBACK", "dataset": "feedback" }]
}
```

## Monitoring

- **Logs**: Cloudflare Dashboard → Workers → Logs
- **Analytics**: Dashboard → Workers → Analytics
- **Feedback**: Analytics Engine dataset `feedback`

## Caching

Layouts are cached in KV:
- Layout cache: 24 hours
- Intent categorization: 7 days
- Rate limiting: 5 minutes

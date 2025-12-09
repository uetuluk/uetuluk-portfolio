# GitHub Actions Setup

To run tests with real AI Gateway in CI, you need to add Cloudflare credentials to GitHub Secrets.

## Required Secrets

Go to **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

### 1. `CLOUDFLARE_API_TOKEN`

Create an API token with these permissions:
- Go to [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
- Click **Create Token**
- Use template: **Edit Cloudflare Workers**
- Add permissions:
  - Account - Workers Scripts - Edit
  - Account - Account Settings - Read
  - Zone - Workers Routes - Edit
- Click **Continue to summary** → **Create Token**
- Copy the token and add it to GitHub Secrets as `CLOUDFLARE_API_TOKEN`

### 2. `CLOUDFLARE_ACCOUNT_ID`

- Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
- Select your account
- Copy the **Account ID** from the right sidebar
- Add it to GitHub Secrets as `CLOUDFLARE_ACCOUNT_ID`

## Verify Setup

Once secrets are added, the CI workflow will:
1. Authenticate with Cloudflare using the API token
2. Run tests with access to the real `personal-website-test` AI Gateway
3. Upload coverage reports to Codecov

## Local Development

Local tests work automatically - no additional setup needed. The test environment uses:
- **KV Namespace**: In-memory (Miniflare)
- **R2 Bucket**: In-memory (Miniflare)
- **AI Gateway**: `personal-website-test` (requires Cloudflare account)

Run tests locally:
```bash
npm run test          # Run all tests
npm run test:coverage # Run tests with coverage
```

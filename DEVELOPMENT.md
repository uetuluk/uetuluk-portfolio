# Development

## Prerequisites

### Node.js

Required version: **v24.11.1**

```bash
nvm use  # Uses .nvmrc
```

### Cloudflare Account

1. Create account at [dash.cloudflare.com](https://dash.cloudflare.com)
2. Install Wrangler CLI: `npm install -g wrangler`
3. Login: `wrangler login`

### AI Gateway with OpenRouter

1. Get API key from [openrouter.ai](https://openrouter.ai)
2. Configure in Cloudflare AI Gateway using [Bring Your Own Keys](https://developers.cloudflare.com/ai-gateway/configuration/bring-your-own-keys/)

## Quick Start

```bash
# Install dependencies
npm install

# Configure wrangler.jsonc with your Cloudflare account ID

# Start development server
npm run dev
```

Development server runs at `http://localhost:5173` with hot reload.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run typecheck` | TypeScript type checking |

### Testing

| Command | Description |
|---------|-------------|
| `npm run test` | Run all unit tests |
| `npm run test:watch` | Tests in watch mode |
| `npm run test:coverage` | Tests with coverage report |
| `npm run test:frontend` | Frontend tests only |
| `npm run test:worker` | Worker tests only |
| `npm run test:e2e` | Playwright E2E tests |
| `npm run test:e2e:ui` | E2E with Playwright UI |
| `npm run test:prompts` | AI prompt evaluation |

### Code Quality

| Command | Description |
|---------|-------------|
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix lint issues |
| `npm run format` | Format with Prettier |
| `npm run format:check` | Check formatting |

## Project Structure

```
src/
├── components/
│   ├── sections/        # Portfolio section components
│   ├── ComponentMapper  # Maps AI JSON to components
│   ├── GeneratedPage    # Renders AI layout
│   └── WelcomeModal     # Visitor intent selection
├── content/
│   └── portfolio.json   # Your portfolio data
├── hooks/               # React hooks
├── lib/                 # Utilities
└── App.tsx              # Main component

worker/
├── index.ts             # API routes
├── prompts.ts           # AI prompts
└── types.ts             # TypeScript types
```

## Configuration

### Portfolio Content

Edit `src/content/portfolio.json`:

```json
{
  "personal": {
    "name": "Your Name",
    "title": "Your Title",
    "bio": "Your bio",
    "contact": { "email": "", "linkedin": "", "github": "" }
  },
  "projects": [...],
  "experience": [...],
  "skills": [...],
  "education": [...]
}
```

### Assets

Add images to `public/assets/`. Reference in portfolio.json as `/assets/filename.png`.

## Customization

### Add New Components

1. Create component in `src/components/sections/`
2. Add to `componentMap` in `ComponentMapper.tsx`
3. Update `SYSTEM_PROMPT` in `worker/prompts.ts`

### Modify AI Behavior

Edit `worker/prompts.ts`:
- Visitor personalization guidelines
- Component schemas
- Layout options

### Data Sources

The portfolio supports external data visualization through the DataChart component:

| Source | Endpoint | Description |
|--------|----------|-------------|
| GitHub Activity | `/api/github/activity` | Commit history from GitHub Events API |
| Weather | `/api/weather` | Weather forecasts from Open-Meteo API |
| Geocoding | `/api/geocode` | City name to coordinates conversion |

These APIs are cached in Cloudflare KV for performance.

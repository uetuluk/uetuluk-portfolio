# Development

## Prerequisites

### Node.js

Required version: **v24.11.1** (`engines` requires Node 24+)

```bash
nvm use  # Uses .nvmrc
```

### Toolchain notes

- **TypeScript 7** (the native compiler) provides `tsc`. TypeScript 7 has no programmatic API yet, so `typescript-eslint` uses TypeScript 6 through the `typescript` → `@typescript/typescript6` alias in `package.json` (binary `tsc6`). Keep both until typescript-eslint supports TypeScript 7.
- **ESLint 10**: `eslint-plugin-react` hasn't declared ESLint 10 support, so an `overrides` entry satisfies its peer range, and `eslint.config.js` sets the React version explicitly instead of `'detect'` (which calls an API ESLint 10 removed).
- **OpenUI telemetry**: `@openuidev/lang-core` sends anonymous install telemetry from its `postinstall` script. Set `OPENUI_TELEMETRY_DISABLED=1` to opt out. Runtime telemetry is off unless explicitly enabled, so nothing is sent from visitors' browsers or the Worker.

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

The AI binding always calls the real AI Gateway, even in dev. If the default environment's remote session is behind Cloudflare Access, run against the test environment instead: `CLOUDFLARE_ENV=test npm run dev`.

OpenUI's in-page inspector is off by default in dev; start with `VITE_OPENUI_DEVTOOLS=1 npm run dev` to enable it. It is never included in production builds.

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
│   ├── sections/           # Portfolio section components
│   │   ├── HeroSection     # Profile header
│   │   ├── ProjectCardGrid # Project showcase
│   │   ├── SkillBadgeList  # Skills display
│   │   ├── ExperienceTimeline # Work history
│   │   ├── ContactSection  # Contact links
│   │   ├── TextBlock       # Rich text
│   │   ├── ImageGallery    # Photo gallery
│   │   ├── StatsCounter    # Animated stats
│   │   ├── TechLogos       # Tech logos
│   │   └── DataChart       # Data visualization
│   ├── GeneratedPage       # Renders the streamed AI layout
│   ├── WelcomeModal        # Visitor intent selection
│   ├── ThemeToggle         # Dark/light mode toggle
│   ├── LanguageSwitcher    # i18n language selection
│   ├── FeedbackButtons     # User feedback
│   ├── LoadingScreen       # Loading state UI
│   ├── SEO                 # SEO meta tags
│   ├── StructuredData      # JSON-LD structured data
│   └── MosaicBackground    # Background visual
├── content/
│   └── portfolio.json      # Your portfolio data
├── genui/                  # Generative UI (OpenUI), shared with the Worker
│   ├── schema              # Component contract: Zod schemas for every component
│   ├── library             # React renderers for the contract
│   ├── sanitize            # Render-time prop validation
│   ├── protocol            # /api/generate event stream format
│   ├── useGeneratedLayout  # Streams a layout into React state
│   └── fallback            # Default layouts
├── hooks/
│   ├── useTheme            # Theme management
│   ├── useSessionId        # Session tracking
│   └── useTranslatedPortfolio # i18n portfolio hook
├── i18n/
│   └── locales/            # Language files (en, zh)
├── lib/
│   ├── utils               # General utilities
│   ├── palette             # Color palette utilities
│   ├── applyPalette        # Theme application
│   └── head                # Document head utilities
├── test/
│   └── setup.ts            # Global test setup
└── App.tsx                 # Main component

worker/
├── index.ts                # API routes and handlers
├── genui-stream.ts         # Model stream reading, layout parsing
├── prompts.ts              # AI prompts
└── types.ts                # TypeScript types
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

1. Create the component (in `src/components/sections/`, or reuse one from `@openuidev/react-ui`)
2. Add its Zod schema and a description to `componentDefinitions` in `src/genui/schema.ts`. The model sees the schema verbatim, so keep it strict
3. Add its renderer to `portfolioLibrary` in `src/genui/library.tsx`

The system prompt is generated from the schema, so there is nothing to update in `worker/prompts.ts`.

### Modify AI Behavior

- Components, props and allowed values: `src/genui/schema.ts`
- Visitor personalization guidelines, portfolio context and extra rules: `worker/prompts.ts`
- Model: `AI_MODEL` in `worker/index.ts`

### Data Sources

The portfolio supports external data visualization through the DataChart component:

| Source | Endpoint | Description |
|--------|----------|-------------|
| GitHub Activity | `/api/github/activity` | Commit history from GitHub Events API |
| Weather | `/api/weather` | Weather forecasts from Open-Meteo API |
| Geocoding | `/api/geocode` | City name to coordinates conversion |

These APIs are cached in Cloudflare KV for performance.

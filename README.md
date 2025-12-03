# AI-Personalized Portfolio

A portfolio website that uses AI (Qwen 3 via OpenRouter/Cloudflare AI Gateway) to dynamically generate personalized UI for each visitor based on their intent.

## Features

- **Generative UI**: AI creates custom layouts tailored to each visitor type
- **Visitor Classification**: Single question to identify visitor intent (Recruiter, Developer, Collaborator, Friend)
- **Component-Based Rendering**: AI outputs JSON config that maps to pre-built Shadcn/ui components
- **Edge-First Architecture**: Built on Cloudflare Workers for global performance
- **Caching**: KV-based caching per visitor category (when configured)

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS + Shadcn/ui
- **Backend**: Cloudflare Workers (via `@cloudflare/vite-plugin`)
- **AI**: Qwen 3 Coder Flash via OpenRouter through Cloudflare AI Gateway
- **Storage**: Cloudflare R2 (assets) + KV (cache)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Update `wrangler.jsonc` with your Cloudflare configuration:

```jsonc
{
  "vars": {
    "AI_GATEWAY_ACCOUNT_ID": "your-account-id",
    "AI_GATEWAY_ID": "your-gateway-id"
  }
}
```

Set your OpenRouter API key as a secret:

```bash
npx wrangler secret put OPENROUTER_API_KEY
```

### 3. Set Up Cloudflare Resources (Optional)

For caching support, create a KV namespace:

```bash
npx wrangler kv namespace create UI_CACHE
```

Then add the ID to `wrangler.jsonc`:

```jsonc
{
  "kv_namespaces": [
    { "binding": "UI_CACHE", "id": "your-kv-id" }
  ]
}
```

### 4. Configure AI Gateway

1. Go to Cloudflare Dashboard → AI → AI Gateway
2. Create a new gateway (e.g., "portfolio-gateway")
3. Add OpenRouter as a provider
4. Copy your Account ID and Gateway ID to `wrangler.jsonc`

### 5. Add Your Content

Update `src/content/portfolio.json` with your personal information:

- Personal details (name, title, bio, contact links)
- Projects (with IDs, descriptions, technologies, links)
- Experience (work history)
- Skills
- Education

Add your profile image and project screenshots to `public/assets/`.

### 6. Development

```bash
npm run dev
```

This runs the app locally with hot module replacement in the Cloudflare Workers runtime.

### 7. Deploy

```bash
npm run deploy
```

## Project Structure

```
uetuluk-portfolio/
├── src/
│   ├── components/
│   │   ├── sections/          # Portfolio section components
│   │   ├── WelcomeModal.tsx   # Visitor intent selection
│   │   ├── LoadingScreen.tsx  # Loading state
│   │   ├── GeneratedPage.tsx  # Renders AI layout
│   │   └── ComponentMapper.tsx # Maps JSON to components
│   ├── content/
│   │   └── portfolio.json     # Your portfolio data
│   ├── lib/utils.ts
│   ├── App.tsx
│   └── index.css
├── worker/
│   ├── index.ts               # API routes
│   ├── prompts.ts             # AI system/user prompts
│   └── types.ts               # TypeScript types
├── wrangler.jsonc
├── vite.config.ts
└── package.json
```

## How It Works

1. **Visitor arrives** → Welcome modal asks "What brings you here?"
2. **User selects category** → React calls `/api/generate`
3. **Worker receives request** → Checks KV cache
4. **Cache miss** → Calls AI Gateway → OpenRouter → Qwen 3
5. **AI returns JSON** → Component configuration with layout and sections
6. **Worker caches result** → Returns to frontend
7. **React renders** → ComponentMapper maps JSON to Shadcn components

## Available Components

The AI can use these pre-built section components:

| Component | Description |
|-----------|-------------|
| `Hero` | Profile header with image, title, subtitle, CTA |
| `CardGrid` | Project showcase grid (2-4 columns) |
| `SkillBadges` | Skills displayed as badges |
| `Timeline` | Work experience timeline |
| `ContactForm` | Contact links (email, LinkedIn, GitHub) |
| `TextBlock` | Rich text content block |
| `ImageGallery` | Photo gallery with lightbox |

## Customization

### Add New Components

1. Create component in `src/components/sections/`
2. Add to `componentMap` in `ComponentMapper.tsx`
3. Update `SYSTEM_PROMPT` in `worker/prompts.ts` with component schema

### Modify AI Behavior

Edit `worker/prompts.ts` to:
- Change visitor personalization guidelines
- Add new component types
- Modify layout options
- Adjust styling preferences

## Fallback Behavior

If AI generation fails or isn't configured, the app uses default layouts:
- Each visitor type has a pre-defined section order
- No external API calls required
- Graceful degradation with error messaging

## License

MIT

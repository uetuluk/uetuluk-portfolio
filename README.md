# AI-Personalized Portfolio

![CI](https://img.shields.io/github/actions/workflow/status/uetuluk/uetuluk-portfolio/ci.yml?style=flat-square)
![Coverage](https://img.shields.io/codecov/c/github/uetuluk/uetuluk-portfolio?style=flat-square)
![License](https://img.shields.io/github/license/uetuluk/uetuluk-portfolio?style=flat-square)
![Node](https://img.shields.io/badge/node-v24.11.1-brightgreen?style=flat-square)

A portfolio website that uses AI (Qwen 3 via OpenRouter/Cloudflare AI Gateway) to dynamically generate personalized UI for each visitor based on their intent.

## Features

- **Generative UI**: AI creates custom layouts tailored to each visitor type
- **Visitor Classification**: Single question to identify visitor intent (Recruiter, Developer, Collaborator, Friend)
- **Component-Based Rendering**: AI outputs JSON config that maps to pre-built Shadcn/ui components
- **Edge-First Architecture**: Built on Cloudflare Workers for global performance
- **Caching**: KV-based caching per visitor category

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS + Shadcn/ui
- **Backend**: Cloudflare Workers
- **AI**: Qwen 3 Coder Flash via OpenRouter through Cloudflare AI Gateway
- **Storage**: Cloudflare R2 (assets) + KV (cache)

## Documentation

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | System architecture and data flow diagrams |
| [DEVELOPMENT.md](DEVELOPMENT.md) | Development setup and workflow |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Deployment prerequisites and process |

## Quick Start

```bash
npm install
npm run dev
```

See [DEVELOPMENT.md](DEVELOPMENT.md) for full setup instructions.

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
| `StatsCounter` | Animated statistics display with counters |
| `TechLogos` | Technology logos in grid or marquee layout |
| `DataChart` | Data visualization with GitHub activity or weather data |

## Fallback Behavior

If AI generation fails or isn't configured, the app uses default layouts per visitor type with graceful degradation.

## License

MIT

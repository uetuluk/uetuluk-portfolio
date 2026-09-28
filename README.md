# AI-Personalized Portfolio

![CI](https://img.shields.io/github/actions/workflow/status/uetuluk/uetuluk-portfolio/ci.yml?style=flat-square)
![Coverage](https://img.shields.io/codecov/c/github/uetuluk/uetuluk-portfolio?style=flat-square)
![License](https://img.shields.io/github/license/uetuluk/uetuluk-portfolio?style=flat-square)
![Node](https://img.shields.io/badge/node-v24.11.1-brightgreen?style=flat-square)

A portfolio website that uses AI (Qwen 3.8 Flash via OpenRouter/Cloudflare AI Gateway) to dynamically generate personalized UI for each visitor based on their intent.

## Features

- **Generative UI with [OpenUI](https://www.openui.com/)**: AI composes each page from pre-built components, written in OpenUI Lang
- **Streaming**: Sections render progressively as the model writes them
- **Visitor Classification**: Single question to identify visitor intent (Recruiter, Developer, Collaborator, Friend)
- **Typed Component Contract**: One set of Zod schemas drives both the AI prompt and render-time validation
- **Edge-First Architecture**: Built on Cloudflare Workers for global performance
- **Caching**: KV-based caching per visitor category

## Tech Stack

- **Frontend**: React 19 + TypeScript 7 + Vite 8
- **Generative UI**: OpenUI (`@openuidev/react-lang`, `@openuidev/lang-core`, `@openuidev/react-ui`)
- **Styling**: Tailwind CSS 4 + Shadcn/ui
- **Backend**: Cloudflare Workers
- **AI**: Qwen 3.8 Flash via OpenRouter through Cloudflare AI Gateway
- **Storage**: Cloudflare R2 (assets) + KV (cache)

## Documentation

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | System architecture and data flow diagrams |
| [DEVELOPMENT.md](DEVELOPMENT.md) | Development setup and workflow |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Deployment prerequisites and process |
| [TESTING.md](TESTING.md) | Testing guide and coverage configuration |
| [SECURITY.md](SECURITY.md) | Security policy and vulnerability reporting |

## Quick Start

```bash
npm install
npm run dev
```

See [DEVELOPMENT.md](DEVELOPMENT.md) for full setup instructions.

## Available Components

The AI can use these components, defined in [`src/genui/schema.ts`](src/genui/schema.ts):

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
| `Callout` | Highlighted note, e.g. availability (from `@openuidev/react-ui`) |
| `FAQ` | Expandable questions and answers (from `@openuidev/react-ui`) |
| `Steps` | Numbered process, e.g. how a collaboration works (from `@openuidev/react-ui`) |

See [ARCHITECTURE.md](ARCHITECTURE.md#the-component-contract) for how to add one.

## Fallback Behavior

If AI generation fails or isn't configured, the app uses default layouts per visitor type with graceful degradation. If the stream is interrupted partway, the sections that already arrived stay on the page.

## License

MIT

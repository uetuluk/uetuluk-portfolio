# Architecture

This portfolio uses AI to generate personalized layouts at the edge. Visitors select their intent, and Cloudflare Workers calls an LLM to create a custom UI configuration that React renders using pre-built components.

## System Overview

```mermaid
flowchart LR
    Browser --> Workers[Cloudflare Workers]
    Workers --> KV[(KV Cache)]
    Workers --> R2[(R2 Assets)]
    Workers --> Gateway[AI Gateway]
    Gateway --> OpenRouter
    OpenRouter --> Qwen[Qwen 3]
```

**Components:**
- **Cloudflare Workers** - Edge runtime serving both API and static assets
- **KV** - Caches generated layouts by visitor type (24h TTL)
- **R2** - Stores static assets (images, favicon)
- **AI Gateway** - Routes and monitors LLM requests
- **OpenRouter** - LLM provider routing to Qwen 3 Coder Flash

## Frontend Architecture

```mermaid
flowchart TD
    App[App.tsx] --> Modal[WelcomeModal]
    App --> Loading[LoadingScreen]
    App --> Page[GeneratedPage]
    Page --> Mapper[ComponentMapper]
    Mapper --> Hero[HeroSection]
    Mapper --> Cards[ProjectCardGrid]
    Mapper --> Skills[SkillBadgeList]
    Mapper --> Timeline[ExperienceTimeline]
    Mapper --> Contact[ContactSection]
    Mapper --> Text[TextBlock]
    Mapper --> Gallery[ImageGallery]
```

**Flow:**
1. `App.tsx` manages state (visitor type, layout, loading)
2. `WelcomeModal` captures visitor intent
3. `GeneratedPage` receives AI-generated layout JSON
4. `ComponentMapper` dynamically renders section components

## API Request Flow

```mermaid
sequenceDiagram
    participant Browser
    participant Worker
    participant KV
    participant AI

    Browser->>Worker: POST /api/generate
    Worker->>Worker: Extract visitor context
    Worker->>KV: Check cache
    alt Cache hit
        KV-->>Worker: Return cached layout
    else Cache miss
        Worker->>AI: Generate layout
        AI-->>Worker: JSON layout
        Worker->>Worker: Validate links
        Worker->>KV: Store layout
    end
    Worker-->>Browser: GeneratedLayout JSON
```

## Key Files

| File | Purpose |
|------|---------|
| `worker/index.ts` | API endpoints, caching, rate limiting |
| `worker/prompts.ts` | System and user prompts for AI |
| `src/App.tsx` | Main React component, state management |
| `src/components/ComponentMapper.tsx` | Maps AI JSON to React components |
| `src/components/sections/*` | Pre-built portfolio section components |
| `src/content/portfolio.json` | Portfolio data (projects, skills, etc.) |

## Data Flow

```
portfolio.json → Worker prompt → AI → GeneratedLayout JSON → ComponentMapper → React UI
```

1. **Portfolio content** is embedded in the AI system prompt
2. **AI generates** a `GeneratedLayout` with layout type, theme, and sections array
3. **Each section** has a `type` (component name) and `props` (configuration)
4. **ComponentMapper** looks up the component and passes props
5. **React renders** the personalized portfolio

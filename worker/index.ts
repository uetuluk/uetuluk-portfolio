import type {
  Env,
  GenerateRequest,
  GeneratedLayout,
  AIGatewayResponse,
} from "./types";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompts";

// Extract links from generated layout for validation
function extractLinks(layout: GeneratedLayout): string[] {
  const links: string[] = [];
  for (const section of layout.sections) {
    // Hero CTA
    if (
      section.type === "Hero" &&
      section.props.cta &&
      typeof section.props.cta === "object" &&
      "href" in section.props.cta
    ) {
      links.push(section.props.cta.href as string);
    }
  }
  return links;
}

// Validate a link by fetching it (3 second timeout)
async function validateLink(url: string): Promise<boolean> {
  try {
    // Skip mailto: links
    if (url.startsWith("mailto:")) return true;

    // Skip relative paths (internal assets)
    if (url.startsWith("/")) return true;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}

// Remove invalid links from layout
function sanitizeLayout(
  layout: GeneratedLayout,
  invalidLinks: Set<string>
): GeneratedLayout {
  return {
    ...layout,
    sections: layout.sections.map((section) => {
      if (
        section.type === "Hero" &&
        section.props.cta &&
        typeof section.props.cta === "object" &&
        "href" in section.props.cta
      ) {
        if (invalidLinks.has(section.props.cta.href as string)) {
          // Remove invalid CTA
          const { cta, ...restProps } = section.props;
          return { ...section, props: restProps };
        }
      }
      return section;
    }),
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Handle API routes
    if (url.pathname.startsWith("/api/")) {
      return handleApiRequest(request, env, url);
    }

    // For non-API routes, let the assets handler serve static files
    // The Vite plugin handles this automatically
    return new Response("Not found", { status: 404 });
  },
};

async function handleApiRequest(
  request: Request,
  env: Env,
  url: URL
): Promise<Response> {
  // CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  // Handle preflight requests
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // POST /api/generate - Generate personalized UI
    if (url.pathname === "/api/generate" && request.method === "POST") {
      return handleGenerate(request, env, corsHeaders);
    }

    // GET /api/health - Health check
    if (url.pathname === "/api/health" && request.method === "GET") {
      return new Response(JSON.stringify({ status: "ok" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("API error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
}

async function handleGenerate(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const body = (await request.json()) as GenerateRequest;
  const { visitorTag, customIntent, portfolioContent } = body;

  if (!visitorTag || !portfolioContent) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Check cache first (when KV is configured)
  // const cacheKey = `ui-${visitorTag}`;
  // const cached = await env.UI_CACHE?.get(cacheKey);
  // if (cached) {
  //   return new Response(cached, {
  //     headers: { ...corsHeaders, "Content-Type": "application/json" },
  //   });
  // }

  // Check if AI Gateway is configured
  if (!env.AI || !env.AI_GATEWAY_ID) {
    console.warn("AI Gateway not configured, returning default layout");
    return new Response(
      JSON.stringify(getDefaultLayout(visitorTag, portfolioContent)),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    // Call AI Gateway -> OpenRouter (BYOK handles API key automatically)
    const gateway = env.AI.gateway(env.AI_GATEWAY_ID);

    const aiResponse = await gateway.run({
      provider: "openrouter",
      endpoint: "chat/completions",
      headers: {
        "Content-Type": "application/json",
      },
      query: {
        model: "qwen/qwen3-coder-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: buildUserPrompt(visitorTag, customIntent, portfolioContent),
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "generated_layout",
            strict: true,
            schema: {
              type: "object",
              properties: {
                layout: {
                  type: "string",
                  enum: ["single-column", "two-column", "hero-focused"],
                },
                theme: {
                  type: "object",
                  properties: {
                    accent: { type: "string" },
                  },
                  required: ["accent"],
                  additionalProperties: false,
                },
                sections: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      type: { type: "string" },
                      props: { type: "object" },
                    },
                    required: ["type", "props"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["layout", "theme", "sections"],
              additionalProperties: false,
            },
          },
        },
      },
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);
      throw new Error(`AI Gateway returned ${aiResponse.status}`);
    }

    const aiData = (await aiResponse.json()) as AIGatewayResponse;

    // Extract the generated layout from the response
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse the JSON response (structured output guarantees valid JSON)
    let generatedLayout: GeneratedLayout;
    try {
      generatedLayout = JSON.parse(content);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Invalid JSON in AI response");
    }

    // Validate the layout structure
    if (!generatedLayout.layout || !generatedLayout.sections) {
      throw new Error("Invalid layout structure");
    }

    // Validate and sanitize links
    const links = extractLinks(generatedLayout);
    if (links.length > 0) {
      const invalidLinks = new Set<string>();

      await Promise.all(
        links.map(async (link) => {
          const isValid = await validateLink(link);
          if (!isValid) invalidLinks.add(link);
        })
      );

      if (invalidLinks.size > 0) {
        console.warn("Removed invalid links:", [...invalidLinks]);
        generatedLayout = sanitizeLayout(generatedLayout, invalidLinks);
      }
    }

    // Cache the result (when KV is configured)
    // await env.UI_CACHE?.put(cacheKey, JSON.stringify(generatedLayout), {
    //   expirationTtl: 86400, // 24 hours
    // });

    return new Response(JSON.stringify(generatedLayout), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Generation error:", error);

    // Fall back to default layout on error
    return new Response(
      JSON.stringify(getDefaultLayout(visitorTag, portfolioContent)),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
}

// Default layout when AI generation fails or is not configured
function getDefaultLayout(
  visitorTag: string,
  portfolioContent: GenerateRequest["portfolioContent"]
): GeneratedLayout {
  const projectIds = portfolioContent.projects.map((p) => p.id);
  const { personal } = portfolioContent;

  const baseLayout: GeneratedLayout = {
    layout: "hero-focused",
    theme: { accent: "blue" },
    sections: [
      {
        type: "Hero",
        props: {
          title: personal.name,
          subtitle: personal.title,
          image: "/assets/profile.png",
        },
      },
    ],
  };

  switch (visitorTag) {
    case "recruiter":
      baseLayout.sections[0].props = {
        ...baseLayout.sections[0].props,
        cta: personal.resumeUrl
          ? { text: "View Resume", href: personal.resumeUrl }
          : undefined,
      };
      baseLayout.sections.push(
        {
          type: "SkillBadges",
          props: { title: "Technical Skills", style: "detailed" },
        },
        {
          type: "Timeline",
          props: { title: "Experience" },
        },
        {
          type: "CardGrid",
          props: {
            title: "Featured Projects",
            columns: 2,
            items: projectIds.slice(0, 4),
          },
        }
      );
      break;

    case "developer":
      baseLayout.layout = "two-column";
      baseLayout.sections.push(
        {
          type: "CardGrid",
          props: { title: "Projects", columns: 3, items: projectIds },
        },
        {
          type: "SkillBadges",
          props: { title: "Tech Stack", style: "detailed" },
        },
        {
          type: "ContactForm",
          props: { title: "Connect", showGitHub: true, showEmail: true },
        }
      );
      break;

    case "collaborator":
      baseLayout.sections.push(
        {
          type: "TextBlock",
          props: {
            title: "About Me",
            content: personal.bio,
            style: "prose",
          },
        },
        {
          type: "CardGrid",
          props: {
            title: "Current Projects",
            columns: 2,
            items: projectIds.slice(0, 2),
          },
        },
        {
          type: "ContactForm",
          props: {
            title: "Let's Collaborate",
            showEmail: true,
            showLinkedIn: true,
            showGitHub: true,
          },
        }
      );
      break;

    case "friend":
    default:
      baseLayout.layout = "single-column";
      baseLayout.sections.push(
        {
          type: "TextBlock",
          props: {
            title: "Hey there!",
            content: personal.bio,
            style: "prose",
          },
        },
        {
          type: "ImageGallery",
          props: { title: "Photos", images: [] },
        },
        {
          type: "ContactForm",
          props: { title: "Get in Touch", showEmail: true },
        }
      );
      break;
  }

  return baseLayout;
}

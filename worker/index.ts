import type {
  Env,
  GenerateRequest,
  GeneratedLayout,
  AIGatewayResponse,
  CategorizationResult,
  StoredTag,
  FeedbackRequest,
  FeedbackResponse,
  RateLimitEntry,
  VisitorContext,
  UIHints,
  GitHubEvent,
  GitHubActivityResponse,
  GeocodingResult,
  OpenMeteoGeocodingResponse,
  GitHubDataSummary,
  WeatherDataSummary,
  DataSummaries,
  OpenMeteoDailyResponse,
  WeatherMinMaxResponse,
  PortfolioContent,
} from './types';

// Rate limiting configuration
export const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
export const RATE_LIMIT_KEY_PREFIX = 'ratelimit:';

// Security: Maximum payload size (50KB)
export const MAX_BODY_SIZE = 50 * 1024;

// Security: Allowed CORS origins
const ALLOWED_ORIGINS = [
  'https://uetuluk.com',
  'https://www.uetuluk.com',
];

// Check if origin is allowed (supports wildcards for workers.dev and localhost)
function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;

  // Exact match for production domains
  if (ALLOWED_ORIGINS.includes(origin)) return true;

  // Wildcard match for *.uetuluk.workers.dev
  if (/^https:\/\/[a-z0-9-]+\.uetuluk\.workers\.dev$/.test(origin)) return true;

  // Allow localhost with any port for development
  if (/^http:\/\/localhost(:\d+)?$/.test(origin)) return true;

  return false;
}

// Get CORS headers with origin validation
function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('Origin');
  const allowedOrigin = isOriginAllowed(origin) ? origin! : ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}

// Security: Validate GitHub username format
// GitHub usernames: alphanumeric, hyphens, max 39 chars, can't start/end with hyphen
function isValidGitHubUsername(username: string): boolean {
  if (!username || username.length > 39) return false;
  return /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/.test(username);
}

// Security: Validate session ID format (UUID or alphanumeric, max 64 chars)
function isValidSessionId(sessionId: string): boolean {
  if (!sessionId || sessionId.length > 64) return false;
  // Accept UUIDs or alphanumeric strings with hyphens/underscores
  return /^[a-zA-Z0-9_-]+$/.test(sessionId);
}

// Security: Runtime validation for GenerateRequest
interface ValidationResult {
  valid: boolean;
  error?: string;
}

function validateGenerateRequest(body: unknown): ValidationResult {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }

  const req = body as Record<string, unknown>;

  // Check visitorTag
  if (typeof req.visitorTag !== 'string' || req.visitorTag.length > 50) {
    return { valid: false, error: 'Invalid visitorTag' };
  }

  // Check optional customIntent
  if (req.customIntent !== undefined && typeof req.customIntent !== 'string') {
    return { valid: false, error: 'Invalid customIntent' };
  }

  // Check portfolioContent exists and is an object
  if (!req.portfolioContent || typeof req.portfolioContent !== 'object') {
    return { valid: false, error: 'Invalid portfolioContent' };
  }

  const portfolio = req.portfolioContent as Record<string, unknown>;

  // Validate required portfolioContent fields
  if (!portfolio.personal || typeof portfolio.personal !== 'object') {
    return { valid: false, error: 'Invalid portfolioContent.personal' };
  }

  if (!Array.isArray(portfolio.projects)) {
    return { valid: false, error: 'Invalid portfolioContent.projects' };
  }

  if (!Array.isArray(portfolio.experience)) {
    return { valid: false, error: 'Invalid portfolioContent.experience' };
  }

  if (!Array.isArray(portfolio.skills)) {
    return { valid: false, error: 'Invalid portfolioContent.skills' };
  }

  if (!Array.isArray(portfolio.education)) {
    return { valid: false, error: 'Invalid portfolioContent.education' };
  }

  return { valid: true };
}

// Security: Runtime validation for FeedbackRequest
function validateFeedbackRequest(body: unknown): ValidationResult {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }

  const req = body as Record<string, unknown>;

  // Check feedbackType is valid enum
  if (req.feedbackType !== 'like' && req.feedbackType !== 'dislike') {
    return { valid: false, error: 'Invalid feedbackType' };
  }

  // Check audienceType
  if (typeof req.audienceType !== 'string' || req.audienceType.length > 50) {
    return { valid: false, error: 'Invalid audienceType' };
  }

  // Check sessionId
  if (typeof req.sessionId !== 'string') {
    return { valid: false, error: 'Invalid sessionId' };
  }

  // cacheKey is optional
  if (req.cacheKey !== undefined && typeof req.cacheKey !== 'string') {
    return { valid: false, error: 'Invalid cacheKey' };
  }

  return { valid: true };
}

// Generate endpoint rate limiting (stricter)
export const GENERATE_RATE_LIMIT_MAX = 3; // 3 requests per window
export const GENERATE_RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

// ============ Visitor Context Extraction ============

// Parse User-Agent to extract device type, browser, and OS (no external deps)
export function parseUserAgent(ua: string | null): VisitorContext['device'] {
  if (!ua) {
    return { type: 'desktop' };
  }

  // Device type detection
  let type: 'mobile' | 'tablet' | 'desktop' = 'desktop';
  if (/mobile|iphone|ipod|android.*mobile|windows phone|blackberry/i.test(ua)) {
    type = 'mobile';
  } else if (/tablet|ipad|android(?!.*mobile)|kindle|silk/i.test(ua)) {
    type = 'tablet';
  }

  // Browser detection (order matters - check specific before generic)
  let browser: string | undefined;
  if (/edg\//i.test(ua)) browser = 'Edge';
  else if (/opera|opr\//i.test(ua)) browser = 'Opera';
  else if (/chrome|crios/i.test(ua) && !/edg\//i.test(ua)) browser = 'Chrome';
  else if (/firefox|fxios/i.test(ua)) browser = 'Firefox';
  else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) browser = 'Safari';

  // OS detection
  let os: string | undefined;
  if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/windows/i.test(ua)) os = 'Windows';
  else if (/macintosh|mac os x/i.test(ua)) os = 'macOS';
  else if (/linux/i.test(ua)) os = 'Linux';

  return { type, browser, os };
}

// Calculate time context from visitor's timezone
export function getTimeContext(timezone?: string): VisitorContext['time'] {
  let localHour: number;
  let isWeekend: boolean;

  try {
    if (timezone) {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: 'numeric',
        hour12: false,
        weekday: 'short',
      });
      const parts = formatter.formatToParts(now);
      localHour = parseInt(parts.find((p) => p.type === 'hour')?.value || '12', 10);
      const weekday = parts.find((p) => p.type === 'weekday')?.value || '';
      isWeekend = weekday === 'Sat' || weekday === 'Sun';
    } else {
      // Fallback to UTC
      const now = new Date();
      localHour = now.getUTCHours();
      isWeekend = now.getUTCDay() === 0 || now.getUTCDay() === 6;
    }
  } catch {
    // Invalid timezone, use UTC
    const now = new Date();
    localHour = now.getUTCHours();
    isWeekend = now.getUTCDay() === 0 || now.getUTCDay() === 6;
  }

  // Determine time of day
  let timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  if (localHour >= 5 && localHour < 12) timeOfDay = 'morning';
  else if (localHour >= 12 && localHour < 17) timeOfDay = 'afternoon';
  else if (localHour >= 17 && localHour < 21) timeOfDay = 'evening';
  else timeOfDay = 'night';

  return { localHour, timeOfDay, isWeekend };
}

// Extract full visitor context from Cloudflare request
export function extractVisitorContext(request: Request): VisitorContext {
  const cf = request.cf as IncomingRequestCfProperties | undefined;
  const userAgent = request.headers.get('User-Agent');

  const device = parseUserAgent(userAgent);
  const timezone = cf?.timezone;
  const time = getTimeContext(timezone);

  return {
    geo: {
      country: cf?.country as string | undefined,
      city: cf?.city as string | undefined,
      continent: cf?.continent as string | undefined,
      timezone: timezone,
      region: cf?.region as string | undefined,
      isEUCountry: cf?.isEUCountry === '1',
    },
    device,
    time,
    network: {
      httpProtocol: cf?.httpProtocol || 'HTTP/1.1',
      colo: cf?.colo || 'unknown',
    },
  };
}

// Derive UI hints from visitor context
export function deriveUIHints(context: VisitorContext): UIHints {
  // Suggest dark theme for evening/night hours
  let suggestedTheme: 'light' | 'dark' | 'system' = 'system';
  if (context.time.timeOfDay === 'evening' || context.time.timeOfDay === 'night') {
    suggestedTheme = 'dark';
  } else if (context.time.timeOfDay === 'morning') {
    suggestedTheme = 'light';
  }

  // Prefer compact layout for mobile devices
  const preferCompactLayout = context.device.type === 'mobile';

  return {
    suggestedTheme,
    preferCompactLayout,
  };
}

// ============ End Visitor Context Extraction ============

import {
  buildSystemPrompt,
  buildUserPrompt,
  buildCategorizationPrompt,
  buildCategorizationUserPrompt,
  ALLOWED_VISITOR_TAGS,
  TAG_GUIDELINES,
} from './prompts';

// Extract links from generated layout for validation
export function extractLinks(layout: GeneratedLayout): string[] {
  const links: string[] = [];
  for (const section of layout.sections) {
    // Hero CTA
    if (
      section.type === 'Hero' &&
      section.props.cta &&
      typeof section.props.cta === 'object' &&
      'href' in section.props.cta
    ) {
      links.push(section.props.cta.href as string);
    }
  }
  return links;
}

// Security: Check if a URL is safe to fetch (SSRF protection)
function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);

    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();

    // Block localhost and loopback
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname === '0.0.0.0' ||
      hostname.endsWith('.localhost')
    ) {
      return false;
    }

    // Block private IP ranges (RFC 1918)
    // 10.0.0.0 - 10.255.255.255
    // 172.16.0.0 - 172.31.255.255
    // 192.168.0.0 - 192.168.255.255
    // 169.254.0.0 - 169.254.255.255 (link-local)
    const ipv4Match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (ipv4Match) {
      const [, a, b] = ipv4Match.map(Number);
      if (
        a === 10 || // 10.x.x.x
        (a === 172 && b >= 16 && b <= 31) || // 172.16-31.x.x
        (a === 192 && b === 168) || // 192.168.x.x
        (a === 169 && b === 254) || // 169.254.x.x (link-local)
        a === 127 // 127.x.x.x
      ) {
        return false;
      }
    }

    // Block internal/cloud metadata endpoints
    const blockedHosts = [
      'metadata.google.internal',
      'metadata.google',
      '169.254.169.254', // AWS/GCP metadata
      'metadata',
    ];
    if (blockedHosts.includes(hostname)) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

// Validate a link by fetching it (3 second timeout)
export async function validateLink(url: string): Promise<boolean> {
  try {
    // Skip mailto: links
    if (url.startsWith('mailto:')) return true;

    // Skip relative paths (internal assets)
    if (url.startsWith('/')) return true;

    // Security: SSRF protection - validate URL before fetching
    if (!isSafeUrl(url)) {
      console.warn('Blocked unsafe URL:', url);
      return false;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'manual', // Don't follow redirects automatically (could redirect to internal)
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // For redirects, validate the redirect target as well
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('Location');
      if (location && !isSafeUrl(location)) {
        console.warn('Blocked redirect to unsafe URL:', location);
        return false;
      }
    }

    return response.ok || (response.status >= 300 && response.status < 400);
  } catch {
    return false;
  }
}

// Remove invalid links from layout
export function sanitizeLayout(
  layout: GeneratedLayout,
  invalidLinks: Set<string>,
): GeneratedLayout {
  return {
    ...layout,
    sections: layout.sections.map((section) => {
      if (
        section.type === 'Hero' &&
        section.props.cta &&
        typeof section.props.cta === 'object' &&
        'href' in section.props.cta
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

// Simple hash function for cache keys
export function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

// Get default categorization result (fallback to friend)
export function getDefaultCategorizationResult(): CategorizationResult {
  return {
    status: 'matched',
    tagName: 'friend',
    displayName: 'Friend',
    guidelines: TAG_GUIDELINES.friend,
    confidence: 1,
    reason: 'Default fallback',
  };
}

// Validate and sanitize categorization result
export function sanitizeCategorizationResult(result: CategorizationResult): CategorizationResult {
  // Sanitize tag name: lowercase, alphanumeric with hyphens only, max 20 chars
  let tagName = result.tagName
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 20);

  // If empty after sanitization, use friend
  if (!tagName) {
    tagName = 'friend';
  }

  // If matched to existing tag, use canonical name and guidelines
  if (result.status === 'matched' && ALLOWED_VISITOR_TAGS.includes(tagName)) {
    return {
      ...result,
      tagName,
      guidelines: TAG_GUIDELINES[tagName] || result.guidelines,
    };
  }

  // For rejected, always use friend
  if (result.status === 'rejected') {
    return {
      ...result,
      tagName: 'friend',
      guidelines: TAG_GUIDELINES.friend,
    };
  }

  return {
    ...result,
    tagName,
    confidence: Math.min(1, Math.max(0, result.confidence)),
  };
}

// Store a new tag in KV for future reuse
export async function storeNewTag(
  result: CategorizationResult,
  originalIntent: string,
  env: Env,
): Promise<void> {
  if (!env.UI_CACHE) return;

  const tagKey = `tag:${result.tagName}`;

  // Check if tag already exists
  const existing = await env.UI_CACHE.get(tagKey);
  if (existing) return;

  const storedTag: StoredTag = {
    tagName: result.tagName,
    displayName: result.displayName,
    guidelines: result.guidelines,
    createdAt: new Date().toISOString(),
    mappedFrom: originalIntent,
    isCustom: true,
  };

  await env.UI_CACHE.put(tagKey, JSON.stringify(storedTag), {
    expirationTtl: 86400 * 30, // 30 days
  });
}

// Categorize a custom intent using LLM
export async function categorizeIntent(
  customIntent: string,
  env: Env,
): Promise<CategorizationResult> {
  // Check intent cache first
  if (env.UI_CACHE) {
    const normalizedIntent = customIntent.toLowerCase().trim().slice(0, 50);
    const intentCacheKey = `intent:${hashString(normalizedIntent)}`;

    const cachedResult = await env.UI_CACHE.get(intentCacheKey, 'json');
    if (cachedResult) {
      return cachedResult as CategorizationResult;
    }
  }

  // Check if AI Gateway is configured
  if (!env.AI || !env.AI_GATEWAY_ID) {
    return getDefaultCategorizationResult();
  }

  try {
    const gateway = env.AI.gateway(env.AI_GATEWAY_ID);

    const response = await gateway.run({
      provider: 'openrouter',
      endpoint: 'chat/completions',
      headers: { 'Content-Type': 'application/json' },
      query: {
        model: 'qwen/qwen3-coder-flash',
        messages: [
          { role: 'system', content: buildCategorizationPrompt() },
          { role: 'user', content: buildCategorizationUserPrompt(customIntent) },
        ],
        temperature: 0.3, // Lower temperature for consistent categorization
        max_tokens: 1000,
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'categorization_result',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                status: {
                  type: 'string',
                  enum: ['matched', 'new_tag', 'rejected'],
                },
                tagName: { type: 'string' },
                displayName: { type: 'string' },
                guidelines: { type: 'string' },
                confidence: { type: 'number' },
                reason: { type: 'string' },
              },
              required: ['status', 'tagName', 'displayName', 'guidelines', 'confidence'],
              additionalProperties: false,
            },
          },
        },
      },
    });

    if (!response.ok) {
      console.error('Categorization API error:', response.status);
      return getDefaultCategorizationResult();
    }

    const data = (await response.json()) as AIGatewayResponse;
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return getDefaultCategorizationResult();
    }

    const result = JSON.parse(content) as CategorizationResult;
    const sanitizedResult = sanitizeCategorizationResult(result);

    // Cache the result
    if (env.UI_CACHE) {
      const normalizedIntent = customIntent.toLowerCase().trim().slice(0, 50);
      const intentCacheKey = `intent:${hashString(normalizedIntent)}`;

      await env.UI_CACHE.put(intentCacheKey, JSON.stringify(sanitizedResult), {
        expirationTtl: 86400 * 7, // 7 days
      });
    }

    // Store new tag for future reuse
    if (sanitizedResult.status === 'new_tag') {
      await storeNewTag(sanitizedResult, customIntent, env);
    }

    return sanitizedResult;
  } catch (error) {
    console.error('Categorization error:', error);
    return getDefaultCategorizationResult();
  }
}

export default {
  async fetch(request: Request, env: Env, _ctx?: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Serve public folder assets from R2
    if (url.pathname.startsWith('/assets/') || url.pathname === '/favicon.ico') {
      const key = url.pathname.slice(1); // Remove leading slash
      const object = await env.ASSETS.get(key);

      if (object) {
        const headers = new Headers();
        headers.set('Content-Type', object.httpMetadata?.contentType || 'application/octet-stream');
        headers.set('Cache-Control', 'public, max-age=31536000');
        headers.set('ETag', object.httpEtag);
        return new Response(object.body, { headers });
      }
    }

    // Handle API routes
    if (url.pathname.startsWith('/api/')) {
      return handleApiRequest(request, env, url);
    }

    // For non-API routes, let the assets handler serve static files
    // The Vite plugin handles this automatically
    return new Response('Not found', { status: 404 });
  },
};

async function handleApiRequest(request: Request, env: Env, url: URL): Promise<Response> {
  // CORS headers with origin validation
  const corsHeaders = getCorsHeaders(request);

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Security: Check payload size for POST requests
  if (request.method === 'POST') {
    const contentLength = parseInt(request.headers.get('Content-Length') || '0');
    if (contentLength > MAX_BODY_SIZE) {
      return new Response(JSON.stringify({ error: 'Payload too large' }), {
        status: 413,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  try {
    // POST /api/generate - Generate personalized UI
    if (url.pathname === '/api/generate' && request.method === 'POST') {
      return handleGenerate(request, env, corsHeaders);
    }

    // GET /api/health - Health check
    if (url.pathname === '/api/health' && request.method === 'GET') {
      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST /api/feedback - Handle like/dislike feedback
    if (url.pathname === '/api/feedback' && request.method === 'POST') {
      return handleFeedback(request, env, corsHeaders);
    }

    // GET /api/github/activity - GitHub contribution data
    if (url.pathname === '/api/github/activity' && request.method === 'GET') {
      return handleGitHubActivity(request, env, corsHeaders, url);
    }

    // GET /api/weather - Weather data from Open-Meteo
    if (url.pathname === '/api/weather' && request.method === 'GET') {
      return handleWeather(request, env, corsHeaders, url);
    }

    // GET /api/geocode - City name to coordinates
    if (url.pathname === '/api/geocode' && request.method === 'GET') {
      return handleGeocode(request, env, corsHeaders, url);
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    // Log full error server-side, return generic message to client
    console.error('API error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
}

async function handleGenerate(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Security: Validate request structure
  const validation = validateGenerateRequest(body);
  if (!validation.valid) {
    return new Response(JSON.stringify({ error: validation.error }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { visitorTag, customIntent, portfolioContent } = body as GenerateRequest;

  // Check rate limit (IP-based, 3 requests per minute)
  const clientIP = getClientIP(request);

  // Security: Reject requests without identifiable IP
  if (!clientIP) {
    return new Response(JSON.stringify({ error: 'Unable to identify client' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const rateLimitResult = await checkGenerateRateLimit(clientIP, env);

  if (rateLimitResult.limited) {
    // Return default layout with rateLimited flag (no error, just fallback)
    const defaultLayout = getDefaultLayout(visitorTag, portfolioContent);
    return new Response(
      JSON.stringify({
        ...defaultLayout,
        _rateLimited: true,
        _retryAfter: rateLimitResult.retryAfter,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }

  // Update rate limit counter
  await updateGenerateRateLimit(clientIP, env);

  // Extract visitor context from Cloudflare request and user agent
  const visitorContext = extractVisitorContext(request);
  const uiHints = deriveUIHints(visitorContext);

  // Pre-fetch data summaries for AI context (run in parallel)
  const githubUsername = extractGitHubUsername(portfolioContent);
  const [githubSummary, weatherSummary] = await Promise.all([
    fetchGitHubSummary(githubUsername, env),
    fetchWeatherSummary(visitorContext, env),
  ]);

  const dataSummaries: DataSummaries = {
    github: githubSummary,
    weather: weatherSummary,
  };

  // Step 1: Categorize custom intent if provided
  let effectiveTag = visitorTag;
  let customGuidelines: { tagName: string; guidelines: string } | undefined;
  let categorizationInfo: Partial<CategorizationResult> | undefined;

  if (customIntent && customIntent.trim()) {
    try {
      const categorization = await categorizeIntent(customIntent, env);

      effectiveTag = categorization.tagName;
      categorizationInfo = {
        status: categorization.status,
        tagName: categorization.tagName,
        displayName: categorization.displayName,
        confidence: categorization.confidence,
      };

      // For new tags, include the custom guidelines
      if (
        categorization.status === 'new_tag' ||
        !ALLOWED_VISITOR_TAGS.includes(categorization.tagName)
      ) {
        customGuidelines = {
          tagName: categorization.tagName,
          guidelines: categorization.guidelines,
        };
      }

      // Log rejected intents for monitoring
      if (categorization.status === 'rejected') {
        console.warn('Rejected intent:', customIntent, 'Reason:', categorization.reason);
      }
    } catch (error) {
      console.error('Categorization error:', error);
      // Continue with original visitorTag on error
    }
  }

  // Step 2: Check layout cache (include visitor context in cache key)
  const contextHash = hashString(
    `${visitorContext.device.type}:${visitorContext.time.timeOfDay}:${visitorContext.geo.country || 'XX'}`,
  );
  const cacheKey = `layout:${effectiveTag}:${
    customGuidelines ? hashString(customGuidelines.guidelines) : 'default'
  }:${contextHash}`;

  if (env.UI_CACHE) {
    const cachedLayout = await env.UI_CACHE.get(cacheKey, 'json');
    if (cachedLayout) {
      return new Response(
        JSON.stringify({
          ...(cachedLayout as GeneratedLayout),
          _categorization: categorizationInfo,
          _visitorContext: {
            geo: { country: visitorContext.geo.country, city: visitorContext.geo.city },
            device: { type: visitorContext.device.type },
            time: { timeOfDay: visitorContext.time.timeOfDay },
          },
          _uiHints: uiHints,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }
  }

  // Check if AI Gateway is configured
  if (!env.AI || !env.AI_GATEWAY_ID) {
    console.warn('AI Gateway not configured, returning default layout');
    return new Response(
      JSON.stringify({
        ...getDefaultLayout(effectiveTag, portfolioContent),
        _categorization: categorizationInfo,
        _visitorContext: {
          geo: { country: visitorContext.geo.country, city: visitorContext.geo.city },
          device: { type: visitorContext.device.type },
          time: { timeOfDay: visitorContext.time.timeOfDay },
        },
        _uiHints: uiHints,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }

  try {
    // Step 3: Generate layout with categorized tag and custom guidelines
    const gateway = env.AI.gateway(env.AI_GATEWAY_ID);

    const aiResponse = await gateway.run({
      provider: 'openrouter',
      endpoint: 'chat/completions',
      headers: {
        'Content-Type': 'application/json',
      },
      query: {
        model: 'qwen/qwen3-coder-flash',
        messages: [
          {
            role: 'system',
            content: buildSystemPrompt(portfolioContent, customGuidelines, visitorContext, dataSummaries),
          },
          {
            role: 'user',
            content: buildUserPrompt(effectiveTag, customIntent, visitorContext),
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'generated_layout',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                layout: {
                  type: 'string',
                  enum: ['single-column', 'two-column', 'hero-focused'],
                },
                theme: {
                  type: 'object',
                  properties: {
                    accent: { type: 'string' },
                  },
                  required: ['accent'],
                  additionalProperties: false,
                },
                sections: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      type: { type: 'string' },
                      props: { type: 'object' },
                    },
                    required: ['type', 'props'],
                    additionalProperties: false,
                  },
                },
              },
              required: ['layout', 'theme', 'sections'],
              additionalProperties: false,
            },
          },
        },
      },
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);
      throw new Error(`AI Gateway returned ${aiResponse.status}`);
    }

    const aiData = (await aiResponse.json()) as AIGatewayResponse;

    // Extract the generated layout from the response
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in AI response');
    }

    // Parse the JSON response (structured output guarantees valid JSON)
    let generatedLayout: GeneratedLayout;
    try {
      generatedLayout = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Invalid JSON in AI response');
    }

    // Validate the layout structure
    if (!generatedLayout.layout || !generatedLayout.sections) {
      throw new Error('Invalid layout structure');
    }

    // Validate and sanitize links
    const links = extractLinks(generatedLayout);
    if (links.length > 0) {
      const invalidLinks = new Set<string>();

      await Promise.all(
        links.map(async (link) => {
          const isValid = await validateLink(link);
          if (!isValid) invalidLinks.add(link);
        }),
      );

      if (invalidLinks.size > 0) {
        console.warn('Removed invalid links:', [...invalidLinks]);
        generatedLayout = sanitizeLayout(generatedLayout, invalidLinks);
      }
    }

    // Cache the layout result
    if (env.UI_CACHE) {
      await env.UI_CACHE.put(cacheKey, JSON.stringify(generatedLayout), {
        expirationTtl: 86400, // 24 hours
      });
    }

    // Include categorization info, visitor context, and UI hints in response
    const responsePayload = {
      ...generatedLayout,
      _categorization: categorizationInfo,
      _visitorContext: {
        geo: { country: visitorContext.geo.country, city: visitorContext.geo.city },
        device: { type: visitorContext.device.type },
        time: { timeOfDay: visitorContext.time.timeOfDay },
      },
      _uiHints: uiHints,
    };

    return new Response(JSON.stringify(responsePayload), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Generation error:', error);

    // Fall back to default layout on error
    return new Response(
      JSON.stringify({
        ...getDefaultLayout(effectiveTag, portfolioContent),
        _categorization: categorizationInfo,
        _visitorContext: {
          geo: { country: visitorContext.geo.country, city: visitorContext.geo.city },
          device: { type: visitorContext.device.type },
          time: { timeOfDay: visitorContext.time.timeOfDay },
        },
        _uiHints: uiHints,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
}

// Rate limit checking helper
export interface RateLimitResult {
  limited: boolean;
  retryAfter: number;
}

export async function checkRateLimit(key: string, env: Env): Promise<RateLimitResult> {
  if (!env.UI_CACHE) {
    return { limited: false, retryAfter: 0 };
  }

  const entry = (await env.UI_CACHE.get(key, 'json')) as RateLimitEntry | null;

  if (!entry) {
    return { limited: false, retryAfter: 0 };
  }

  const now = Date.now();
  const timeSinceLastDislike = now - entry.lastDislike;

  if (timeSinceLastDislike < RATE_LIMIT_WINDOW_MS) {
    const retryAfter = Math.ceil((RATE_LIMIT_WINDOW_MS - timeSinceLastDislike) / 1000);
    return { limited: true, retryAfter };
  }

  return { limited: false, retryAfter: 0 };
}

// Update rate limit entry
export async function updateRateLimit(key: string, env: Env): Promise<void> {
  if (!env.UI_CACHE) return;

  const entry: RateLimitEntry = {
    lastDislike: Date.now(),
    count: 1,
  };

  await env.UI_CACHE.put(key, JSON.stringify(entry), {
    expirationTtl: 300, // 5 minutes TTL for rate limit entries
  });
}

// Generate endpoint rate limiting (IP-based, count-based)
export interface GenerateRateLimitEntry {
  count: number;
  windowStart: number;
}

export interface GenerateRateLimitResult {
  limited: boolean;
  retryAfter: number;
}

// Get client IP from Cloudflare headers
// Security: Get client IP, returns null if not available (to reject unidentifiable requests)
export function getClientIP(request: Request): string | null {
  const cfIP = request.headers.get('CF-Connecting-IP');
  if (cfIP) return cfIP;

  const xForwardedFor = request.headers.get('X-Forwarded-For');
  if (xForwardedFor) {
    const firstIP = xForwardedFor.split(',')[0].trim();
    if (firstIP) return firstIP;
  }

  return null;
}

// Check generate endpoint rate limit
export async function checkGenerateRateLimit(
  clientIP: string,
  env: Env,
): Promise<GenerateRateLimitResult> {
  if (!env.UI_CACHE) {
    return { limited: false, retryAfter: 0 };
  }

  const key = `${RATE_LIMIT_KEY_PREFIX}generate:${clientIP}`;
  const entry = (await env.UI_CACHE.get(key, 'json')) as GenerateRateLimitEntry | null;
  const now = Date.now();

  if (!entry) {
    return { limited: false, retryAfter: 0 };
  }

  const timeSinceWindowStart = now - entry.windowStart;

  // Window expired, not limited
  if (timeSinceWindowStart >= GENERATE_RATE_LIMIT_WINDOW_MS) {
    return { limited: false, retryAfter: 0 };
  }

  // Check if over limit
  if (entry.count >= GENERATE_RATE_LIMIT_MAX) {
    const retryAfter = Math.ceil((GENERATE_RATE_LIMIT_WINDOW_MS - timeSinceWindowStart) / 1000);
    return { limited: true, retryAfter };
  }

  return { limited: false, retryAfter: 0 };
}

// Update generate endpoint rate limit
export async function updateGenerateRateLimit(clientIP: string, env: Env): Promise<void> {
  if (!env.UI_CACHE) return;

  const key = `${RATE_LIMIT_KEY_PREFIX}generate:${clientIP}`;
  const existing = (await env.UI_CACHE.get(key, 'json')) as GenerateRateLimitEntry | null;
  const now = Date.now();

  let entry: GenerateRateLimitEntry;

  if (existing && now - existing.windowStart < GENERATE_RATE_LIMIT_WINDOW_MS) {
    // Within window, increment count
    entry = {
      count: existing.count + 1,
      windowStart: existing.windowStart,
    };
  } else {
    // New window
    entry = {
      count: 1,
      windowStart: now,
    };
  }

  await env.UI_CACHE.put(key, JSON.stringify(entry), {
    expirationTtl: 120, // 2 minutes TTL
  });
}

// Handle feedback (like/dislike) submissions
async function handleFeedback(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ success: false, message: 'Invalid JSON' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Security: Validate request structure
  const validation = validateFeedbackRequest(body);
  if (!validation.valid) {
    return new Response(JSON.stringify({ success: false, message: validation.error }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { feedbackType, audienceType, cacheKey, sessionId } = body as FeedbackRequest;

  // Security: Validate session ID format
  if (!isValidSessionId(sessionId)) {
    const response: FeedbackResponse = {
      success: false,
      message: 'Invalid session ID format',
    };
    return new Response(JSON.stringify(response), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Write to Analytics Engine
  if (env.FEEDBACK) {
    env.FEEDBACK.writeDataPoint({
      blobs: [audienceType, feedbackType],
      doubles: [1],
      indexes: [sessionId],
    });
  }

  // Handle like - just acknowledge
  if (feedbackType === 'like') {
    const response: FeedbackResponse = {
      success: true,
      message: 'Thank you for your feedback!',
      regenerate: false,
    };
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Handle dislike - check rate limit, clear cache, signal regeneration
  if (feedbackType === 'dislike') {
    // Check rate limit
    const rateLimitKey = `${RATE_LIMIT_KEY_PREFIX}${sessionId}`;
    const rateLimitResult = await checkRateLimit(rateLimitKey, env);

    if (rateLimitResult.limited) {
      const response: FeedbackResponse = {
        success: false,
        message: 'Please wait before requesting another regeneration',
        rateLimited: true,
        retryAfter: rateLimitResult.retryAfter,
      };
      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Clear cache for this layout
    if (cacheKey && env.UI_CACHE) {
      await env.UI_CACHE.delete(cacheKey);
    }

    // Update rate limit
    await updateRateLimit(rateLimitKey, env);

    const response: FeedbackResponse = {
      success: true,
      message: 'Regenerating your personalized layout...',
      regenerate: true,
    };
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const response: FeedbackResponse = {
    success: false,
    message: 'Invalid feedback type',
  };
  return new Response(JSON.stringify(response), {
    status: 400,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Default layout when AI generation fails or is not configured
export function getDefaultLayout(
  visitorTag: string,
  portfolioContent: GenerateRequest['portfolioContent'],
): GeneratedLayout {
  const projectIds = portfolioContent.projects.map((p) => p.id);
  const { personal } = portfolioContent;

  const baseLayout: GeneratedLayout = {
    layout: 'hero-focused',
    theme: { accent: 'blue' },
    sections: [
      {
        type: 'Hero',
        props: {
          title: personal.name,
          subtitle: personal.title,
          image: '/assets/profile.png',
        },
      },
    ],
  };

  switch (visitorTag) {
    case 'recruiter':
      baseLayout.sections[0].props = {
        ...baseLayout.sections[0].props,
        cta: personal.resumeUrl ? { text: 'View Resume', href: personal.resumeUrl } : undefined,
      };
      baseLayout.sections.push(
        {
          type: 'SkillBadges',
          props: { title: 'Technical Skills', style: 'detailed' },
        },
        {
          type: 'Timeline',
          props: { title: 'Experience' },
        },
        {
          type: 'CardGrid',
          props: {
            title: 'Featured Projects',
            columns: 2,
            items: projectIds.slice(0, 4),
          },
        },
      );
      break;

    case 'developer':
      baseLayout.layout = 'two-column';
      baseLayout.sections.push(
        {
          type: 'CardGrid',
          props: { title: 'Projects', columns: 3, items: projectIds },
        },
        {
          type: 'SkillBadges',
          props: { title: 'Tech Stack', style: 'detailed' },
        },
        {
          type: 'ContactForm',
          props: { title: 'Connect', showGitHub: true, showEmail: true },
        },
      );
      break;

    case 'collaborator':
      baseLayout.sections.push(
        {
          type: 'TextBlock',
          props: {
            title: 'About Me',
            content: personal.bio,
            style: 'prose',
          },
        },
        {
          type: 'CardGrid',
          props: {
            title: 'Current Projects',
            columns: 2,
            items: projectIds.slice(0, 2),
          },
        },
        {
          type: 'ContactForm',
          props: {
            title: "Let's Collaborate",
            showEmail: true,
            showLinkedIn: true,
            showGitHub: true,
          },
        },
      );
      break;

    case 'friend':
    default:
      baseLayout.layout = 'single-column';
      baseLayout.sections.push(
        {
          type: 'TextBlock',
          props: {
            title: 'Hey there!',
            content: personal.bio,
            style: 'prose',
          },
        },
        {
          type: 'ImageGallery',
          props: { title: 'Photos', images: portfolioContent.photos?.map((p) => p.path) || [] },
        },
        {
          type: 'ContactForm',
          props: { title: 'Get in Touch', showEmail: true },
        },
      );
      break;
  }

  return baseLayout;
}

// ============ Data Pre-fetch Functions for AI Context ============

// Default fallback location: Shanghai
const DEFAULT_WEATHER_LOCATION = {
  name: 'Shanghai',
  lat: 31.23,
  lon: 121.47,
};

// Extract GitHub username from portfolio content
function extractGitHubUsername(portfolioContent: PortfolioContent): string {
  const githubUrl = portfolioContent.personal.contact.github;
  const match = githubUrl.match(/github\.com\/([^/]+)/);
  return match ? match[1] : 'uetuluk';
}

// Create summary from GitHub activity data
function createSummaryFromActivity(
  data: GitHubActivityResponse,
  username: string,
): GitHubDataSummary {
  if (data.contributions.length === 0) {
    return { available: false, username, totalCommits: 0, recentActivity: 0 };
  }

  const sorted = [...data.contributions].sort((a, b) => a.date.localeCompare(b.date));

  // Calculate average commits per week
  const weeks = Math.max(1, Math.ceil(sorted.length / 7));
  const avgCommitsPerWeek = Math.round(data.totalCommits / weeks);

  return {
    available: true,
    username,
    dateRange: {
      start: sorted[0].date,
      end: sorted[sorted.length - 1].date,
    },
    totalCommits: data.totalCommits,
    recentActivity: data.recentActivity,
    samplePoints: sorted.slice(-5), // Last 5 data points
    avgCommitsPerWeek,
  };
}

// Activity event types to track (beyond just PushEvent)
const TRACKED_EVENT_TYPES = [
  'PushEvent',
  'PullRequestEvent',
  'CreateEvent',
  'IssuesEvent',
  'IssueCommentEvent',
  'PullRequestReviewEvent',
  'PullRequestReviewCommentEvent',
  'CommitCommentEvent',
  'ReleaseEvent',
];

// Get activity count from a GitHub event
function getActivityCountFromEvent(event: GitHubEvent): number {
  if (!TRACKED_EVENT_TYPES.includes(event.type)) {
    return 0;
  }

  // PushEvent has multiple commits, use payload.size
  if (event.type === 'PushEvent' && event.payload?.size) {
    return event.payload.size;
  }

  // All other tracked events count as 1 activity
  return 1;
}

// Pre-fetch GitHub data and create a summary for AI context
export async function fetchGitHubSummary(
  username: string,
  env: Env,
): Promise<GitHubDataSummary> {
  // Security: Validate username format
  if (!isValidGitHubUsername(username)) {
    return { available: false, username, totalCommits: 0, recentActivity: 0 };
  }

  const cacheKey = `github:activity:${username}`;

  // Check cache first
  if (env.UI_CACHE) {
    const cached = await env.UI_CACHE.get(cacheKey, 'json');
    if (cached) {
      const data = cached as GitHubActivityResponse;
      return createSummaryFromActivity(data, username);
    }
  }

  try {
    const response = await fetch(`https://api.github.com/users/${username}/events?per_page=100`, {
      headers: {
        'User-Agent': 'Portfolio-Site',
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      return { available: false, username, totalCommits: 0, recentActivity: 0 };
    }

    const events = (await response.json()) as GitHubEvent[];

    // Process events into daily contribution counts
    const contributionMap = new Map<string, number>();
    let totalCommits = 0;

    for (const event of events) {
      const activityCount = getActivityCountFromEvent(event);
      if (activityCount > 0) {
        const date = event.created_at.split('T')[0];
        contributionMap.set(date, (contributionMap.get(date) || 0) + activityCount);
        totalCommits += activityCount;
      }
    }

    const contributions = Array.from(contributionMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Calculate recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentActivity = contributions
      .filter((c) => new Date(c.date) >= thirtyDaysAgo)
      .reduce((sum, c) => sum + c.count, 0);

    const result: GitHubActivityResponse = {
      contributions,
      totalCommits,
      recentActivity,
    };

    // Cache the result
    if (env.UI_CACHE) {
      await env.UI_CACHE.put(cacheKey, JSON.stringify(result), {
        expirationTtl: 3600, // 1 hour
      });
    }

    return createSummaryFromActivity(result, username);
  } catch {
    return { available: false, username, totalCommits: 0, recentActivity: 0 };
  }
}

// Helper to geocode a city name (for weather pre-fetch)
async function geocodeCity(
  cityName: string,
  env: Env,
): Promise<{ lat: number; lon: number; name: string } | null> {
  const cacheKey = `geocode:${cityName.toLowerCase().trim()}`;

  if (env.UI_CACHE) {
    const cached = await env.UI_CACHE.get(cacheKey, 'json');
    if (cached) {
      const result = cached as GeocodingResult;
      return { lat: result.lat, lon: result.lon, name: result.name };
    }
  }

  try {
    const geocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en`;
    const response = await fetch(geocodeUrl, {
      headers: { 'User-Agent': 'Portfolio-Site' },
    });

    if (!response.ok) return null;

    const data = (await response.json()) as OpenMeteoGeocodingResponse;
    if (!data.results || data.results.length === 0) return null;

    const result: GeocodingResult = {
      lat: data.results[0].latitude,
      lon: data.results[0].longitude,
      name: data.results[0].name,
      country: data.results[0].country,
      timezone: data.results[0].timezone,
    };

    // Cache for 1 year
    if (env.UI_CACHE) {
      await env.UI_CACHE.put(cacheKey, JSON.stringify(result), {
        expirationTtl: 31536000,
      });
    }

    return { lat: result.lat, lon: result.lon, name: result.name };
  } catch {
    return null;
  }
}

// Create empty weather summary
function createEmptyWeatherSummary(location: {
  name: string;
  lat: number;
  lon: number;
}): WeatherDataSummary {
  return {
    available: false,
    location,
    weeklyForecast: [],
    unit: 'C',
  };
}

// Pre-fetch weather data for visitor location
export async function fetchWeatherSummary(
  visitorContext: VisitorContext,
  env: Env,
): Promise<WeatherDataSummary> {
  // Try to get visitor city coordinates
  let location = DEFAULT_WEATHER_LOCATION;

  if (visitorContext.geo.city) {
    const cityCoords = await geocodeCity(visitorContext.geo.city, env);
    if (cityCoords) {
      location = {
        name: cityCoords.name,
        lat: cityCoords.lat,
        lon: cityCoords.lon,
      };
    }
  }

  // Check cache
  const cacheKey = `weather:minmax:${location.lat.toFixed(2)}:${location.lon.toFixed(2)}`;
  if (env.UI_CACHE) {
    const cached = await env.UI_CACHE.get(cacheKey, 'json');
    if (cached) {
      return cached as WeatherDataSummary;
    }
  }

  try {
    // Fetch daily min/max temperatures from Open-Meteo
    const openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}&daily=temperature_2m_max,temperature_2m_min&forecast_days=7&timezone=auto`;

    const response = await fetch(openMeteoUrl, {
      headers: { 'User-Agent': 'Portfolio-Site' },
    });

    if (!response.ok) {
      return createEmptyWeatherSummary(location);
    }

    const data = (await response.json()) as OpenMeteoDailyResponse;

    const weeklyForecast = data.daily.time.map((date, i) => ({
      date,
      minTemp: data.daily.temperature_2m_min[i],
      maxTemp: data.daily.temperature_2m_max[i],
    }));

    const summary: WeatherDataSummary = {
      available: true,
      location,
      weeklyForecast,
      unit: data.daily_units.temperature_2m_max.replace('°', ''),
    };

    // Cache for 1 hour
    if (env.UI_CACHE) {
      await env.UI_CACHE.put(cacheKey, JSON.stringify(summary), {
        expirationTtl: 3600,
      });
    }

    return summary;
  } catch {
    return createEmptyWeatherSummary(location);
  }
}

// Handle GitHub activity data requests
async function handleGitHubActivity(
  _request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
  url: URL,
): Promise<Response> {
  const username = url.searchParams.get('username') || 'uetuluk';

  // Security: Validate GitHub username format
  if (!isValidGitHubUsername(username)) {
    return new Response(
      JSON.stringify({ error: 'Invalid username format' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  console.log('[Worker] GitHub activity request for username:', username);

  // Check cache first (1 hour TTL)
  const cacheKey = `github:activity:${username}`;
  if (env.UI_CACHE) {
    const cached = await env.UI_CACHE.get(cacheKey, 'json');
    if (cached) {
      return new Response(JSON.stringify(cached), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  try {
    // Fetch events from GitHub API (returns last 90 days of public events)
    const response = await fetch(`https://api.github.com/users/${username}/events?per_page=100`, {
      headers: {
        'User-Agent': 'Portfolio-Site',
        Accept: 'application/vnd.github.v3+json',
      },
    });

    console.log('[Worker] GitHub API response status:', response.status);

    if (!response.ok) {
      throw new Error(`GitHub API returned ${response.status}`);
    }

    const events = (await response.json()) as GitHubEvent[];
    console.log('[Worker] GitHub events fetched:', events.length);

    // Process events into daily contribution counts
    const contributionMap = new Map<string, number>();
    let totalCommits = 0;

    for (const event of events) {
      const activityCount = getActivityCountFromEvent(event);
      if (activityCount > 0) {
        const date = event.created_at.split('T')[0];
        contributionMap.set(date, (contributionMap.get(date) || 0) + activityCount);
        totalCommits += activityCount;
      }
    }

    // Convert to sorted array
    const contributions = Array.from(contributionMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Calculate recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentActivity = contributions
      .filter((c) => new Date(c.date) >= thirtyDaysAgo)
      .reduce((sum, c) => sum + c.count, 0);

    const result: GitHubActivityResponse = {
      contributions,
      totalCommits,
      recentActivity,
    };

    console.log('[Worker] Processed GitHub data:', {
      contributionsCount: contributions.length,
      totalCommits,
      recentActivity,
    });

    // Cache the result
    if (env.UI_CACHE) {
      await env.UI_CACHE.put(cacheKey, JSON.stringify(result), {
        expirationTtl: 3600, // 1 hour
      });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Worker] GitHub API error:', error);

    // Return empty data on error
    const emptyResult: GitHubActivityResponse = {
      contributions: [],
      totalCommits: 0,
      recentActivity: 0,
    };

    return new Response(JSON.stringify(emptyResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

// Handle weather data requests using Open-Meteo API (min/max temperature only)
async function handleWeather(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
  url: URL,
): Promise<Response> {
  const visitorParam = url.searchParams.get('visitor');
  const lat = url.searchParams.get('lat');
  const lon = url.searchParams.get('lon');

  let latitude: number;
  let longitude: number;
  let locationName: string | undefined;

  // If visitor=true, use visitor's location from Cloudflare headers
  if (visitorParam === 'true') {
    const cf = request.cf as IncomingRequestCfProperties | undefined;

    if (cf?.city) {
      const cityCoords = await geocodeCity(cf.city as string, env);
      if (cityCoords) {
        latitude = cityCoords.lat;
        longitude = cityCoords.lon;
        locationName = cityCoords.name;
      } else {
        // Fall back to Shanghai
        latitude = DEFAULT_WEATHER_LOCATION.lat;
        longitude = DEFAULT_WEATHER_LOCATION.lon;
        locationName = DEFAULT_WEATHER_LOCATION.name;
      }
    } else {
      // Fall back to Shanghai
      latitude = DEFAULT_WEATHER_LOCATION.lat;
      longitude = DEFAULT_WEATHER_LOCATION.lon;
      locationName = DEFAULT_WEATHER_LOCATION.name;
    }
  } else {
    // Validate required parameters
    if (!lat || !lon) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: lat and lon (or use visitor=true)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    latitude = parseFloat(lat);
    longitude = parseFloat(lon);

    if (isNaN(latitude) || isNaN(longitude)) {
      return new Response(
        JSON.stringify({ error: 'Invalid lat/lon values' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
  }

  // Check cache first (1 hour TTL)
  const cacheKey = `weather:minmax:${latitude.toFixed(2)}:${longitude.toFixed(2)}`;
  if (env.UI_CACHE) {
    const cached = await env.UI_CACHE.get(cacheKey, 'json');
    if (cached) {
      return new Response(JSON.stringify(cached), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  try {
    // Fetch ONLY daily min/max temperatures from Open-Meteo
    const openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min&forecast_days=7&timezone=auto`;

    const response = await fetch(openMeteoUrl, {
      headers: { 'User-Agent': 'Portfolio-Site' },
    });

    if (!response.ok) {
      throw new Error(`Open-Meteo API returned ${response.status}`);
    }

    const openMeteoData = (await response.json()) as OpenMeteoDailyResponse;

    // Transform to response format
    const result: WeatherMinMaxResponse = {
      data: openMeteoData.daily.time.map((date, i) => ({
        date,
        minTemp: openMeteoData.daily.temperature_2m_min[i],
        maxTemp: openMeteoData.daily.temperature_2m_max[i],
      })),
      unit: openMeteoData.daily_units.temperature_2m_max.replace('°', ''),
      location: { lat: latitude, lon: longitude, name: locationName },
    };

    // Cache the result
    if (env.UI_CACHE) {
      await env.UI_CACHE.put(cacheKey, JSON.stringify(result), {
        expirationTtl: 3600, // 1 hour
      });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Weather API error:', error);

    // Return empty data on error
    const emptyResult: WeatherMinMaxResponse = {
      data: [],
      unit: 'C',
      location: { lat: latitude, lon: longitude, name: locationName },
    };

    return new Response(JSON.stringify(emptyResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

// Handle geocoding requests using Open-Meteo Geocoding API
async function handleGeocode(
  _request: Request,
  env: Env,
  corsHeaders: Record<string, string>,
  url: URL,
): Promise<Response> {
  const city = url.searchParams.get('city');

  // Validate required parameter
  if (!city || city.trim().length < 2) {
    return new Response(
      JSON.stringify({ error: 'Missing or invalid city parameter (min 2 characters)' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  const cityName = city.trim().toLowerCase();

  // Check cache first (1 year TTL - cities don't move)
  const cacheKey = `geocode:${cityName}`;
  if (env.UI_CACHE) {
    const cached = await env.UI_CACHE.get(cacheKey, 'json');
    if (cached) {
      return new Response(JSON.stringify(cached), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  try {
    // Fetch from Open-Meteo Geocoding API (free, no key required)
    const geocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en`;

    const response = await fetch(geocodeUrl, {
      headers: { 'User-Agent': 'Portfolio-Site' },
    });

    if (!response.ok) {
      throw new Error(`Geocoding API returned ${response.status}`);
    }

    const geocodeData = (await response.json()) as OpenMeteoGeocodingResponse;

    // Check if we got any results
    if (!geocodeData.results || geocodeData.results.length === 0) {
      return new Response(
        JSON.stringify({ error: `City not found: ${city}` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const firstResult = geocodeData.results[0];

    // Transform to our response format
    const result: GeocodingResult = {
      lat: firstResult.latitude,
      lon: firstResult.longitude,
      name: firstResult.name,
      country: firstResult.country,
      timezone: firstResult.timezone,
    };

    // Cache the result for 1 year (cities don't move)
    if (env.UI_CACHE) {
      await env.UI_CACHE.put(cacheKey, JSON.stringify(result), {
        expirationTtl: 31536000, // 1 year in seconds
      });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Geocoding API error:', error);

    return new Response(
      JSON.stringify({ error: 'Failed to geocode city' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
}

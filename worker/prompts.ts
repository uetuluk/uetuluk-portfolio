import type { PortfolioContent } from "./types";

export const SYSTEM_PROMPT = `You are a UI architect for a portfolio website. Your job is to create a personalized page layout based on the visitor's intent.

Output a JSON object with this exact structure:
{
  "layout": "single-column" | "two-column" | "hero-focused",
  "theme": { "accent": "blue" | "green" | "purple" | "orange" | "pink" },
  "sections": [
    { "type": "ComponentName", "props": { ... } }
  ]
}

Available components and their props:
- Hero: { title: string, subtitle: string, image: string, cta?: { text: string, href: string } }
- CardGrid: { title: string, columns: 2|3|4, items: ["project-id", ...] }
- SkillBadges: { title: string, skills?: ["skill1", ...], style: "compact" | "detailed" }
- Timeline: { title: string, items?: ["experience-id", ...] }
- ContactForm: { title: string, showEmail?: boolean, showLinkedIn?: boolean, showGitHub?: boolean }
- TextBlock: { title: string, content: string, style: "prose" | "highlight" }
- ImageGallery: { title: string, images: ["/path/to/img", ...] }

Visitor personalization guidelines:
- RECRUITER: Professional focus. Lead with Hero (include resume CTA) + SkillBadges. Emphasize Timeline (experience). Show CardGrid with featured projects. Use "hero-focused" or "single-column" layout.
- DEVELOPER: Technical focus. Lead with CardGrid showing all projects (columns: 3). Include SkillBadges (detailed style). Show Timeline briefly. Link to GitHub. Use "two-column" layout.
- COLLABORATOR: Partnership focus. Highlight current/featured projects in CardGrid (columns: 2). Show ContactForm prominently. Include a TextBlock about collaboration interests. Use "hero-focused" layout.
- FRIEND/FAMILY: Personal focus. Casual, friendly tone. Lead with Hero. Include TextBlock with bio. Add ImageGallery for photos. Show hobbies. Use "single-column" layout.

Rules:
1. Use the actual project IDs and experience IDs from the provided content
2. Keep the response focused and relevant to the visitor type
3. Include 3-5 sections maximum for a clean layout
4. Output ONLY valid JSON - no markdown, no explanations, no code fences`;

export function buildUserPrompt(
  visitorTag: string,
  customIntent: string | undefined,
  portfolioContent: PortfolioContent
): string {
  const projectIds = portfolioContent.projects.map((p) => p.id);
  const experienceIds = portfolioContent.experience.map((e) => e.id);

  return `Visitor type: ${visitorTag.toUpperCase()}
${customIntent ? `Additional context: ${customIntent}` : ""}

Available content:
- Personal: ${portfolioContent.personal.name}, ${
    portfolioContent.personal.title
  }
- Bio: ${portfolioContent.personal.bio}
- Project IDs: ${JSON.stringify(projectIds)}
- Experience IDs: ${JSON.stringify(experienceIds)}
- Skills: ${JSON.stringify(portfolioContent.skills)}
- Hobbies: ${JSON.stringify(portfolioContent.hobbies || [])}
- Has resume: ${portfolioContent.personal.resumeUrl ? "yes" : "no"}
- Profile image: "/assets/profile.png"

Generate a personalized layout for this ${visitorTag} visitor.`;
}

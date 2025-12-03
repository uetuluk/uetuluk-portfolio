import type { PortfolioContent } from "./types";

const ALLOWED_VISITOR_TAGS = ["recruiter", "developer", "collaborator", "friend"];
const MAX_CUSTOM_INTENT_LENGTH = 200;

export function buildSystemPrompt(portfolioContent: PortfolioContent): string {
  const { personal, projects, experience, skills, education, hobbies } = portfolioContent;

  const projectsList = projects
    .map(
      (p) =>
        `- ${p.id}: "${p.title}" - ${p.description} [${p.tags.join(", ")}]${p.featured ? " (FEATURED)" : ""}`
    )
    .join("\n");

  const experienceList = experience
    .map((e) => `- ${e.id}: ${e.role} at ${e.company} (${e.period})`)
    .join("\n");

  const educationList = education
    .map((e) => `- ${e.id}: ${e.degree} from ${e.institution} (${e.period})`)
    .join("\n");

  return `You are a UI architect for a portfolio website. Your job is to create a personalized page layout based on the visitor's intent.

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

=== PORTFOLIO CONTENT (Use these exact IDs and values) ===
Personal Information:
- Name: ${personal.name}
- Title: ${personal.title}
- Bio: ${personal.bio}
- Location: ${personal.location || "Not specified"}
- Resume URL: ${personal.resumeUrl || "Not available"}
- Profile Image: "/assets/profile.png"

Contact:
- Email: ${personal.contact.email}
- LinkedIn: ${personal.contact.linkedin}
- GitHub: ${personal.contact.github}

Projects (use these IDs in CardGrid items):
${projectsList}

Experience (use these IDs in Timeline items):
${experienceList}

Skills: ${JSON.stringify(skills)}

Education:
${educationList}

Hobbies: ${JSON.stringify(hobbies || [])}
=== END PORTFOLIO CONTENT ===

Visitor personalization guidelines:
- RECRUITER: Professional focus. Lead with Hero (include resume CTA) + SkillBadges. Emphasize Timeline (experience). Show CardGrid with featured projects. Use "hero-focused" or "single-column" layout.
- DEVELOPER: Technical focus. Lead with CardGrid showing all projects (columns: 3). Include SkillBadges (detailed style). Show Timeline briefly. Link to GitHub. Use "two-column" layout.
- COLLABORATOR: Partnership focus. Highlight current/featured projects in CardGrid (columns: 2). Show ContactForm prominently. Include a TextBlock about collaboration interests. Use "hero-focused" layout.
- FRIEND/FAMILY: Personal focus. Casual, friendly tone. Lead with Hero. Include TextBlock with bio. Add ImageGallery for photos. Show hobbies. Use "single-column" layout.

Rules:
1. Use ONLY the project IDs and experience IDs from the portfolio content above
2. Keep the response focused and relevant to the visitor type
3. Include 3-5 sections maximum for a clean layout
4. Output ONLY valid JSON - no markdown, no explanations, no code fences`;
}

export function buildUserPrompt(
  visitorTag: string,
  customIntent: string | undefined
): string {
  // Sanitize visitor tag to only allow known values
  const sanitizedTag = ALLOWED_VISITOR_TAGS.includes(visitorTag.toLowerCase())
    ? visitorTag.toUpperCase()
    : "FRIEND";

  let prompt = `Visitor type: ${sanitizedTag}`;

  if (customIntent) {
    // Truncate custom intent to limit injection surface
    const truncatedIntent = customIntent.slice(0, MAX_CUSTOM_INTENT_LENGTH);
    prompt += `\nAdditional context: ${truncatedIntent}`;
  }

  prompt += `\n\nGenerate a personalized layout for this visitor.`;

  return prompt;
}

import { useState } from "react";
import { WelcomeModal } from "@/components/WelcomeModal";
import { LoadingScreen } from "@/components/LoadingScreen";
import { GeneratedPage } from "@/components/GeneratedPage";
import portfolioContent from "@/content/portfolio.json";

export type VisitorType =
  | "recruiter"
  | "developer"
  | "collaborator"
  | "friend"
  | null;

export interface GeneratedLayout {
  layout: "single-column" | "two-column" | "hero-focused";
  theme: { accent: string };
  sections: Array<{
    type: string;
    props: Record<string, unknown>;
  }>;
}

function App() {
  const [visitorType, setVisitorType] = useState<VisitorType>(null);
  const [_customIntent, setCustomIntent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [generatedLayout, setGeneratedLayout] =
    useState<GeneratedLayout | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVisitorSelect = async (
    type: VisitorType,
    custom?: string
  ) => {
    setVisitorType(type);
    setCustomIntent(custom || "");
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitorTag: type,
          customIntent: custom,
          portfolioContent,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate personalized layout");
      }

      const data = (await response.json()) as GeneratedLayout;
      setGeneratedLayout(data);
    } catch (err) {
      console.error("Generation error:", err);
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
      // Fall back to default layout
      setGeneratedLayout(getDefaultLayout(type));
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setVisitorType(null);
    setCustomIntent("");
    setGeneratedLayout(null);
    setError(null);
  };

  // Show welcome modal if no visitor type selected
  if (!visitorType) {
    return <WelcomeModal onSelect={handleVisitorSelect} />;
  }

  // Show loading screen while generating
  if (isLoading) {
    return <LoadingScreen visitorType={visitorType} />;
  }

  // Show generated page
  return (
    <GeneratedPage
      layout={generatedLayout}
      visitorType={visitorType}
      onReset={handleReset}
      error={error}
    />
  );
}

// Fallback layout if AI generation fails
function getDefaultLayout(visitorType: VisitorType): GeneratedLayout {
  const baseLayout: GeneratedLayout = {
    layout: "hero-focused",
    theme: { accent: "blue" },
    sections: [
      {
        type: "Hero",
        props: {
          title: portfolioContent.personal.name,
          subtitle: portfolioContent.personal.title,
          image: "/assets/profile.jpg",
        },
      },
    ],
  };

  switch (visitorType) {
    case "recruiter":
      baseLayout.sections.push(
        { type: "SkillBadges", props: { title: "Skills", skills: portfolioContent.skills } },
        { type: "Timeline", props: { title: "Experience", items: portfolioContent.experience } }
      );
      break;
    case "developer":
      baseLayout.sections.push(
        { type: "CardGrid", props: { title: "Projects", columns: 3, items: portfolioContent.projects } }
      );
      break;
    case "collaborator":
      baseLayout.sections.push(
        { type: "CardGrid", props: { title: "Projects", columns: 2, items: portfolioContent.projects } },
        { type: "ContactForm", props: { title: "Let's Connect", showEmail: true, showLinkedIn: true } }
      );
      break;
    case "friend":
      baseLayout.sections.push(
        { type: "TextBlock", props: { title: "About Me", content: portfolioContent.personal.bio } },
        { type: "ImageGallery", props: { title: "Photos", images: [] } }
      );
      break;
  }

  return baseLayout;
}

export default App;

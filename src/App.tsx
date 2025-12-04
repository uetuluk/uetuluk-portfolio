import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { WelcomeModal } from "@/components/WelcomeModal";
import { LoadingScreen } from "@/components/LoadingScreen";
import { GeneratedPage } from "@/components/GeneratedPage";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { SEO } from "@/components/SEO";
import { StructuredData } from "@/components/StructuredData";
import { useTheme } from "@/hooks/useTheme";
import { useTranslatedPortfolio } from "@/hooks/useTranslatedPortfolio";
import { generatePalette, colorNameToHSL } from "@/lib/palette";
import { applyPaletteToRoot } from "@/lib/applyPalette";

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
  _cacheKey?: string;
  _visitorContext?: {
    geo?: { country?: string; city?: string };
    device?: { type?: "mobile" | "tablet" | "desktop" };
    time?: { timeOfDay?: string };
  };
  _uiHints?: {
    suggestedTheme?: "light" | "dark" | "system";
    preferCompactLayout?: boolean;
  };
  _rateLimited?: boolean;
  _retryAfter?: number;
}

function App() {
  const { t, i18n } = useTranslation();
  const portfolioContent = useTranslatedPortfolio();
  const [visitorType, setVisitorType] = useState<VisitorType>(null);
  const [customIntent, setCustomIntent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [generatedLayout, setGeneratedLayout] =
    useState<GeneratedLayout | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Access theme hook to apply suggested theme based on visitor context
  const { setTheme, preference } = useTheme();

  // Update document language when i18n language changes
  useEffect(() => {
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  // Helper to apply suggested theme on first visit
  const applyThemeSuggestion = (data: GeneratedLayout) => {
    if (data._uiHints?.suggestedTheme && preference === "system") {
      // Only apply suggestion if user hasn't explicitly set a preference
      // and only on first visit to this site
      const hasVisited = localStorage.getItem("portfolio-visited");
      if (!hasVisited && data._uiHints.suggestedTheme !== "system") {
        setTheme(data._uiHints.suggestedTheme);
        localStorage.setItem("portfolio-visited", "true");
      }
    }
  };

  // Helper to apply AI-selected color palette
  const applyColorPalette = useCallback((data: GeneratedLayout) => {
    if (data.theme?.accent) {
      const baseColor = colorNameToHSL(data.theme.accent);
      const palette = generatePalette(baseColor);
      applyPaletteToRoot(palette);
    }
  }, []);

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
        throw new Error(t("errors.failedGenerate"));
      }

      const data = (await response.json()) as GeneratedLayout;

      // Log if rate limited (using default layout)
      if (data._rateLimited) {
        console.info("Rate limited - showing default layout");
      }

      setGeneratedLayout(data);

      // Apply AI-selected color palette
      applyColorPalette(data);

      // Apply theme suggestion based on visitor's local time
      applyThemeSuggestion(data);
    } catch (err) {
      console.error("Generation error:", err);
      setError(
        err instanceof Error ? err.message : t("errors.unexpected")
      );
      // Fall back to default layout
      const fallbackLayout = getDefaultLayout(type);
      setGeneratedLayout(fallbackLayout);
      applyColorPalette(fallbackLayout);
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

  const handleRegenerate = async () => {
    if (!visitorType) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitorTag: visitorType,
          customIntent: customIntent || undefined,
          portfolioContent,
        }),
      });

      if (!response.ok) {
        throw new Error(t("errors.failedRegenerate"));
      }

      const data = (await response.json()) as GeneratedLayout;
      setGeneratedLayout(data);

      // Apply AI-selected color palette
      applyColorPalette(data);
    } catch (err) {
      console.error("Regeneration error:", err);
      setError(
        err instanceof Error ? err.message : t("errors.unexpected")
      );
      // Fall back to default layout
      const fallbackLayout = getDefaultLayout(visitorType);
      setGeneratedLayout(fallbackLayout);
      applyColorPalette(fallbackLayout);
    } finally {
      setIsLoading(false);
    }
  };

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
            image: "/assets/profile.png",
          },
        },
      ],
    };

    switch (visitorType) {
      case "recruiter":
        baseLayout.sections.push(
          {
            type: "SkillBadges",
            props: {
              title: t("fallbackSections.skills"),
              skills: portfolioContent.skills,
            },
          },
          {
            type: "Timeline",
            props: {
              title: t("fallbackSections.experience"),
              items: portfolioContent.experience,
            },
          }
        );
        break;
      case "developer":
        baseLayout.sections.push({
          type: "CardGrid",
          props: {
            title: t("fallbackSections.projects"),
            columns: 3,
            items: portfolioContent.projects,
          },
        });
        break;
      case "collaborator":
        baseLayout.sections.push(
          {
            type: "CardGrid",
            props: {
              title: t("fallbackSections.projects"),
              columns: 2,
              items: portfolioContent.projects,
            },
          },
          {
            type: "ContactForm",
            props: {
              title: t("fallbackSections.letsConnect"),
              showEmail: true,
              showLinkedIn: true,
            },
          }
        );
        break;
      case "friend":
        baseLayout.sections.push(
          {
            type: "TextBlock",
            props: {
              title: t("fallbackSections.aboutMe"),
              content: portfolioContent.personal.bio,
            },
          },
          {
            type: "ImageGallery",
            props: { title: t("fallbackSections.photos"), images: [] },
          }
        );
        break;
    }

    return baseLayout;
  }

  return (
    <>
      <SEO />
      <StructuredData />
      <LanguageSwitcher />
      <ThemeToggle />
      {!visitorType ? (
        <WelcomeModal onSelect={handleVisitorSelect} />
      ) : isLoading ? (
        <LoadingScreen visitorType={visitorType} />
      ) : (
        <GeneratedPage
          layout={generatedLayout}
          visitorType={visitorType}
          onReset={handleReset}
          onRegenerate={handleRegenerate}
          error={error}
        />
      )}
    </>
  );
}

export default App;

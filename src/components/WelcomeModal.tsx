import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { VisitorType } from "@/App";
import { cn } from "@/lib/utils";
import { MosaicBackground } from "./MosaicBackground";

interface WelcomeModalProps {
  onSelect: (type: VisitorType, customIntent?: string) => void;
}

const visitorTypeKeys = ["recruiter", "developer", "collaborator", "friend"] as const;

const visitorIcons: Record<(typeof visitorTypeKeys)[number], string> = {
  recruiter: "👔",
  developer: "💻",
  collaborator: "🤝",
  friend: "👋",
};

export function WelcomeModal({ onSelect }: WelcomeModalProps) {
  const { t } = useTranslation();
  const [customIntent, setCustomIntent] = useState("");

  const handleSubmitCustom = () => {
    if (customIntent.trim()) {
      // Default to collaborator for custom intents
      onSelect("collaborator", customIntent);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <MosaicBackground />
      <div className="relative z-10 max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {t("welcome.title")}
          </h1>
          <p className="text-lg text-muted-foreground">
            {t("welcome.subtitle")}
          </p>
        </div>

        <div className="bg-card rounded-xl border shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-6 text-center">
            {t("welcome.formLabel")}
          </h2>

          <div className="space-y-4">
            <textarea
              value={customIntent}
              onChange={(e) => setCustomIntent(e.target.value)}
              placeholder={t("welcome.placeholder")}
              className="w-full px-4 py-3 rounded-lg border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              rows={3}
            />
            <button
              onClick={handleSubmitCustom}
              disabled={!customIntent.trim()}
              className={cn(
                "w-full px-4 py-2 rounded-lg font-medium transition-colors",
                customIntent.trim()
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              {t("welcome.continue")}
            </button>
          </div>

          <div className="mt-6 pt-6 border-t text-center text-sm text-muted-foreground">
            <span>{t("welcome.quickOptions")} </span>
            {visitorTypeKeys.map((type, index) => (
              <span key={type}>
                <button
                  onClick={() => onSelect(type)}
                  className="hover:text-foreground hover:underline transition-colors"
                >
                  {visitorIcons[type]} {t(`visitorTypes.${type}.label`)}
                </button>
                {index < visitorTypeKeys.length - 1 && <span> | </span>}
              </span>
            ))}
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          {t("welcome.selectionHelp")}
        </p>
      </div>
    </div>
  );
}

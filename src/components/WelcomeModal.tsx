import { useState } from "react";
import type { VisitorType } from "@/App";
import { cn } from "@/lib/utils";

interface WelcomeModalProps {
  onSelect: (type: VisitorType, customIntent?: string) => void;
}

const visitorOptions = [
  {
    type: "recruiter" as VisitorType,
    label: "Recruiter / HR",
    description: "Looking to evaluate skills and experience",
    icon: "👔",
  },
  {
    type: "developer" as VisitorType,
    label: "Fellow Developer",
    description: "Interested in technical projects and code",
    icon: "💻",
  },
  {
    type: "collaborator" as VisitorType,
    label: "Potential Collaborator",
    description: "Exploring partnership opportunities",
    icon: "🤝",
  },
  {
    type: "friend" as VisitorType,
    label: "Friend / Family",
    description: "Just here to check things out",
    icon: "👋",
  },
];

export function WelcomeModal({ onSelect }: WelcomeModalProps) {
  const [showCustom, setShowCustom] = useState(false);
  const [customIntent, setCustomIntent] = useState("");
  const [selectedType, setSelectedType] = useState<VisitorType>(null);

  const handleSubmitCustom = () => {
    if (customIntent.trim()) {
      // Default to collaborator for custom intents
      onSelect("collaborator", customIntent);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Welcome to My Portfolio
          </h1>
          <p className="text-lg text-muted-foreground">
            To personalize your experience, tell me a bit about yourself.
          </p>
        </div>

        <div className="bg-card rounded-xl border shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-6 text-center">
            What brings you here today?
          </h2>

          <div className="grid gap-3 sm:grid-cols-2">
            {visitorOptions.map((option) => (
              <button
                key={option.type}
                onClick={() => {
                  setSelectedType(option.type);
                  onSelect(option.type);
                }}
                className={cn(
                  "flex items-start gap-4 p-4 rounded-lg border-2 text-left transition-all",
                  "hover:border-primary hover:bg-accent",
                  selectedType === option.type
                    ? "border-primary bg-accent"
                    : "border-border"
                )}
              >
                <span className="text-2xl">{option.icon}</span>
                <div>
                  <div className="font-medium">{option.label}</div>
                  <div className="text-sm text-muted-foreground">
                    {option.description}
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t">
            {!showCustom ? (
              <button
                onClick={() => setShowCustom(true)}
                className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Something else? Click here to tell me more →
              </button>
            ) : (
              <div className="space-y-3">
                <label className="block text-sm font-medium">
                  Tell me what you're looking for:
                </label>
                <textarea
                  value={customIntent}
                  onChange={(e) => setCustomIntent(e.target.value)}
                  placeholder="I'm interested in..."
                  className="w-full px-4 py-3 rounded-lg border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={3}
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCustom(false)}
                    className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitCustom}
                    disabled={!customIntent.trim()}
                    className={cn(
                      "flex-1 px-4 py-2 rounded-lg font-medium transition-colors",
                      customIntent.trim()
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "bg-muted text-muted-foreground cursor-not-allowed"
                    )}
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Your selection helps me show you the most relevant content.
        </p>
      </div>
    </div>
  );
}

import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/useTheme";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { preference, toggleTheme, isDark } = useTheme();

  const Icon = preference === "system" ? Monitor : isDark ? Moon : Sun;

  const tooltipText =
    preference === "system"
      ? `Switch to ${isDark ? "light" : "dark"} mode`
      : "Use system preference";

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "fixed bottom-6 right-6 z-50",
        "w-12 h-12 rounded-full",
        "bg-card border border-border shadow-lg",
        "hover:bg-accent hover:scale-110",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        "transition-all duration-200 ease-in-out",
        "flex items-center justify-center",
        className
      )}
      aria-label={tooltipText}
      title={tooltipText}
    >
      <Icon className="w-5 h-5 text-foreground transition-transform duration-200" />
    </button>
  );
}

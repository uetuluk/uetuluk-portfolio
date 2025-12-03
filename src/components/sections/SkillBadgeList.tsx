import { cn } from "@/lib/utils";
import portfolioContent from "@/content/portfolio.json";

interface SkillBadgeListProps {
  title: string;
  skills?: string[];
  style?: "compact" | "detailed";
  className?: string;
}

export function SkillBadgeList({
  title,
  skills = portfolioContent.skills,
  style = "compact",
  className,
}: SkillBadgeListProps) {
  return (
    <section className={cn("py-8", className)}>
      <h2 className="text-2xl font-bold mb-6">{title}</h2>

      <div
        className={cn(
          "flex flex-wrap",
          style === "compact" ? "gap-2" : "gap-3"
        )}
      >
        {skills.map((skill) => (
          <span
            key={skill}
            className={cn(
              "inline-flex items-center font-medium rounded-full border transition-colors",
              "hover:border-primary hover:bg-primary/5",
              style === "compact"
                ? "px-3 py-1 text-sm"
                : "px-4 py-2 text-base"
            )}
          >
            {skill}
          </span>
        ))}
      </div>
    </section>
  );
}

import { cn } from "@/lib/utils";

interface TextBlockProps {
  title: string;
  content: string;
  style?: "prose" | "highlight";
  className?: string;
}

export function TextBlock({
  title,
  content,
  style = "prose",
  className,
}: TextBlockProps) {
  return (
    <section className={cn("py-8", className)}>
      <h2 className="text-2xl font-bold mb-6">{title}</h2>

      <div
        className={cn(
          "rounded-lg",
          style === "highlight"
            ? "bg-primary/5 border border-primary/20 p-6"
            : "prose prose-neutral dark:prose-invert max-w-none"
        )}
      >
        {style === "highlight" ? (
          <blockquote className="text-lg italic text-foreground/90 border-l-4 border-primary pl-4">
            {content}
          </blockquote>
        ) : (
          <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {content}
          </p>
        )}
      </div>
    </section>
  );
}

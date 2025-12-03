import { cn } from "@/lib/utils";
import portfolioContent from "@/content/portfolio.json";

interface Project {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  image: string;
  links: {
    demo?: string;
    github?: string;
  };
  tags: string[];
}

interface ProjectCardGridProps {
  title: string;
  columns?: 2 | 3 | 4;
  items: string[] | Project[];
  className?: string;
}

export function ProjectCardGrid({
  title,
  columns = 3,
  items,
  className,
}: ProjectCardGridProps) {
  // Resolve project IDs to full project objects
  const projects = items.map((item) => {
    if (typeof item === "string") {
      return portfolioContent.projects.find((p) => p.id === item) || null;
    }
    return item;
  }).filter(Boolean) as Project[];

  const gridCols = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-2 lg:grid-cols-3",
    4: "md:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <section className={cn("py-8", className)}>
      <h2 className="text-2xl font-bold mb-6">{title}</h2>

      <div className={cn("grid gap-6", gridCols[columns])}>
        {projects.map((project) => (
          <div
            key={project.id}
            className="group rounded-xl border bg-card overflow-hidden hover:shadow-lg transition-all duration-300"
          >
            {/* Project image */}
            <div className="aspect-video bg-muted overflow-hidden">
              <img
                src={project.image}
                alt={project.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='225' viewBox='0 0 400 225'%3E%3Crect fill='%23f3f4f6' width='400' height='225'/%3E%3Ctext fill='%239ca3af' font-family='sans-serif' font-size='24' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle'%3EProject%3C/text%3E%3C/svg%3E";
                }}
              />
            </div>

            {/* Project info */}
            <div className="p-4">
              <h3 className="font-semibold text-lg mb-2">{project.title}</h3>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {project.description}
              </p>

              {/* Technologies */}
              <div className="flex flex-wrap gap-1 mb-4">
                {project.technologies.slice(0, 4).map((tech) => (
                  <span
                    key={tech}
                    className="px-2 py-0.5 text-xs bg-secondary rounded-full"
                  >
                    {tech}
                  </span>
                ))}
              </div>

              {/* Links */}
              <div className="flex gap-3">
                {project.links.demo && (
                  <a
                    href={project.links.demo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Demo →
                  </a>
                )}
                {project.links.github && (
                  <a
                    href={project.links.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    GitHub →
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

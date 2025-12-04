import { cn } from '@/lib/utils';
import portfolioContent from '@/content/portfolio.json';

interface Experience {
  id: string;
  company: string;
  role: string;
  period: string;
  description: string;
  highlights?: string[];
}

interface ExperienceTimelineProps {
  title: string;
  items?: string[] | Experience[];
  className?: string;
}

export function ExperienceTimeline({
  title,
  items = portfolioContent.experience,
  className,
}: ExperienceTimelineProps) {
  // Resolve experience IDs to full objects
  const experiences = items
    .map((item) => {
      if (typeof item === 'string') {
        return portfolioContent.experience.find((e) => e.id === item) || null;
      }
      return item;
    })
    .filter(Boolean) as Experience[];

  return (
    <section className={cn('py-8', className)}>
      <h2 className="text-2xl font-bold mb-8">{title}</h2>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

        {/* Timeline items */}
        <div className="space-y-8">
          {experiences.map((exp, index) => (
            <div key={exp.id} className="relative pl-12">
              {/* Timeline dot */}
              <div
                className={cn(
                  'absolute left-2.5 w-3 h-3 rounded-full border-2 border-background',
                  index === 0 ? 'bg-primary' : 'bg-muted-foreground',
                )}
              />

              <div className="bg-card rounded-lg border p-6 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{exp.role}</h3>
                    <p className="text-muted-foreground">{exp.company}</p>
                  </div>
                  <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full w-fit">
                    {exp.period}
                  </span>
                </div>

                <p className="text-muted-foreground mb-4">{exp.description}</p>

                {exp.highlights && exp.highlights.length > 0 && (
                  <ul className="space-y-2">
                    {exp.highlights.map((highlight, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-primary mt-1">✓</span>
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

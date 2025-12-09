import { cn } from '@/lib/utils';

interface HeroSectionProps {
  title: string;
  subtitle: string;
  image?: string;
  cta?: {
    text: string;
    href: string;
  };
  className?: string;
}

export function HeroSection({ title, subtitle, image, cta, className }: HeroSectionProps) {
  return (
    <section className={cn('flex flex-col md:flex-row items-center gap-8 py-12', className)}>
      {image && (
        <div className="shrink-0">
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden bg-muted border-4 border-background shadow-xl">
            <img
              src={image}
              alt={title}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to placeholder if image fails to load
                (e.target as HTMLImageElement).src =
                  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'%3E%3Crect fill='%23e5e7eb' width='160' height='160'/%3E%3Ctext fill='%239ca3af' font-family='sans-serif' font-size='48' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle'%3E?%3C/text%3E%3C/svg%3E";
              }}
            />
          </div>
        </div>
      )}

      <div className="text-center md:text-left">
        <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-linear-to-r from-foreground to-foreground/70 bg-clip-text">
          {title}
        </h1>
        <p className="text-xl text-muted-foreground mb-6">{subtitle}</p>

        {cta && (
          <a
            href={cta.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            {cta.text}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </a>
        )}
      </div>
    </section>
  );
}

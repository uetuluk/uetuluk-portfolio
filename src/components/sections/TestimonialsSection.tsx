import { cn } from '@/lib/utils';

interface Testimonial {
  quote: string;
  author: string;
  role?: string;
  company?: string;
}

interface TestimonialsSectionProps {
  title: string;
  items: Testimonial[];
  className?: string;
}

export function TestimonialsSection({
  title,
  items,
  className,
}: TestimonialsSectionProps) {
  return (
    <section className={cn('py-8', className)}>
      <h2 className="text-2xl font-bold mb-6">{title}</h2>

      <div className="space-y-6">
        {items.map((testimonial, index) => (
          <div
            key={index}
            className="p-6 rounded-lg bg-muted/30 border border-border"
          >
            {/* Quote icon */}
            <svg
              className="w-8 h-8 text-primary/30 mb-4"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
            </svg>

            <blockquote className="text-lg italic text-foreground/90 mb-4">
              "{testimonial.quote}"
            </blockquote>

            <div className="flex items-center gap-3">
              {/* Avatar placeholder */}
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium">
                {testimonial.author.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-medium text-foreground">
                  {testimonial.author}
                </div>
                {(testimonial.role || testimonial.company) && (
                  <div className="text-sm text-muted-foreground">
                    {[testimonial.role, testimonial.company].filter(Boolean).join(' at ')}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

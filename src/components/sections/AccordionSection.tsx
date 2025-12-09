import { useState } from 'react';
import { cn } from '@/lib/utils';

interface AccordionItem {
  question: string;
  answer: string;
}

interface AccordionSectionProps {
  title: string;
  items: AccordionItem[];
  defaultOpen?: number;
  className?: string;
}

export function AccordionSection({
  title,
  items,
  defaultOpen,
  className,
}: AccordionSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(defaultOpen ?? null);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className={cn('py-8', className)}>
      <h2 className="text-2xl font-bold mb-6">{title}</h2>

      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={index}
            className="border border-border rounded-lg overflow-hidden"
          >
            <button
              type="button"
              onClick={() => toggleItem(index)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
              aria-expanded={openIndex === index}
            >
              <span className="font-medium">{item.question}</span>
              <svg
                className={cn(
                  'w-5 h-5 text-muted-foreground transition-transform duration-200',
                  openIndex === index && 'rotate-180'
                )}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            <div
              className={cn(
                'overflow-hidden transition-all duration-200',
                openIndex === index ? 'max-h-96' : 'max-h-0'
              )}
            >
              <div className="p-4 pt-0 text-muted-foreground">
                {item.answer}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

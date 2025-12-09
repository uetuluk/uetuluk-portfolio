import { useState } from 'react';
import { cn } from '@/lib/utils';

interface Tab {
  label: string;
  content: string;
}

interface TabsSectionProps {
  title: string;
  tabs: Tab[];
  defaultTab?: number;
  className?: string;
}

export function TabsSection({
  title,
  tabs,
  defaultTab = 0,
  className,
}: TabsSectionProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <section className={cn('py-8', className)}>
      <h2 className="text-2xl font-bold mb-6">{title}</h2>

      <div className="border border-border rounded-lg overflow-hidden">
        {/* Tab headers */}
        <div className="flex border-b border-border bg-muted/30" role="tablist">
          {tabs.map((tab, index) => (
            <button
              key={index}
              type="button"
              role="tab"
              aria-selected={activeTab === index}
              onClick={() => setActiveTab(index)}
              className={cn(
                'flex-1 px-4 py-3 text-sm font-medium transition-colors',
                'hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset',
                activeTab === index
                  ? 'bg-background text-foreground border-b-2 border-primary -mb-px'
                  : 'text-muted-foreground'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-4" role="tabpanel">
          <p className="text-muted-foreground whitespace-pre-wrap">
            {tabs[activeTab]?.content}
          </p>
        </div>
      </div>
    </section>
  );
}

import { cn } from '@/lib/utils';

interface Stat {
  label: string;
  value: string;
  description?: string;
}

interface StatsSectionProps {
  title: string;
  stats: Stat[];
  columns?: 2 | 3 | 4;
  className?: string;
}

const columnsMap = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
};

export function StatsSection({
  title,
  stats,
  columns = 3,
  className,
}: StatsSectionProps) {
  return (
    <section className={cn('py-8', className)}>
      <h2 className="text-2xl font-bold mb-6">{title}</h2>

      <div className={cn('grid gap-4', columnsMap[columns])}>
        {stats.map((stat, index) => (
          <div
            key={index}
            className="p-6 rounded-lg bg-muted/30 border border-border text-center"
          >
            <div className="text-3xl font-bold text-primary mb-1">
              {stat.value}
            </div>
            <div className="text-sm font-medium text-foreground">
              {stat.label}
            </div>
            {stat.description && (
              <div className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

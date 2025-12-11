import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import {
  Calendar,
  Code,
  Star,
  Cpu,
  Users,
  Briefcase,
  Award,
  GitBranch,
  Zap,
  Globe,
  type LucideIcon,
} from 'lucide-react';

interface Stat {
  label: string;
  value: number;
  suffix?: string;
  icon?: string;
}

interface StatsCounterProps {
  title: string;
  stats: Stat[];
  animated?: boolean;
  className?: string;
}

// Map icon names to lucide components
const iconMap: Record<string, LucideIcon> = {
  Calendar,
  Code,
  Star,
  Cpu,
  Users,
  Briefcase,
  Award,
  GitBranch,
  Zap,
  Globe,
};

function AnimatedNumber({
  value,
  suffix = '',
  animate,
}: {
  value: number;
  suffix?: string;
  animate: boolean;
}) {
  // Use lazy initial state to avoid setting state in effect
  const [displayValue, setDisplayValue] = useState(() => (animate ? 0 : value));

  useEffect(() => {
    if (!animate) {
      return;
    }

    const duration = 2000; // 2 seconds
    const startTime = Date.now();
    const startValue = 0;

    const animateValue = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (value - startValue) * easeOut);

      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animateValue);
      }
    };

    requestAnimationFrame(animateValue);
  }, [value, animate]);

  return (
    <span className="text-4xl md:text-5xl font-bold text-primary">
      {displayValue.toLocaleString()}
      {suffix}
    </span>
  );
}

export function StatsCounter({ title, stats, animated = true, className }: StatsCounterProps) {
  // Use lazy initial state to avoid setting state in effect
  const [isVisible, setIsVisible] = useState(() => !animated);
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!animated) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.2 },
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [animated]);

  return (
    <section ref={containerRef} className={cn('py-8', className)}>
      <h2 className="text-2xl font-bold mb-8">{title}</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon ? iconMap[stat.icon] : null;

          return (
            <div
              key={index}
              className="flex flex-col items-center text-center p-6 rounded-xl bg-card border transition-shadow hover:shadow-md"
            >
              {IconComponent && <IconComponent className="w-8 h-8 mb-3 text-muted-foreground" />}
              <AnimatedNumber
                value={stat.value}
                suffix={stat.suffix}
                animate={isVisible && animated}
              />
              <span className="mt-2 text-sm text-muted-foreground">{stat.label}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

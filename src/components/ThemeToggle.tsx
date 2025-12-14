import { useTranslation } from 'react-i18next';
import { Sun, Moon, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { t } = useTranslation();
  const { preference, toggleTheme, isDark } = useTheme();

  const Icon = preference === 'system' ? Monitor : isDark ? Moon : Sun;

  const tooltipText =
    preference === 'system'
      ? isDark
        ? t('theme.switchToLight')
        : t('theme.switchToDark')
      : t('theme.useSystem');

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'fixed bottom-6 right-6 z-50',
        'w-12 h-12 rounded-full',
        'bg-card border border-border shadow-lg',
        'hover:bg-accent hover:scale-110',
        'focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2',
        'transition-all duration-200 ease-in-out',
        'flex items-center justify-center',
        className,
      )}
      aria-label={tooltipText}
      title={tooltipText}
      data-testid="theme-toggle"
    >
      <Icon className="w-5 h-5 text-foreground transition-transform duration-200" />
    </button>
  );
}

import { useTranslation } from 'react-i18next';
import type { VisitorType, GeneratedLayout } from '@/App';
import { ComponentMapper } from './ComponentMapper';
import { FeedbackButtons } from './FeedbackButtons';
import { SEO } from './SEO';
import { cn } from '@/lib/utils';

interface GeneratedPageProps {
  layout: GeneratedLayout | null;
  visitorType: VisitorType;
  onReset: () => void;
  onRegenerate: () => void;
  error: string | null;
}

export function GeneratedPage({
  layout,
  visitorType,
  onReset,
  onRegenerate,
  error,
}: GeneratedPageProps) {
  const { t } = useTranslation();

  if (!layout) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">{t('errors.title')}</h2>
          <p className="text-muted-foreground mb-6">{error || t('errors.defaultMessage')}</p>
          <button
            onClick={onReset}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            {t('errors.tryAgain')}
          </button>
        </div>
      </div>
    );
  }

  const layoutClasses = {
    'single-column': 'max-w-3xl mx-auto',
    'two-column': 'max-w-6xl mx-auto',
    'hero-focused': 'max-w-5xl mx-auto',
  };

  // Get translated visitor type label for SEO
  const visitorTypeLabel = visitorType ? t(`visitorTypes.${visitorType}.label`) : undefined;

  return (
    <div className="min-h-screen bg-background">
      {/* Dynamic SEO based on visitor type */}
      {visitorTypeLabel && <SEO title={`${t('seo.portfolioFor')} ${visitorTypeLabel}`} />}

      {/* Navigation bar */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <span className="font-semibold">{t('navigation.portfolio')}</span>
          <div className="flex items-center gap-4">
            <FeedbackButtons
              audienceType={visitorType || 'unknown'}
              cacheKey={layout?._cacheKey || ''}
              onRegenerate={onRegenerate}
            />
            <button
              onClick={onReset}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t('navigation.changePerspective')}
            </button>
          </div>
        </div>
      </nav>

      {/* Visitor type indicator */}
      {error && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 px-4 py-2 text-center text-sm">
          <span className="text-yellow-800 dark:text-yellow-200">{t('errors.fallbackNotice')}</span>
        </div>
      )}

      {/* Main content */}
      <main className={cn('px-4 py-8', layoutClasses[layout.layout])}>
        <div className={cn(layout.layout === 'two-column' && 'grid md:grid-cols-2 gap-8')}>
          {layout.sections.map((section, index) => (
            <ComponentMapper key={index} section={section} />
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-16">
        <div className="max-w-6xl mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>
            {t('footer.personalizedFor')}{' '}
            <span className="font-medium text-foreground capitalize">
              {visitorType ? t(`visitorTypes.${visitorType}.label`) : visitorType}
            </span>
            .
          </p>
          <p className="mt-2">{t('footer.poweredBy')}</p>
        </div>
      </footer>
    </div>
  );
}

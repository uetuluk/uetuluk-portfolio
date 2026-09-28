import { useTranslation } from 'react-i18next';
import { Renderer, type OpenUIError } from '@openuidev/react-lang';
import type { VisitorType } from '@/App';
import { portfolioLibrary } from '@/genui/library';
import { FeedbackButtons } from './FeedbackButtons';
import { SEO } from './SEO';

interface GeneratedPageProps {
  /** OpenUI Lang for the page; grows while streaming. */
  lang: string;
  isStreaming: boolean;
  layoutToken?: string;
  visitorType: VisitorType;
  onReset: () => void;
  onRegenerate: () => void;
  error: string | null;
}

// Parser errors are expected mid-stream (e.g. a reference not yet defined); only log once settled.
function logRenderErrors(errors: OpenUIError[]) {
  if (errors.length > 0) console.warn('Generated layout issues:', errors);
}

export function GeneratedPage({
  lang,
  isStreaming,
  layoutToken,
  visitorType,
  onReset,
  onRegenerate,
  error,
}: GeneratedPageProps) {
  const { t } = useTranslation();

  if (!lang && !isStreaming) {
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

  // Get translated visitor type label for SEO
  const visitorTypeLabel = visitorType ? t(`visitorTypes.${visitorType}.label`) : undefined;

  return (
    <div className="min-h-screen bg-background">
      {/* Dynamic SEO based on visitor type */}
      {visitorTypeLabel && <SEO title={`${t('seo.portfolioFor')} ${visitorTypeLabel}`} />}

      {/* Navigation bar */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-xs border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <span className="font-semibold">{t('navigation.portfolio')}</span>
          <div className="flex items-center gap-4">
            <FeedbackButtons
              audienceType={visitorType || 'unknown'}
              layoutToken={layoutToken}
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

      {/* Main content: the PortfolioPage root component owns layout and theming */}
      <div aria-busy={isStreaming}>
        <Renderer
          library={portfolioLibrary}
          response={lang}
          isStreaming={isStreaming}
          onError={isStreaming ? undefined : logRenderErrors}
        />
      </div>

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

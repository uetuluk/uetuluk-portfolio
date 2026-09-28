import { lazy, Suspense, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { WelcomeModal } from '@/components/WelcomeModal';
import { LoadingScreen } from '@/components/LoadingScreen';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { SEO } from '@/components/SEO';
import { StructuredData } from '@/components/StructuredData';
import { useTheme } from '@/hooks/useTheme';
import { useTranslatedPortfolio } from '@/hooks/useTranslatedPortfolio';
import { useGeneratedLayout } from '@/genui/useGeneratedLayout';
import type { GenerateMeta } from '@/genui/protocol';

export type VisitorType = 'recruiter' | 'developer' | 'collaborator' | 'friend' | null;

// The generated page carries the renderer, component library, charts and schema validation.
// Load it separately and prefetch while the visitor is still choosing in the welcome modal.
const loadGeneratedPage = () => import('@/components/GeneratedPage');
const GeneratedPage = lazy(() => loadGeneratedPage().then((m) => ({ default: m.GeneratedPage })));
const loadFallback = () => import('@/genui/fallback');

function App() {
  const { t, i18n } = useTranslation();
  const portfolioContent = useTranslatedPortfolio();
  const [visitorType, setVisitorType] = useState<VisitorType>(null);
  const [customIntent, setCustomIntent] = useState<string>('');
  const layout = useGeneratedLayout();

  // Access theme hook to apply suggested theme based on visitor context
  const { setTheme, preference } = useTheme();

  useEffect(() => {
    void loadGeneratedPage();
  }, []);

  // Update document language when i18n language changes
  useEffect(() => {
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  // Apply the suggested theme on a visitor's first visit, unless they chose one explicitly
  const applyThemeSuggestion = (meta: GenerateMeta) => {
    const suggested = meta.uiHints?.suggestedTheme;
    if (suggested && suggested !== 'system' && preference === 'system') {
      if (!localStorage.getItem('portfolio-visited')) {
        setTheme(suggested);
        localStorage.setItem('portfolio-visited', 'true');
      }
    }
  };

  const generate = (
    type: VisitorType,
    custom: string | undefined,
    failureMessage: string,
    onMeta?: (meta: GenerateMeta) => void,
  ) =>
    layout.generate(
      {
        visitorTag: type ?? 'friend',
        customIntent: custom || undefined,
        language: i18n.resolvedLanguage,
        portfolioContent,
      },
      {
        failureMessage,
        onMeta,
        fallback: async () => {
          const { buildFallbackLayout, DEFAULT_FALLBACK_TITLES } = await loadFallback();
          return buildFallbackLayout(type, portfolioContent, {
            ...DEFAULT_FALLBACK_TITLES,
            skills: t('fallbackSections.skills'),
            experience: t('fallbackSections.experience'),
            projects: t('fallbackSections.projects'),
            featuredProjects: t('fallbackSections.featuredProjects'),
            aboutMe: t('fallbackSections.aboutMe'),
            photos: t('fallbackSections.photos'),
            letsConnect: t('fallbackSections.letsConnect'),
            getInTouch: t('fallbackSections.getInTouch'),
          });
        },
      },
    );

  const handleVisitorSelect = async (type: VisitorType, custom?: string) => {
    setVisitorType(type);
    setCustomIntent(custom || '');
    // Apply the theme hint as soon as it arrives so the page doesn't switch theme mid-stream
    const meta = await generate(type, custom, t('errors.failedGenerate'), applyThemeSuggestion);
    if (meta?.rateLimited) console.info('Rate limited - showing default layout');
  };

  const handleReset = () => {
    setVisitorType(null);
    setCustomIntent('');
    layout.reset();
  };

  const handleRegenerate = async () => {
    if (!visitorType) return;
    await generate(visitorType, customIntent, t('errors.failedRegenerate'));
  };

  // Show the loading screen only until the first part of the page streams in
  const waitingForFirstContent = layout.isStreaming && !layout.lang;

  return (
    <>
      <SEO />
      <StructuredData />
      <LanguageSwitcher />
      <ThemeToggle />
      {!visitorType ? (
        <WelcomeModal onSelect={handleVisitorSelect} />
      ) : waitingForFirstContent ? (
        <LoadingScreen visitorType={visitorType} />
      ) : (
        <Suspense fallback={<LoadingScreen visitorType={visitorType} />}>
          <GeneratedPage
            lang={layout.lang}
            isStreaming={layout.isStreaming}
            layoutToken={layout.meta?.layoutToken}
            visitorType={visitorType}
            onReset={handleReset}
            onRegenerate={handleRegenerate}
            error={layout.error}
          />
        </Suspense>
      )}
    </>
  );
}

export default App;

import { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { supportedLanguages, languageNames, type SupportedLanguage } from '@/i18n';

interface LanguageSwitcherProps {
  className?: string;
}

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const currentLanguage = i18n.language as SupportedLanguage;

  // Sync document lang attribute with i18n language
  useEffect(() => {
    document.documentElement.lang = currentLanguage;
  }, [currentLanguage]);

  const handleLanguageChange = (lang: SupportedLanguage) => {
    i18n.changeLanguage(lang);
    // eslint-disable-next-line react-hooks/immutability -- DOM manipulation is valid here
    document.documentElement.lang = lang;
    setIsOpen(false);
  };

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'fixed bottom-20 right-6 z-50',
          'w-12 h-12 rounded-full',
          'bg-card border border-border shadow-lg',
          'hover:bg-accent hover:scale-110',
          'focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2',
          'transition-all duration-200 ease-in-out',
          'flex items-center justify-center',
        )}
        aria-label={t('language.changeLanguage')}
        title={t('language.changeLanguage')}
        data-testid="language-switcher"
      >
        <Globe className="w-5 h-5 text-foreground" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          {/* Dropdown */}
          <div className="fixed bottom-34 right-6 z-50 bg-card border border-border rounded-lg shadow-lg p-2 min-w-[140px]">
            {supportedLanguages.map((lang) => (
              <button
                key={lang}
                onClick={() => handleLanguageChange(lang)}
                className={cn(
                  'block w-full text-left px-3 py-2 rounded text-sm transition-colors',
                  currentLanguage === lang
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent',
                )}
                data-testid={`language-option-${lang}`}
              >
                {languageNames[lang]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

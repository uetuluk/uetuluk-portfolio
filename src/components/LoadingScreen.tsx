import { useTranslation } from 'react-i18next';
import type { VisitorType } from '@/App';
import { ClipLoader } from 'react-spinners';

interface LoadingScreenProps {
  visitorType: VisitorType;
}

export function LoadingScreen({ visitorType }: LoadingScreenProps) {
  const { t } = useTranslation();

  const messages = visitorType
    ? (t(`loading.${visitorType}`, { returnObjects: true }) as string[])
    : [];

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-background to-muted">
      <div className="text-center max-w-md mx-auto px-4">
        {/* Animated logo/spinner */}
        <div className="mb-8">
          <ClipLoader
            color="hsl(var(--primary))"
            size={80}
            speedMultiplier={0.5}
            aria-label="Loading"
          />
        </div>

        {/* Main message */}
        <h2 className="text-2xl font-semibold mb-3">{t('loading.title')}</h2>
        <p className="text-muted-foreground mb-8">{t('loading.subtitle')}</p>

        {/* Animated messages */}
        <div className="space-y-2">
          {messages.map((message, index) => (
            <div
              key={index}
              className="text-sm text-muted-foreground animate-pulse"
              style={{
                animationDelay: `${index * 0.5}s`,
                animationDuration: '2s',
              }}
            >
              {message}
            </div>
          ))}
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mt-8">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-primary animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

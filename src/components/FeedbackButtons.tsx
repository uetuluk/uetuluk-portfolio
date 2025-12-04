import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ThumbsUp, ThumbsDown, Share2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSessionId } from '@/hooks/useSessionId';

type FeedbackState = 'idle' | 'loading' | 'liked' | 'disliked' | 'rate-limited';

interface FeedbackRequest {
  feedbackType: 'like' | 'dislike';
  audienceType: string;
  cacheKey: string;
  sessionId: string;
}

interface FeedbackResponse {
  success: boolean;
  message: string;
  regenerate?: boolean;
  rateLimited?: boolean;
  retryAfter?: number;
}

interface FeedbackButtonsProps {
  audienceType: string;
  cacheKey: string;
  onRegenerate: () => void;
}

export function FeedbackButtons({ audienceType, cacheKey, onRegenerate }: FeedbackButtonsProps) {
  const { t } = useTranslation();
  const [feedbackState, setFeedbackState] = useState<FeedbackState>('idle');
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [retryAfter, setRetryAfter] = useState(0);
  const sessionId = useSessionId();

  // Countdown timer for rate limit
  useEffect(() => {
    if (feedbackState === 'rate-limited' && retryAfter > 0) {
      const timer = setInterval(() => {
        setRetryAfter((prev) => {
          if (prev <= 1) {
            setFeedbackState('idle');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [feedbackState, retryAfter]);

  const submitFeedback = async (type: 'like' | 'dislike') => {
    setFeedbackState('loading');

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedbackType: type,
          audienceType,
          cacheKey,
          sessionId,
        } as FeedbackRequest),
      });

      const data = (await response.json()) as FeedbackResponse;

      if (data.rateLimited) {
        setFeedbackState('rate-limited');
        setRetryAfter(data.retryAfter || 60);
        return;
      }

      if (type === 'like') {
        setFeedbackState('liked');
        setShowShareOptions(true);
      } else if (type === 'dislike' && data.regenerate) {
        setFeedbackState('disliked');
        // Trigger regeneration after brief delay
        setTimeout(() => onRegenerate(), 500);
      }
    } catch (error) {
      console.error('Feedback error:', error);
      setFeedbackState('idle');
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: t('feedback.shareTitle'),
      text: t('feedback.shareText'),
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(window.location.href);
        alert(t('feedback.linkCopied'));
      }
    } catch (error) {
      // User cancelled share or error occurred
      console.error('Share error:', error);
    }
  };

  // Liked state with share option
  if (feedbackState === 'liked') {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
          <Check className="w-4 h-4" />
          {t('feedback.thanks')}
        </span>
        {showShareOptions && (
          <button
            onClick={handleShare}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Share2 className="w-4 h-4" />
            {t('feedback.share')}
          </button>
        )}
      </div>
    );
  }

  // Disliked state (regenerating)
  if (feedbackState === 'disliked') {
    return <span className="text-sm text-muted-foreground">{t('feedback.regenerating')}</span>;
  }

  // Rate limited state
  if (feedbackState === 'rate-limited') {
    return (
      <span className="text-sm text-orange-600 dark:text-orange-400">
        {t('feedback.rateLimited', { seconds: retryAfter })}
      </span>
    );
  }

  // Loading state
  if (feedbackState === 'loading') {
    return <span className="text-sm text-muted-foreground">{t('feedback.sending')}</span>;
  }

  // Default idle state
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => submitFeedback('like')}
        className={cn(
          'p-2 rounded-lg transition-colors',
          'text-muted-foreground hover:text-green-600 hover:bg-green-50',
          'dark:hover:text-green-400 dark:hover:bg-green-900/20',
        )}
        title={t('feedback.likeTooltip')}
      >
        <ThumbsUp className="w-4 h-4" />
      </button>
      <button
        onClick={() => submitFeedback('dislike')}
        className={cn(
          'p-2 rounded-lg transition-colors',
          'text-muted-foreground hover:text-red-600 hover:bg-red-50',
          'dark:hover:text-red-400 dark:hover:bg-red-900/20',
        )}
        title={t('feedback.dislikeTooltip')}
      >
        <ThumbsDown className="w-4 h-4" />
      </button>
    </div>
  );
}

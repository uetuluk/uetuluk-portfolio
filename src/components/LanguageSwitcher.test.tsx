import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LanguageSwitcher } from './LanguageSwitcher';

// Mock i18n module
vi.mock('@/i18n', () => ({
  supportedLanguages: ['en', 'zh', 'ja', 'tr'],
  languageNames: {
    en: 'English',
    zh: '中文',
    ja: '日本語',
    tr: 'Türkçe',
  },
}));

// Mock react-i18next
const mockChangeLanguage = vi.fn();
let mockCurrentLanguage = 'en';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'language.changeLanguage': 'Change language',
      };
      return translations[key] || key;
    },
    i18n: {
      get language() {
        return mockCurrentLanguage;
      },
      changeLanguage: mockChangeLanguage,
    },
  }),
}));

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCurrentLanguage = 'en';
  });

  it('renders globe button with aria-label', () => {
    render(<LanguageSwitcher />);

    const button = screen.getByRole('button', { name: 'Change language' });
    expect(button).toBeInTheDocument();
  });

  it('dropdown is hidden by default', () => {
    render(<LanguageSwitcher />);

    expect(screen.queryByText('English')).not.toBeInTheDocument();
    expect(screen.queryByText('中文')).not.toBeInTheDocument();
  });

  it('clicking globe button opens dropdown', () => {
    render(<LanguageSwitcher />);

    const button = screen.getByRole('button', { name: 'Change language' });
    fireEvent.click(button);

    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('中文')).toBeInTheDocument();
    expect(screen.getByText('日本語')).toBeInTheDocument();
    expect(screen.getByText('Türkçe')).toBeInTheDocument();
  });

  it('shows all 4 language options in dropdown', () => {
    render(<LanguageSwitcher />);

    fireEvent.click(screen.getByRole('button', { name: 'Change language' }));

    const languageButtons = screen
      .getAllByRole('button')
      .filter(
        (btn) =>
          btn.textContent && ['English', '中文', '日本語', 'Türkçe'].includes(btn.textContent),
      );
    expect(languageButtons).toHaveLength(4);
  });

  it('current language is highlighted', () => {
    mockCurrentLanguage = 'en';
    render(<LanguageSwitcher />);

    fireEvent.click(screen.getByRole('button', { name: 'Change language' }));

    const englishButton = screen.getByText('English');
    expect(englishButton).toHaveClass('bg-primary');
  });

  it('non-current language is not highlighted', () => {
    mockCurrentLanguage = 'en';
    render(<LanguageSwitcher />);

    fireEvent.click(screen.getByRole('button', { name: 'Change language' }));

    const chineseButton = screen.getByText('中文');
    expect(chineseButton).not.toHaveClass('bg-primary');
  });

  it('clicking language option calls i18n.changeLanguage', () => {
    render(<LanguageSwitcher />);

    fireEvent.click(screen.getByRole('button', { name: 'Change language' }));
    fireEvent.click(screen.getByText('中文'));

    expect(mockChangeLanguage).toHaveBeenCalledWith('zh');
  });

  it('clicking language option sets document.documentElement.lang', () => {
    render(<LanguageSwitcher />);

    fireEvent.click(screen.getByRole('button', { name: 'Change language' }));
    fireEvent.click(screen.getByText('日本語'));

    expect(document.documentElement.lang).toBe('ja');
  });

  it('clicking language option closes dropdown', () => {
    render(<LanguageSwitcher />);

    fireEvent.click(screen.getByRole('button', { name: 'Change language' }));
    expect(screen.getByText('English')).toBeInTheDocument();

    fireEvent.click(screen.getByText('中文'));

    expect(screen.queryByText('English')).not.toBeInTheDocument();
  });

  it('clicking backdrop closes dropdown', () => {
    render(<LanguageSwitcher />);

    fireEvent.click(screen.getByRole('button', { name: 'Change language' }));
    expect(screen.getByText('English')).toBeInTheDocument();

    // The backdrop is a fixed div with inset-0
    const backdrop = document.querySelector('.fixed.inset-0');
    expect(backdrop).toBeInTheDocument();
    fireEvent.click(backdrop!);

    expect(screen.queryByText('English')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<LanguageSwitcher className="custom-class" />);

    const container = screen.getByRole('button', { name: 'Change language' }).parentElement;
    expect(container).toHaveClass('custom-class');
  });

  it('has fixed positioning classes on button', () => {
    render(<LanguageSwitcher />);

    const button = screen.getByRole('button', { name: 'Change language' });
    expect(button).toHaveClass('fixed');
    expect(button).toHaveClass('bottom-20');
    expect(button).toHaveClass('right-6');
  });
});

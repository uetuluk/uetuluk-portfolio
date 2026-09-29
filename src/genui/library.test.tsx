import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Renderer } from '@openuidev/react-lang';
import { portfolioLibrary } from './library';
import { ROOT_COMPONENT, SECTION_NAMES } from './schema';

const applyPaletteToRoot = vi.hoisted(() => vi.fn());
vi.mock('@/lib/applyPalette', () => ({ applyPaletteToRoot }));

function renderLang(lang: string) {
  return render(<Renderer library={portfolioLibrary} response={lang} isStreaming={false} />);
}

const page = (accent: string, sections: string[]) =>
  [
    `root = PortfolioPage("single-column", "${accent}", [${sections.map((_, i) => `s${i}`).join(', ')}])`,
  ]
    .concat(sections.map((s, i) => `s${i} = ${s}`))
    .join('\n');

describe('portfolioLibrary', () => {
  beforeEach(() => applyPaletteToRoot.mockClear());

  it('registers a renderer for the root and every section in the contract', () => {
    expect(Object.keys(portfolioLibrary.components).sort()).toEqual(
      [ROOT_COMPONENT, ...SECTION_NAMES].sort(),
    );
    expect(portfolioLibrary.root).toBe(ROOT_COMPONENT);
  });

  it('themes the site from the model-selected accent', () => {
    renderLang(page('purple', ['Callout("Hi", "There")']));

    expect(applyPaletteToRoot).toHaveBeenCalledTimes(1);
  });

  it('does not theme until the accent has streamed in', () => {
    render(
      <Renderer
        library={portfolioLibrary}
        response={'root = PortfolioPage("single-column"'}
        isStreaming
      />,
    );

    expect(applyPaletteToRoot).not.toHaveBeenCalled();
  });

  it('does not load a chart until the page has finished streaming', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(() => new Promise(() => {}));
    const lang = page('blue', [
      'DataChart("GitHub Activity", [{source: "github", type: "area", githubUsername: "uetuluk"}])',
    ]);
    const { rerender } = render(
      <Renderer library={portfolioLibrary} response={lang} isStreaming />,
    );
    expect(screen.queryByText('GitHub Activity')).not.toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();

    rerender(<Renderer library={portfolioLibrary} response={lang} isStreaming={false} />);

    expect(await screen.findByText('GitHub Activity')).toBeInTheDocument();
    fetchSpy.mockRestore();
  });

  it('scopes react-ui theme tokens to the generated page', () => {
    const { container } = renderLang(page('blue', ['Callout("Hi", "There")']));

    expect(container.querySelector('main.genui')).toBeInTheDocument();
  });

  describe('@openuidev/react-ui components', () => {
    it('renders a Callout', () => {
      const { container } = renderLang(
        page('blue', [
          'Callout("Open to new roles", "Especially applied AI infrastructure.", "info")',
        ]),
      );

      expect(screen.getByText('Open to new roles')).toBeInTheDocument();
      expect(screen.getByText('Especially applied AI infrastructure.')).toBeInTheDocument();
      expect(container.querySelector('.openui-callout-info')).toBeInTheDocument();
    });

    it('defaults a Callout without a variant to neutral', () => {
      const { container } = renderLang(page('blue', ['Callout("Note", "Text")']));

      expect(container.querySelector('.openui-callout-neutral')).toBeInTheDocument();
    });

    it('renders an FAQ that expands to show answers', () => {
      renderLang(
        page('blue', [
          'FAQ("Questions", [{question: "Remote?", answer: "Yes, fully remote."}, {question: "Timezone?", answer: "UTC+8."}])',
        ]),
      );

      expect(screen.getByRole('heading', { name: 'Questions' })).toBeInTheDocument();
      const trigger = screen.getByRole('button', { name: /Remote\?/ });
      expect(trigger).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(trigger);

      expect(trigger).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByText('Yes, fully remote.')).toBeVisible();
    });

    it('renders numbered Steps', () => {
      renderLang(
        page('blue', [
          'Steps("How we work", [{title: "Discovery", details: "A short call."}, {title: "Pilot", details: "Ship something small."}])',
        ]),
      );

      expect(screen.getByRole('heading', { name: 'How we work' })).toBeInTheDocument();
      expect(screen.getByText('Discovery')).toBeInTheDocument();
      expect(screen.getByText('Ship something small.')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('does not render an FAQ whose items are all invalid', () => {
      renderLang(page('blue', ['FAQ("Questions", [{question: "No answer"}])']));

      expect(screen.getByRole('heading', { name: 'Questions' })).toBeInTheDocument();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });
});

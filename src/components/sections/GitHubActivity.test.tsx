import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { GitHubActivity } from './GitHubActivity';

// Mock portfolio.json
vi.mock('@/content/portfolio.json', () => ({
  default: {
    personal: {
      contact: {
        github: 'https://github.com/testuser',
      },
    },
  },
}));

// Mock recharts to avoid rendering issues in tests
vi.mock('recharts', () => ({
  AreaChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="area-chart">{children}</div>
  ),
  Area: () => <div data-testid="area" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
}));

describe('GitHubActivity', () => {
  const defaultProps = {
    title: 'GitHub Activity',
  };

  const mockActivityData = {
    contributions: [
      { date: '2024-01-01', count: 5 },
      { date: '2024-01-02', count: 3 },
      { date: '2024-01-03', count: 8 },
    ],
    totalCommits: 16,
    recentActivity: 12,
  };

  beforeEach(() => {
    // Mock fetch for API calls
    global.fetch = vi.fn();

    // Mock MutationObserver for dark mode detection
    global.MutationObserver = class {
      callback: MutationCallback;
      constructor(callback: MutationCallback) {
        this.callback = callback;
      }
      observe = vi.fn();
      disconnect = vi.fn();
      takeRecords = vi.fn().mockReturnValue([]);
    } as unknown as typeof MutationObserver;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders title correctly', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockActivityData),
    });

    render(<GitHubActivity {...defaultProps} />);

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('GitHub Activity');
  });

  it('shows loading state initially', () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise(() => {}), // Never resolves
    );

    render(<GitHubActivity {...defaultProps} />);

    expect(screen.getByText('Loading GitHub activity...')).toBeInTheDocument();
  });

  it('fetches data from API with default username', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockActivityData),
    });

    render(<GitHubActivity {...defaultProps} />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/github/activity?username=testuser');
    });
  });

  it('fetches data with custom username', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockActivityData),
    });

    render(<GitHubActivity {...defaultProps} username="customuser" />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/github/activity?username=customuser');
    });
  });

  it('displays stats after loading', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockActivityData),
    });

    render(<GitHubActivity {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('16 total commits')).toBeInTheDocument();
      expect(screen.getByText('12 in last 30 days')).toBeInTheDocument();
    });
  });

  it('shows error state on fetch failure', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
    });

    render(<GitHubActivity {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Unable to load GitHub activity')).toBeInTheDocument();
    });
  });

  it('renders heatmap style by default', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockActivityData),
    });

    render(<GitHubActivity {...defaultProps} />);

    await waitFor(() => {
      // Heatmap has the legend with "Less" and "More" text
      expect(screen.getByText('Less')).toBeInTheDocument();
      expect(screen.getByText('More')).toBeInTheDocument();
    });
  });

  it('renders chart style when specified', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockActivityData),
    });

    render(<GitHubActivity {...defaultProps} style="chart" />);

    await waitFor(() => {
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
      expect(screen.getByTestId('area-chart')).toBeInTheDocument();
    });
  });

  it('applies custom className', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockActivityData),
    });

    const { container } = render(<GitHubActivity {...defaultProps} className="custom-class" />);

    expect(container.querySelector('section')).toHaveClass('custom-class');
  });
});

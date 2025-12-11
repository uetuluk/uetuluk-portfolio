import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { DataChart } from './DataChart';

// Mock recharts components
vi.mock('recharts', () => ({
  AreaChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="area-chart">{children}</div>
  ),
  Area: () => <div data-testid="area" />,
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: () => <div data-testid="bar" />,
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: () => <div data-testid="line" />,
  PieChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pie-chart">{children}</div>
  ),
  Pie: () => <div data-testid="pie" />,
  RadarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="radar-chart">{children}</div>
  ),
  Radar: () => <div data-testid="radar" />,
  RadialBarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="radial-bar-chart">{children}</div>
  ),
  RadialBar: () => <div data-testid="radial-bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  PolarGrid: () => <div data-testid="polar-grid" />,
  PolarAngleAxis: () => <div data-testid="polar-angle-axis" />,
  PolarRadiusAxis: () => <div data-testid="polar-radius-axis" />,
  Cell: () => <div data-testid="cell" />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
}));

// Mock shadcn chart components
vi.mock('@/components/ui/chart', () => ({
  ChartContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="chart-container">{children}</div>
  ),
  ChartTooltip: () => <div data-testid="chart-tooltip" />,
  ChartTooltipContent: () => null,
  ChartLegend: () => <div data-testid="chart-legend" />,
  ChartLegendContent: () => null,
}));

// Mock portfolio.json
vi.mock('@/content/portfolio.json', () => ({
  default: {
    personal: {
      name: 'Test User',
      contact: {
        github: 'https://github.com/testuser',
      },
    },
  },
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('DataChart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('renders the title', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        contributions: [{ date: '2024-01-01', count: 5 }],
        totalCommits: 100,
        recentActivity: 20,
      }),
    });

    render(
      <DataChart
        title="Activity Dashboard"
        charts={[{ source: 'github', type: 'area' }]}
      />
    );

    expect(screen.getByText('Activity Dashboard')).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    mockFetch.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(
      <DataChart
        title="Test"
        charts={[{ source: 'github', type: 'bar' }]}
      />
    );

    expect(screen.getByText('Loading data...')).toBeInTheDocument();
  });

  it('fetches GitHub data with default username', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        contributions: [{ date: '2024-01-01', count: 5 }],
        totalCommits: 100,
        recentActivity: 20,
      }),
    });

    render(
      <DataChart
        title="GitHub Activity"
        charts={[{ source: 'github', type: 'area' }]}
      />
    );

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/github/activity?username=testuser');
    });
  });

  it('fetches GitHub data with custom username', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        contributions: [],
        totalCommits: 0,
        recentActivity: 0,
      }),
    });

    render(
      <DataChart
        title="GitHub Activity"
        charts={[{ source: 'github', type: 'bar', githubUsername: 'customuser' }]}
      />
    );

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/github/activity?username=customuser');
    });
  });

  it('fetches weather data', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [{ time: '2024-01-01T00:00', value: 20 }],
        unit: '°C',
        metric: 'temperature',
        location: { lat: 31.23, lon: 121.47 },
      }),
    });

    render(
      <DataChart
        title="Weather"
        charts={[{ source: 'weather', type: 'line', weatherMetric: 'temperature' }]}
      />
    );

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/weather?lat=31.23&lon=121.47&metric=temperature');
    });
  });

  it('fetches weather data with custom location', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [],
        unit: '°C',
        metric: 'temperature',
        location: { lat: 40.71, lon: -74.01 },
      }),
    });

    render(
      <DataChart
        title="NYC Weather"
        charts={[{
          source: 'weather',
          type: 'area',
          weatherMetric: 'humidity',
          weatherLocation: { lat: 40.71, lon: -74.01 },
        }]}
      />
    );

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/weather?lat=40.71&lon=-74.01&metric=humidity');
    });
  });

  it('renders area chart for github data', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        contributions: [
          { date: '2024-01-01', count: 5 },
          { date: '2024-01-02', count: 3 },
        ],
        totalCommits: 8,
        recentActivity: 8,
      }),
    });

    render(
      <DataChart
        title="Activity"
        charts={[{ source: 'github', type: 'area' }]}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('area-chart')).toBeInTheDocument();
    });
  });

  it('renders bar chart', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        contributions: [{ date: '2024-01-01', count: 5 }],
        totalCommits: 5,
        recentActivity: 5,
      }),
    });

    render(
      <DataChart
        title="Activity"
        charts={[{ source: 'github', type: 'bar' }]}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });
  });

  it('renders line chart', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [{ time: '2024-01-01T00:00', value: 20 }],
        unit: '°C',
        metric: 'temperature',
        location: { lat: 31.23, lon: 121.47 },
      }),
    });

    render(
      <DataChart
        title="Temperature"
        charts={[{ source: 'weather', type: 'line' }]}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });
  });

  it('renders pie chart', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        contributions: [
          { date: '2024-01-01', count: 5 },
          { date: '2024-01-02', count: 3 },
        ],
        totalCommits: 8,
        recentActivity: 8,
      }),
    });

    render(
      <DataChart
        title="Distribution"
        charts={[{ source: 'github', type: 'pie', aggregation: 'byDayOfWeek' }]}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    });
  });

  it('renders radar chart', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        contributions: [{ date: '2024-01-01', count: 5 }],
        totalCommits: 5,
        recentActivity: 5,
      }),
    });

    render(
      <DataChart
        title="Weekly Pattern"
        charts={[{ source: 'github', type: 'radar', aggregation: 'byDayOfWeek' }]}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('radar-chart')).toBeInTheDocument();
    });
  });

  it('renders radial chart', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        contributions: [{ date: '2024-01-01', count: 5 }],
        totalCommits: 5,
        recentActivity: 5,
      }),
    });

    render(
      <DataChart
        title="Progress"
        charts={[{ source: 'github', type: 'radial' }]}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('radial-bar-chart')).toBeInTheDocument();
    });
  });

  it('renders multiple charts with grid layout', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          contributions: [{ date: '2024-01-01', count: 5 }],
          totalCommits: 5,
          recentActivity: 5,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [{ time: '2024-01-01T00:00', value: 20 }],
          unit: '°C',
          metric: 'temperature',
          location: { lat: 31.23, lon: 121.47 },
        }),
      });

    render(
      <DataChart
        title="Dashboard"
        charts={[
          { source: 'github', type: 'area' },
          { source: 'weather', type: 'line' },
        ]}
        layout="grid"
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('area-chart')).toBeInTheDocument();
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });
  });

  it('shows error state when fetch fails', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    render(
      <DataChart
        title="Activity"
        charts={[{ source: 'github', type: 'area' }]}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Unable to load chart data')).toBeInTheDocument();
    });
  });

  it('applies custom className', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        contributions: [],
        totalCommits: 0,
        recentActivity: 0,
      }),
    });

    const { container } = render(
      <DataChart
        title="Test"
        charts={[{ source: 'github', type: 'bar' }]}
        className="custom-class"
      />
    );

    await waitFor(() => {
      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });
  });

  it('renders chart with custom title', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        contributions: [{ date: '2024-01-01', count: 5 }],
        totalCommits: 5,
        recentActivity: 5,
      }),
    });

    render(
      <DataChart
        title="Dashboard"
        charts={[{ source: 'github', type: 'area', title: 'My Commits' }]}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('My Commits')).toBeInTheDocument();
    });
  });
});

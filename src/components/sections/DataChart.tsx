import { useEffect, useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  RadialBarChart,
  RadialBar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
} from 'recharts';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import portfolioContent from '@/content/portfolio.json';

// Types
type DataSource = 'github' | 'weather';
type ChartType = 'area' | 'bar' | 'line' | 'pie' | 'radar' | 'radial';
type Aggregation = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'byDayOfWeek';
type WeatherMetric = 'temperature' | 'humidity' | 'precipitation' | 'wind';

interface ChartItemConfig {
  source: DataSource;
  type: ChartType;
  aggregation?: Aggregation;
  // GitHub-specific
  githubUsername?: string;
  githubMetric?: 'commits';
  // Weather-specific
  weatherMetric?: WeatherMetric;
  weatherLocation?: { lat: number; lon: number } | 'visitor';
  // Chart styling
  title?: string;
  height?: number;
  color?: string;
}

interface DataChartProps {
  title: string;
  charts: ChartItemConfig[];
  layout?: 'stack' | 'grid';
  className?: string;
}

// API Response types
interface GitHubActivityData {
  contributions: Array<{ date: string; count: number }>;
  totalCommits: number;
  recentActivity: number;
}

interface WeatherData {
  data: Array<{ time: string; value: number }>;
  unit: string;
  metric: WeatherMetric;
  location: { lat: number; lon: number };
}

// Normalized data point for charts
interface DataPoint {
  label: string;
  value: number;
  rawDate?: Date;
}

// Extract username from GitHub URL in portfolio
function getDefaultUsername(): string {
  const githubUrl = portfolioContent.personal.contact.github;
  const match = githubUrl.match(/github\.com\/([^/]+)/);
  return match ? match[1] : 'uetuluk';
}

// Chart colors using CSS variables
const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

// Aggregation functions
function aggregateByWeek(data: DataPoint[]): DataPoint[] {
  const weekMap = new Map<string, { total: number; date: Date }>();

  for (const point of data) {
    if (!point.rawDate) continue;
    const date = point.rawDate;
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const weekKey = weekStart.toISOString().split('T')[0];

    const existing = weekMap.get(weekKey);
    if (existing) {
      existing.total += point.value;
    } else {
      weekMap.set(weekKey, { total: point.value, date: weekStart });
    }
  }

  return Array.from(weekMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, { total, date }]) => ({
      label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: total,
      rawDate: date,
    }));
}

function aggregateByMonth(data: DataPoint[]): DataPoint[] {
  const monthMap = new Map<string, { total: number; date: Date }>();

  for (const point of data) {
    if (!point.rawDate) continue;
    const date = point.rawDate;
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    const existing = monthMap.get(monthKey);
    if (existing) {
      existing.total += point.value;
    } else {
      monthMap.set(monthKey, { total: point.value, date: new Date(date.getFullYear(), date.getMonth(), 1) });
    }
  }

  return Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, { total, date }]) => ({
      label: date.toLocaleDateString('en-US', { month: 'short' }),
      value: total,
      rawDate: date,
    }));
}

function aggregateByDayOfWeek(data: DataPoint[]): DataPoint[] {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayTotals = new Array(7).fill(0);
  const dayCounts = new Array(7).fill(0);

  for (const point of data) {
    if (!point.rawDate) continue;
    const dayIndex = point.rawDate.getDay();
    dayTotals[dayIndex] += point.value;
    dayCounts[dayIndex]++;
  }

  return dayNames.map((name, i) => ({
    label: name,
    value: dayCounts[i] > 0 ? Math.round(dayTotals[i] / dayCounts[i]) : 0,
  }));
}

function aggregateByDay(data: DataPoint[]): DataPoint[] {
  const dayMap = new Map<string, { total: number; date: Date }>();

  for (const point of data) {
    if (!point.rawDate) continue;
    const dayKey = point.rawDate.toISOString().split('T')[0];

    const existing = dayMap.get(dayKey);
    if (existing) {
      existing.total += point.value;
    } else {
      dayMap.set(dayKey, { total: point.value, date: point.rawDate });
    }
  }

  return Array.from(dayMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, { total, date }]) => ({
      label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: total,
      rawDate: date,
    }));
}

function applyAggregation(data: DataPoint[], aggregation: Aggregation): DataPoint[] {
  switch (aggregation) {
    case 'weekly':
      return aggregateByWeek(data);
    case 'monthly':
      return aggregateByMonth(data);
    case 'byDayOfWeek':
      return aggregateByDayOfWeek(data);
    case 'daily':
      return aggregateByDay(data);
    case 'hourly':
    default:
      return data;
  }
}

// Individual chart component
function SingleChart({
  config,
  data,
  index,
}: {
  config: ChartItemConfig;
  data: DataPoint[];
  index: number;
}) {
  const color = config.color || CHART_COLORS[index % CHART_COLORS.length];
  const height = config.height || 200;

  const chartConfig: ChartConfig = {
    value: {
      label: config.title || (config.source === 'github' ? 'Commits' : config.weatherMetric || 'Value'),
      color,
    },
  };

  // Apply aggregation
  const aggregatedData = useMemo(() => {
    const aggregation = config.aggregation || (config.source === 'github' ? 'weekly' : 'daily');
    return applyAggregation(data, aggregation);
  }, [data, config.aggregation, config.source]);

  if (aggregatedData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-muted-foreground">
        No data available
      </div>
    );
  }

  const renderChart = () => {
    switch (config.type) {
      case 'area':
        return (
          <AreaChart data={aggregatedData} accessibilityLayer>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={10}
            />
            <YAxis tickLine={false} axisLine={false} width={30} fontSize={10} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <defs>
              <linearGradient id={`fill-${index}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                <stop offset="95%" stopColor={color} stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              fill={`url(#fill-${index})`}
              strokeWidth={2}
            />
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart data={aggregatedData} accessibilityLayer>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={10}
            />
            <YAxis tickLine={false} axisLine={false} width={30} fontSize={10} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
          </BarChart>
        );

      case 'line':
        return (
          <LineChart data={aggregatedData} accessibilityLayer>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={10}
            />
            <YAxis tickLine={false} axisLine={false} width={30} fontSize={10} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        );

      case 'pie':
        return (
          <PieChart accessibilityLayer>
            <ChartTooltip content={<ChartTooltipContent />} />
            <Pie
              data={aggregatedData}
              dataKey="value"
              nameKey="label"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={({ label }) => label}
            >
              {aggregatedData.map((_, i) => (
                <Cell key={`cell-${i}`} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <ChartLegend content={<ChartLegendContent />} />
          </PieChart>
        );

      case 'radar':
        return (
          <RadarChart data={aggregatedData} cx="50%" cy="50%" outerRadius="80%">
            <PolarGrid />
            <PolarAngleAxis dataKey="label" fontSize={10} />
            <PolarRadiusAxis fontSize={10} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Radar
              name={config.title || 'Value'}
              dataKey="value"
              stroke={color}
              fill={color}
              fillOpacity={0.5}
            />
          </RadarChart>
        );

      case 'radial':
        // For radial, we'll show the most recent value as a percentage of max
        const maxValue = Math.max(...aggregatedData.map((d) => d.value));
        const latestValue = aggregatedData[aggregatedData.length - 1]?.value || 0;
        const percentage = maxValue > 0 ? (latestValue / maxValue) * 100 : 0;
        const radialData = [{ value: percentage, fill: color }];

        return (
          <RadialBarChart
            data={radialData}
            startAngle={180}
            endAngle={0}
            innerRadius="60%"
            outerRadius="100%"
          >
            <ChartTooltip content={<ChartTooltipContent />} />
            <RadialBar
              dataKey="value"
              background
              cornerRadius={10}
            />
          </RadialBarChart>
        );

      default:
        return <div>Unknown chart type</div>;
    }
  };

  return (
    <div className="w-full">
      {config.title && (
        <h4 className="text-sm font-medium text-muted-foreground mb-2">{config.title}</h4>
      )}
      <ChartContainer config={chartConfig} className={`w-full`} style={{ height }}>
        {renderChart()}
      </ChartContainer>
    </div>
  );
}

// Custom hook to fetch data for a chart config
function useChartData(config: ChartItemConfig) {
  const [data, setData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        if (config.source === 'github') {
          const username = config.githubUsername || getDefaultUsername();
          const response = await fetch(`/api/github/activity?username=${username}`);
          if (!response.ok) throw new Error('Failed to fetch GitHub data');

          const result = (await response.json()) as GitHubActivityData;
          const points: DataPoint[] = result.contributions.map((c) => ({
            label: c.date,
            value: c.count,
            rawDate: new Date(c.date),
          }));
          setData(points);
        } else if (config.source === 'weather') {
          // Get location - supports lat/lon object, city name string, or 'visitor'
          let lat = 31.23; // Default: Shanghai
          let lon = 121.47;

          if (config.weatherLocation && config.weatherLocation !== 'visitor') {
            if (typeof config.weatherLocation === 'string') {
              // City name - use geocoding API
              const geocodeResponse = await fetch(`/api/geocode?city=${encodeURIComponent(config.weatherLocation)}`);
              if (!geocodeResponse.ok) {
                throw new Error(`Failed to geocode city: ${config.weatherLocation}`);
              }
              const geocodeResult = await geocodeResponse.json() as { lat: number; lon: number; name: string; country: string };
              lat = geocodeResult.lat;
              lon = geocodeResult.lon;
            } else {
              // Lat/lon object
              lat = config.weatherLocation.lat;
              lon = config.weatherLocation.lon;
            }
          }

          const metric = config.weatherMetric || 'temperature';
          const response = await fetch(`/api/weather?lat=${lat}&lon=${lon}&metric=${metric}`);
          if (!response.ok) throw new Error('Failed to fetch weather data');

          const result = (await response.json()) as WeatherData;
          const points: DataPoint[] = result.data.map((d) => ({
            label: new Date(d.time).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
            }),
            value: d.value,
            rawDate: new Date(d.time),
          }));
          setData(points);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [config.source, config.githubUsername, config.weatherLocation, config.weatherMetric]);

  return { data, loading, error };
}

// Main component
export function DataChart({ title, charts, layout = 'stack', className }: DataChartProps) {
  // Fetch data for all charts
  const chartDataResults = charts.map((config) => ({
    config,
    ...useChartData(config),
  }));

  const isLoading = chartDataResults.some((r) => r.loading);
  const hasError = chartDataResults.some((r) => r.error);

  return (
    <section className={cn('py-8', className)}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">{title}</h2>
      </div>

      <div className="p-4 rounded-xl bg-card border">
        {isLoading && (
          <div className="flex items-center justify-center h-[150px]">
            <div className="animate-pulse text-muted-foreground">Loading data...</div>
          </div>
        )}

        {hasError && !isLoading && (
          <div className="flex items-center justify-center h-[150px] text-muted-foreground">
            Unable to load chart data
          </div>
        )}

        {!isLoading && !hasError && (
          <div
            className={cn(
              layout === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : 'space-y-6'
            )}
          >
            {chartDataResults.map((result, index) => (
              <SingleChart
                key={index}
                config={result.config}
                data={result.data}
                index={index}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

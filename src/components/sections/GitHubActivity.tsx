import { useEffect, useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import portfolioContent from '@/content/portfolio.json';

interface ContributionData {
  date: string;
  count: number;
}

interface GitHubActivityData {
  contributions: ContributionData[];
  totalCommits: number;
  recentActivity: number;
}

interface GitHubActivityProps {
  title: string;
  username?: string;
  style?: 'heatmap' | 'chart';
  className?: string;
}

// Extract username from GitHub URL in portfolio
function getDefaultUsername(): string {
  const githubUrl = portfolioContent.personal.contact.github;
  const match = githubUrl.match(/github\.com\/([^/]+)/);
  return match ? match[1] : 'uetuluk';
}

// Color scale for heatmap (0-4 levels based on contribution count)
function getHeatmapColor(count: number, isDark: boolean): string {
  if (count === 0) return isDark ? 'hsl(175 20% 15%)' : 'hsl(175 10% 92%)';
  if (count <= 2) return isDark ? 'hsl(175 60% 25%)' : 'hsl(175 50% 80%)';
  if (count <= 5) return isDark ? 'hsl(175 60% 35%)' : 'hsl(175 55% 65%)';
  if (count <= 10) return isDark ? 'hsl(175 60% 45%)' : 'hsl(175 60% 50%)';
  return isDark ? 'hsl(175 65% 55%)' : 'hsl(175 70% 40%)';
}

// Generate heatmap data for last 52 weeks
function generateHeatmapData(contributions: ContributionData[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const c of contributions) {
    map.set(c.date, c.count);
  }
  return map;
}

function Heatmap({ contributions }: { contributions: ContributionData[] }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check if dark mode is active
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkDarkMode();

    // Watch for class changes on html element
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  const data = useMemo(() => generateHeatmapData(contributions), [contributions]);

  // Generate 52 weeks x 7 days grid
  const weeks = useMemo(() => {
    const result: { date: string; count: number }[][] = [];
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 364); // Go back 52 weeks

    // Adjust to start on Sunday
    startDate.setDate(startDate.getDate() - startDate.getDay());

    for (let week = 0; week < 52; week++) {
      const weekData: { date: string; count: number }[] = [];
      for (let day = 0; day < 7; day++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + week * 7 + day);
        const dateStr = currentDate.toISOString().split('T')[0];
        weekData.push({
          date: dateStr,
          count: data.get(dateStr) || 0,
        });
      }
      result.push(weekData);
    }

    return result;
  }, [data]);

  // Month labels
  const monthLabels = useMemo(() => {
    const labels: { month: string; position: number }[] = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 364);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    let lastMonth = -1;
    for (let week = 0; week < 52; week++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + week * 7);
      const month = date.getMonth();
      if (month !== lastMonth) {
        labels.push({
          month: date.toLocaleDateString('en-US', { month: 'short' }),
          position: week,
        });
        lastMonth = month;
      }
    }
    return labels;
  }, []);

  return (
    <div className="overflow-x-auto">
      {/* Month labels */}
      <div className="flex mb-1 ml-6" style={{ gap: '10px' }}>
        {monthLabels.map((label, i) => (
          <span
            key={i}
            className="text-xs text-muted-foreground"
            style={{
              marginLeft: `${label.position * 12}px`,
              position: i === 0 ? 'relative' : 'absolute',
            }}
          >
            {i === 0 ? label.month : null}
          </span>
        ))}
      </div>
      <div className="flex text-xs text-muted-foreground mb-1">
        {monthLabels.map((label, i) => (
          <span
            key={i}
            className="text-xs text-muted-foreground"
            style={{ position: 'absolute', left: `${24 + label.position * 12}px` }}
          >
            {label.month}
          </span>
        ))}
      </div>

      {/* Heatmap grid */}
      <div className="relative pt-5">
        {/* Day labels */}
        <div
          className="absolute left-0 top-5 flex flex-col text-xs text-muted-foreground"
          style={{ gap: '5px' }}
        >
          <span className="h-[10px]"></span>
          <span className="h-[10px]">Mon</span>
          <span className="h-[10px]"></span>
          <span className="h-[10px]">Wed</span>
          <span className="h-[10px]"></span>
          <span className="h-[10px]">Fri</span>
          <span className="h-[10px]"></span>
        </div>

        {/* Grid */}
        <div className="flex ml-6" style={{ gap: '2px' }}>
          {weeks.map((week, weekIdx) => (
            <div key={weekIdx} className="flex flex-col" style={{ gap: '2px' }}>
              {week.map((day) => (
                <div
                  key={day.date}
                  className="w-[10px] h-[10px] rounded-sm transition-colors"
                  style={{ backgroundColor: getHeatmapColor(day.count, isDark) }}
                  title={`${day.date}: ${day.count} contributions`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-1 mt-2 text-xs text-muted-foreground">
        <span>Less</span>
        {[0, 2, 5, 10, 15].map((level) => (
          <div
            key={level}
            className="w-[10px] h-[10px] rounded-sm"
            style={{ backgroundColor: getHeatmapColor(level, isDark) }}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}

function ActivityChart({ contributions }: { contributions: ContributionData[] }) {
  // Aggregate by week for cleaner chart
  const chartData = useMemo(() => {
    if (contributions.length === 0) return [];

    const weeklyData: { week: string; commits: number }[] = [];
    let currentWeek = '';
    let currentCount = 0;

    for (const c of contributions) {
      const date = new Date(c.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];

      if (weekKey !== currentWeek) {
        if (currentWeek) {
          weeklyData.push({ week: currentWeek, commits: currentCount });
        }
        currentWeek = weekKey;
        currentCount = c.count;
      } else {
        currentCount += c.count;
      }
    }

    if (currentWeek) {
      weeklyData.push({ week: currentWeek, commits: currentCount });
    }

    return weeklyData;
  }, [contributions]);

  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorCommits" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="week"
            tick={{ fontSize: 10 }}
            tickFormatter={(value) => {
              const date = new Date(value);
              return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }}
            interval="preserveStartEnd"
            stroke="hsl(var(--muted-foreground))"
          />
          <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" width={30} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px',
              fontSize: '12px',
            }}
            labelFormatter={(value) => {
              const date = new Date(value);
              return `Week of ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
            }}
            formatter={(value: number) => [`${value} commits`, 'Activity']}
          />
          <Area
            type="monotone"
            dataKey="commits"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorCommits)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function GitHubActivity({
  title,
  username = getDefaultUsername(),
  style = 'heatmap',
  className,
}: GitHubActivityProps) {
  const [data, setData] = useState<GitHubActivityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(`/api/github/activity?username=${username}`);
        if (!response.ok) {
          throw new Error('Failed to fetch GitHub activity');
        }
        const result = (await response.json()) as GitHubActivityData;
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [username]);

  return (
    <section className={cn('py-8', className)}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">{title}</h2>
        {data && (
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>{data.totalCommits} total commits</span>
            <span>{data.recentActivity} in last 30 days</span>
          </div>
        )}
      </div>

      <div className="p-4 rounded-xl bg-card border">
        {loading && (
          <div className="flex items-center justify-center h-[150px]">
            <div className="animate-pulse text-muted-foreground">Loading GitHub activity...</div>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center h-[150px] text-muted-foreground">
            Unable to load GitHub activity
          </div>
        )}

        {data && !loading && !error && (
          <>
            {style === 'heatmap' ? (
              <Heatmap contributions={data.contributions} />
            ) : (
              <ActivityChart contributions={data.contributions} />
            )}
          </>
        )}
      </div>
    </section>
  );
}

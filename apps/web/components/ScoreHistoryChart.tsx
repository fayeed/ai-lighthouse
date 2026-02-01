'use client';

import { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Crown, TrendingUp, Layers, FileText } from 'lucide-react';

interface ScorePoint {
  id: string;
  domain: string;
  score: number;
  grade: string;
  scanType: string;
  date: string;
}

interface ScoreHistoryChartProps {
  points: ScorePoint[];
  domains: string[];
  plan: 'FREE' | 'PRO' | 'ENTERPRISE';
  daysLimit: number | null;
}

const DOMAIN_COLORS = [
  '#14b8a6', // teal
  '#a78bfa', // violet
  '#f97316', // orange
  '#3b82f6', // blue
  '#ec4899', // pink
  '#84cc16', // lime
  '#f59e0b', // amber
  '#06b6d4', // cyan
];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-[#111] border border-white/10 rounded-lg px-3 py-2.5 shadow-xl space-y-1.5">
      <p className="text-[10px] text-white/40">
        {new Date(payload[0]?.payload?.date).toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric',
        })}
      </p>
      {payload.map((entry: any) => {
        if (entry.value == null) return null;
        // Find the original point for this entry to get grade & scanType
        const original = entry.payload?._points?.find(
          (p: ScorePoint) => p.domain === entry.name
        );
        return (
          <div key={entry.name} className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-white/70 truncate max-w-[120px]">{entry.name}</span>
            <span className="text-sm font-bold text-white ml-auto">{entry.value}</span>
            {original?.grade && (
              <span className={`text-[10px] font-medium ${
                original.grade.startsWith('A') ? 'text-green-400' :
                original.grade.startsWith('B') ? 'text-yellow-400' :
                original.grade.startsWith('C') ? 'text-orange-400' :
                'text-red-400'
              }`}>
                {original.grade}
              </span>
            )}
            {original?.scanType && (
              <span className="text-[9px] text-white/30">
                {original.scanType === 'FULL_CRAWL' ? 'crawl' : original.scanType === 'SITEMAP' ? 'sitemap' : 'page'}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function CustomDot(props: any) {
  const { cx, cy, payload, dataKey } = props;
  if (cx == null || cy == null || payload?.[dataKey] == null) return null;

  const original = payload._points?.find(
    (p: ScorePoint) => p.domain === dataKey
  );
  const isCrawl = original?.scanType === 'FULL_CRAWL' || original?.scanType === 'SITEMAP';

  if (isCrawl) {
    // Diamond shape for crawl scans
    return (
      <polygon
        points={`${cx},${cy - 5} ${cx + 5},${cy} ${cx},${cy + 5} ${cx - 5},${cy}`}
        fill={props.stroke}
        stroke="#050505"
        strokeWidth={2}
      />
    );
  }

  // Circle for single page scans
  return (
    <circle
      cx={cx}
      cy={cy}
      r={4}
      fill={props.stroke}
      stroke="#050505"
      strokeWidth={2}
    />
  );
}

export default function ScoreHistoryChart({ points, domains, plan, daysLimit }: ScoreHistoryChartProps) {
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);

  const activeDomains = selectedDomain ? [selectedDomain] : domains;

  // Transform points into a format with one row per unique timestamp,
  // and a column per domain. This lets Recharts render one Line per domain.
  const chartData = useMemo(() => {
    // Group points by date string (to nearest minute to avoid tiny overlaps)
    const groups = new Map<string, { date: string; _points: ScorePoint[]; [domain: string]: any }>();

    for (const p of points) {
      if (selectedDomain && p.domain !== selectedDomain) continue;

      // Use ISO string truncated to minute as grouping key
      const key = p.date;
      if (!groups.has(key)) {
        groups.set(key, { date: p.date, label: formatDate(p.date), _points: [] });
      }
      const row = groups.get(key)!;
      row[p.domain] = p.score;
      row._points.push(p);
    }

    return Array.from(groups.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [points, selectedDomain]);

  const domainColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    domains.forEach((d, i) => {
      map[d] = DOMAIN_COLORS[i % DOMAIN_COLORS.length];
    });
    return map;
  }, [domains]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-display font-bold">Score Trends</h2>
          <TrendingUp className="w-5 h-5 text-teal-400" />
        </div>

        {/* Domain filter */}
        {domains.length > 1 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setSelectedDomain(null)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                !selectedDomain
                  ? 'bg-teal-500/20 text-teal-400 border-teal-500/30 font-bold'
                  : 'bg-white/5 text-white/50 border-white/10 hover:border-white/20'
              }`}
            >
              All domains
            </button>
            {domains.map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDomain(selectedDomain === d ? null : d)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-all truncate max-w-[160px] flex items-center gap-1.5 ${
                  selectedDomain === d
                    ? 'bg-teal-500/20 text-teal-400 border-teal-500/30 font-bold'
                    : 'bg-white/5 text-white/50 border-white/10 hover:border-white/20'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: domainColorMap[d] }}
                />
                {d}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="glass rounded-xl p-4 sm:p-6">
        <div className="h-[260px] sm:h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="label"
                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              {activeDomains.length > 1 && (
                <Legend
                  formatter={(value: string) => (
                    <span className="text-xs text-white/50">{value}</span>
                  )}
                  iconType="circle"
                  iconSize={8}
                />
              )}
              {activeDomains.map((domain) => (
                <Line
                  key={domain}
                  type="monotone"
                  dataKey={domain}
                  name={domain}
                  stroke={domainColorMap[domain]}
                  strokeWidth={2}
                  dot={<CustomDot />}
                  activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Scan type legend */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/5">
          <div className="flex items-center gap-1.5">
            <FileText className="w-3 h-3 text-white/30" />
            <span className="text-[10px] text-white/30 uppercase tracking-wider font-bold">
              <span className="inline-block w-2 h-2 rounded-full bg-white/30 mr-1 align-middle" />
              Single page
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Layers className="w-3 h-3 text-white/30" />
            <span className="text-[10px] text-white/30 uppercase tracking-wider font-bold">
              <span className="inline-block w-2 h-2 bg-white/30 mr-1 align-middle" style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }} />
              Crawl / Sitemap
            </span>
          </div>
        </div>
      </div>

      {/* Upgrade nudge for free users */}
      {plan === 'FREE' && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-teal-500/5 border border-teal-500/10">
          <p className="text-xs text-white/50">
            Showing last {daysLimit} days. Upgrade for up to 90 days of history.
          </p>
          <a
            href="/login?plan=pro"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-400 hover:text-teal-300 transition-colors"
          >
            <Crown className="w-3 h-3" />
            Upgrade
          </a>
        </div>
      )}
    </div>
  );
}

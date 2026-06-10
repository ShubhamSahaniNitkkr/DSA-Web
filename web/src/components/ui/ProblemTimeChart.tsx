import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts';

interface Props {
  history: { date: string; minutes: number }[];
  demo?: boolean;
}

function fmtLabel(dateStr: string) {
  const d = new Date(`${dateStr}T12:00:00`);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <span className="chart-tooltip-date">{label}</span>
      <strong>{payload[0].value} min</strong>
    </div>
  );
}

export default function ProblemTimeChart({ history, demo }: Props) {
  if (!history.length) {
    return <p className="bento-empty">Start the timer to track time on this problem.</p>;
  }

  const data = history.map((h) => ({
    ...h,
    label: fmtLabel(h.date),
    fullDate: h.date,
  }));
  const maxMin = Math.max(...data.map((d) => d.minutes), 1);

  return (
    <div className="problem-time-chart">
      {demo && <p className="demo-hint">Sample data — start timer to log real time</p>}
      <div className="chart-summary-row">
        <span>Last 14 days</span>
        <strong>{data.reduce((s, d) => s + d.minutes, 0)} min total</strong>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 12, right: 8, left: 0, bottom: 4 }} barCategoryGap="22%">
          <defs>
            <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#52b788" stopOpacity={1} />
              <stop offset="100%" stopColor="#2d6a4f" stopOpacity={0.9} />
            </linearGradient>
            <linearGradient id="barGradDim" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#95d5b2" stopOpacity={0.85} />
              <stop offset="100%" stopColor="#52b788" stopOpacity={0.6} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="4 4" stroke="rgba(148,163,184,0.25)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
            width={32}
            allowDecimals={false}
            domain={[0, Math.ceil(maxMin * 1.15)]}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(82,183,136,0.08)', radius: 8 }} />
          <Bar dataKey="minutes" radius={[8, 8, 4, 4]} maxBarSize={48}>
            {data.map((entry) => (
              <Cell
                key={entry.fullDate}
                fill={entry.minutes === maxMin ? 'url(#barGrad)' : 'url(#barGradDim)'}
                opacity={entry.minutes === 0 ? 0.35 : 1}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

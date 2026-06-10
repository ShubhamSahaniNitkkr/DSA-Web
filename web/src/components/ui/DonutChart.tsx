import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface Props {
  value?: number;
  total?: number;
  size?: number;
  label?: string;
  sublabel?: string;
}

export default function DonutChart({ value = 0, total = 1, size = 100, label, sublabel }: Props) {
  const pct = total ? Math.min(100, Math.round((value / total) * 100)) : 0;
  const gradId = `donutGrad-${size}-${value}`;
  const data = [
    { name: 'done', value: Math.max(pct, pct > 0 ? 2 : 0) },
    { name: 'left', value: 100 - Math.max(pct, pct > 0 ? 2 : 0) },
  ];

  return (
    <div className="donut-premium" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            innerRadius="68%"
            outerRadius="100%"
            startAngle={90}
            endAngle={-270}
            dataKey="value"
            stroke="none"
            cornerRadius={8}
            paddingAngle={pct > 0 && pct < 100 ? 3 : 0}
          >
            <Cell fill={`url(#${gradId})`} />
            <Cell fill="rgba(226, 232, 240, 0.85)" />
          </Pie>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#1d4ed8" />
              <stop offset="50%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#60a5fa" />
            </linearGradient>
          </defs>
        </PieChart>
      </ResponsiveContainer>
      <div className="donut-premium-center">
        <span className="donut-premium-pct">{pct}%</span>
        {label && <span className="donut-premium-label">{label}</span>}
        {sublabel && <span className="donut-premium-sub">{sublabel}</span>}
      </div>
    </div>
  );
}

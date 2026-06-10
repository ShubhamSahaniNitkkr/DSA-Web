import { Tooltip } from 'antd';
import dayjs from 'dayjs';

interface Day {
  date: string;
  level: number;
  solved?: boolean;
}

interface Props {
  data: Day[];
  months?: number;
}

/** Compact GitHub-style heatmap — small squares, flex wrap (original feel) */
export default function ActivityCalendar({ data, months = 3 }: Props) {
  const map = Object.fromEntries(data.map((d) => [d.date, d]));
  const days: { date: string; level: number }[] = [];
  const totalDays = months * 30;
  for (let i = totalDays; i >= 0; i--) {
    const d = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
    days.push({ date: d, level: map[d]?.level || 0 });
  }

  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="cal-compact">
      <p className="cal-range-label">Last {months} months</p>
      <div className="cal-weekday-row">
        {weekDays.map((d, i) => <span key={i}>{d}</span>)}
      </div>
      <div className="cal-grid">
        {days.map((d) => (
          <Tooltip
            key={d.date}
            title={`${dayjs(d.date).format('MMM D, YYYY')}${d.level > 1 ? ' — solved!' : d.level ? ' — visited' : ''}`}
          >
            <div className={`cal-cell ${d.level ? `l${Math.min(d.level, 3)}` : ''}`} />
          </Tooltip>
        ))}
      </div>
      <div className="cal-legend">
        <span>Less</span>
        {[0, 1, 2, 3].map((l) => <div key={l} className={`cal-cell cal-legend-dot ${l ? `l${l}` : ''}`} />)}
        <span>More</span>
      </div>
    </div>
  );
}

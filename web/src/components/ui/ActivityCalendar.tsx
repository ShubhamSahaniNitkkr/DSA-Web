import { useMemo } from 'react';
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

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function buildWeeks(days: { date: string; level: number }[]) {
  if (!days.length) return [] as ({ date: string; level: number } | null)[][];

  const weeks: ({ date: string; level: number } | null)[][] = [];
  let week: ({ date: string; level: number } | null)[] = [];

  const firstDow = dayjs(days[0].date).day();
  for (let i = 0; i < firstDow; i++) week.push(null);

  for (const day of days) {
    week.push(day);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }

  if (week.length) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }

  return weeks;
}

/** Horizontal heatmap — weeks stretch across full card width */
export default function ActivityCalendar({ data, months = 3 }: Props) {
  const weeks = useMemo(() => {
    const map = Object.fromEntries(data.map((d) => [d.date, d]));
    const days: { date: string; level: number }[] = [];
    const totalDays = months * 30;
    for (let i = totalDays; i >= 0; i--) {
      const d = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
      days.push({ date: d, level: map[d]?.level || 0 });
    }
    return buildWeeks(days);
  }, [data, months]);

  return (
    <div className="cal-compact">
      <div className="cal-heatmap-row">
        <div className="cal-weekday-col" aria-hidden>
          {WEEKDAY_LABELS.map((label, i) => (
            <span key={i} className={i === 1 || i === 3 || i === 5 ? '' : 'cal-weekday-dim'}>{label}</span>
          ))}
        </div>
        <div className="cal-grid-horizontal">
          {weeks.map((week, wi) => (
            <div key={wi} className="cal-week-col">
              {week.map((day, di) => {
                if (!day) {
                  return <div key={`${wi}-${di}`} className="cal-cell cal-cell-empty" />;
                }
                return (
                  <Tooltip
                    key={day.date}
                    title={`${dayjs(day.date).format('MMM D, YYYY')}${day.level > 1 ? ' — solved!' : day.level ? ' — visited' : ''}`}
                  >
                    <div className={`cal-cell ${day.level ? `l${Math.min(day.level, 3)}` : ''}`} />
                  </Tooltip>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="cal-footer-row">
        <span className="cal-range-label">Last {months} months</span>
        <div className="cal-legend">
          <span>Less</span>
          {[0, 1, 2, 3].map((l) => <div key={l} className={`cal-cell cal-legend-dot ${l ? `l${l}` : ''}`} />)}
          <span>More</span>
        </div>
      </div>
    </div>
  );
}

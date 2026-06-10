import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Table, Tag, Spin, Button } from 'antd';
import { StarFilled, ArrowLeftOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import DonezoShell from '../layout/DonezoShell';
import { api } from '../../lib/api';
import { NAV_EMOJI } from '../../lib/chapterEmojis';
import { getChapterLabel } from '../../lib/chapterLabels';

interface FavoriteRow {
  slug: string;
  title: string;
  topic: string;
  difficulty: string;
  timeSpentSeconds: number;
  lastOpenedAt: string | null;
}

function fmtDuration(sec: number) {
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const h = Math.floor(m / 60);
  if (h) return `${h}h ${m % 60}m`;
  return `${m}m`;
}

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function diffColor(d: string) {
  if (d === 'Easy') return 'green';
  if (d === 'Medium') return 'orange';
  return 'red';
}

export default function FavoritesPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<FavoriteRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getFavorites()
      .then((r) => setRows(r.favorites))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const columns: ColumnsType<FavoriteRow> = [
    {
      title: 'Problem',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, row) => (
        <Link to={`/problem/${row.slug}`} className="fav-table-link">{title}</Link>
      ),
    },
    {
      title: 'Chapter',
      dataIndex: 'topic',
      key: 'topic',
      responsive: ['md'],
      render: (t: string) => getChapterLabel(t),
    },
    {
      title: 'Difficulty',
      dataIndex: 'difficulty',
      key: 'difficulty',
      width: 100,
      render: (d: string) => <Tag color={diffColor(d)}>{d}</Tag>,
    },
    {
      title: 'Time spent',
      dataIndex: 'timeSpentSeconds',
      key: 'time',
      width: 110,
      sorter: (a, b) => a.timeSpentSeconds - b.timeSpentSeconds,
      render: (s: number) => <span className="mono">{fmtDuration(s)}</span>,
    },
    {
      title: 'Last opened',
      dataIndex: 'lastOpenedAt',
      key: 'opened',
      width: 160,
      responsive: ['sm'],
      sorter: (a, b) => {
        const ta = a.lastOpenedAt ? new Date(a.lastOpenedAt).getTime() : 0;
        const tb = b.lastOpenedAt ? new Date(b.lastOpenedAt).getTime() : 0;
        return ta - tb;
      },
      render: (d: string | null) => fmtDate(d),
    },
    {
      title: '',
      key: 'go',
      width: 72,
      render: (_, row) => (
        <Button type="link" size="small" onClick={() => navigate(`/problem/${row.slug}`)}>
          Open
        </Button>
      ),
    },
  ];

  return (
    <DonezoShell>
      <div className="dz-page-head fav-page-head">
        <div>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/')} className="back-link-btn">
            Dashboard
          </Button>
          <h1><StarFilled style={{ color: '#eab308' }} /> Favorite problems</h1>
          <p>{NAV_EMOJI.favorite} All starred problems · time spent · last opened</p>
        </div>
      </div>

      <div className="glass-card fav-table-card">
        {loading ? (
          <div className="fav-table-loading"><Spin size="large" /></div>
        ) : (
          <Table
            rowKey="slug"
            columns={columns}
            dataSource={rows}
            pagination={{ pageSize: 20, showSizeChanger: true, pageSizeOptions: ['10', '20', '50'] }}
            scroll={{ x: 640 }}
            locale={{ emptyText: 'No favorites yet — star problems from the problem page.' }}
            className="fav-problems-table"
          />
        )}
      </div>
    </DonezoShell>
  );
}

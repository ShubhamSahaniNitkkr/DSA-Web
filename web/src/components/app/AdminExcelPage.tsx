import { useEffect, useState } from 'react';
import { Upload, Button, message, Table, Alert, Tabs, Input, Spin, Row, Col, Statistic, Card } from 'antd';
import { UploadOutlined, DownloadOutlined, FileExcelOutlined, LockOutlined, BarChartOutlined } from '@ant-design/icons';
import { Navigate } from 'react-router-dom';
import DonezoShell from '../layout/DonezoShell';
import { api, getAdminGate, setAdminGate, clearAdminGate, type AdminAnalytics } from '../../lib/api';
import { useAuth } from './AuthContext';

const API = import.meta.env.PUBLIC_API_URL || 'http://localhost:5001/api';
const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('ss_token')}`,
  'X-Admin-Gate': getAdminGate() || '',
});

export default function AdminExcelPage() {
  const { user } = useAuth();
  const [unlocked, setUnlocked] = useState(!!getAdminGate());
  const [pw, setPw] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [stats, setStats] = useState<{ topics: number; problems: number; quiz: number } | null>(null);
  const [admin, setAdmin] = useState<{ userCount: number; topics: unknown[]; problems: unknown[] } | null>(null);
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(false);

  const load = () => {
    api.getAdmin().then(setAdmin).catch(() => {});
    api.getAdminAnalytics().then((r) => setAnalytics(r.analytics)).catch(() => {});
  };

  useEffect(() => {
    if (unlocked) load();
  }, [unlocked]);

  if (!user || user.role !== 'admin') return <Navigate to="/" replace />;

  const tryUnlock = async () => {
    setPwLoading(true);
    try {
      await api.verifyAdminGate(pw);
      setAdminGate(pw);
      setUnlocked(true);
      message.success('Admin panel unlocked');
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : 'Wrong password');
    } finally { setPwLoading(false); }
  };

  const download = async (path: string, name: string) => {
    const res = await fetch(`${API}${path}`, { headers: authHeaders() });
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
  };

  const upload = async (url: string, files: File[]) => {
    setLoading(true);
    const form = new FormData();
    if (url.includes('csv')) files.forEach((f) => form.append('files', f));
    else form.append('file', files[0]);
    try {
      const res = await fetch(`${API}${url}`, { method: 'POST', headers: authHeaders(), body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setStats(data.stats);
      message.success(data.message || 'Imported!');
      load();
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : 'Upload failed');
    } finally { setLoading(false); }
  };

  if (!unlocked) {
    return (
      <div className="admin-gate-screen">
        <div className="bento-card admin-gate-card">
          <LockOutlined style={{ fontSize: 32, color: 'var(--green-800)', marginBottom: 16 }} />
          <h1>Admin Panel</h1>
          <p>Password required · not publicly listed</p>
          <Input.Password placeholder="Admin panel password" value={pw} onChange={(e) => setPw(e.target.value)} size="large" style={{ marginBottom: 12 }} />
          <Button type="primary" block size="large" loading={pwLoading} onClick={tryUnlock}>Unlock</Button>
          <p style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 12 }}>Set ADMIN_PANEL_PASSWORD in server .env</p>
        </div>
      </div>
    );
  }

  if (!admin || !analytics) {
    return <DonezoShell><Spin style={{ display: 'block', margin: 80 }} /></DonezoShell>;
  }

  return (
    <DonezoShell>
      <div className="ss-page-wide">
        <div className="dz-page-head">
          <div>
            <h1><BarChartOutlined /> Admin Insights</h1>
            <p>Analytics · sheet import · export live data</p>
          </div>
          <Button danger onClick={() => { clearAdminGate(); setUnlocked(false); }}>Lock panel</Button>
        </div>

        <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
          <Col xs={12} md={6}><Card className="bento-card-flat"><Statistic title="Total Users" value={analytics.totalUsers} /></Card></Col>
          <Col xs={12} md={6}><Card className="bento-card-flat"><Statistic title="Active Today" value={analytics.activeToday} /></Card></Col>
          <Col xs={12} md={6}><Card className="bento-card-flat"><Statistic title="Active (7d)" value={analytics.activeWeek} /></Card></Col>
          <Col xs={12} md={6}><Card className="bento-card-flat"><Statistic title="Avg Focus min/day" value={analytics.avgFocusMinutesPerDay} /></Card></Col>
          <Col xs={12} md={6}><Card className="bento-card-flat"><Statistic title="Total Solves" value={analytics.totalSolves} /></Card></Col>
          <Col xs={12} md={6}><Card className="bento-card-flat"><Statistic title="Problems" value={analytics.problemCount} /></Card></Col>
          <Col xs={12} md={6}><Card className="bento-card-flat"><Statistic title="Chapters" value={analytics.topicCount} /></Card></Col>
          <Col xs={12} md={6}><Card className="bento-card-flat"><Statistic title="Completion %" value={analytics.completionRate} suffix="%" /></Card></Col>
        </Row>

        <div className="bento-grid" style={{ marginBottom: 20 }}>
          <div className="bento-card bento-span-2">
            <h3>Most Solved Problems</h3>
            <Table size="small" pagination={false} dataSource={analytics.topSolved}
              rowKey="slug"
              columns={[
                { title: 'Problem', dataIndex: 'title' },
                { title: 'Difficulty', dataIndex: 'difficulty' },
                { title: 'Solves', dataIndex: 'solves', width: 80 },
              ]} />
          </div>
          <div className="bento-card bento-span-2">
            <h3>Weekly Traffic</h3>
            <Table size="small" pagination={false} dataSource={analytics.trafficWeek}
              rowKey="_id"
              columns={[
                { title: 'Date', dataIndex: '_id' },
                { title: 'Visits', dataIndex: 'visits' },
                { title: 'Focus min', dataIndex: 'focusMinutes' },
              ]} />
          </div>
        </div>

        {stats && (
          <Alert type="success" showIcon style={{ marginBottom: 16, borderRadius: 14 }}
            message={`Last import: ${stats.topics} topics · ${stats.problems} problems`} />
        )}

        <div className="bento-card">
          <Tabs items={[
            {
              key: 'xlsx', label: 'Excel Import',
              children: (
                <div>
                  <Alert type="info" showIcon style={{ marginBottom: 16 }}
                    message="Upload your DSA .xlsx — imports all problems with statement, examples, code, videos, complexity" />
                  <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                    <Button icon={<DownloadOutlined />} onClick={() => download('/admin/export-excel', 'sheetstack-export.xlsx')}>
                      Download current DB
                    </Button>
                  </div>
                  <Upload accept=".xlsx" showUploadList={false}
                    beforeUpload={(f) => { upload('/admin/import-excel', [f as unknown as File]); return false; }}>
                    <Button type="primary" icon={<FileExcelOutlined />} loading={loading} size="large">Upload .xlsx</Button>
                  </Upload>
                </div>
              ),
            },
            {
              key: 'csv', label: 'CSV Import',
              children: (
                <div>
                  {['topics', 'problems', 'quiz'].map((t) => (
                    <Button key={t} style={{ marginRight: 8, marginBottom: 8 }} icon={<DownloadOutlined />}
                      onClick={() => download(`/admin/export-csv/${t}`, `${t}.csv`)}>{t}.csv</Button>
                  ))}
                  <br />
                  <Upload multiple accept=".csv" showUploadList={false}
                    beforeUpload={(_, list) => { upload('/admin/import-csv', list as unknown as File[]); return false; }}>
                    <Button icon={<UploadOutlined />} loading={loading}>Upload CSV</Button>
                  </Upload>
                </div>
              ),
            },
          ]} />
        </div>
      </div>
    </DonezoShell>
  );
}

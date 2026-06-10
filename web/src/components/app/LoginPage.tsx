import { useState } from 'react';
import { Form, Input, Button, Tabs, message } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { api } from '../../lib/api';

function LogoIcon() {
  return (
    <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
      <circle cx="19" cy="19" r="19" fill="#0D4429" />
      <path d="M12 19C12 14.58 15.58 11 20 11C24.42 11 28 14.58 28 19C28 23.42 24.42 27 20 27" stroke="#52B788" strokeWidth="3" strokeLinecap="round" />
      <circle cx="20" cy="19" r="3" fill="#D8F3DC" />
    </svg>
  );
}

export default function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const resetToken = params.get('reset');
  const [loading, setLoading] = useState(false);
  const [devLink, setDevLink] = useState('');

  if (resetToken) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'var(--bg)' }}>
        <div className="premium-card" style={{ width: 400, maxWidth: '100%' }}>
          <div className="ss-logo" style={{ marginBottom: 24 }}><LogoIcon /> Shubham Sunny DSA Sheet</div>
          <h2 style={{ marginBottom: 20, fontSize: '1.5rem' }}>New password</h2>
          <Form layout="vertical" onFinish={async (v) => {
            await api.resetPassword(resetToken, v.password);
            message.success('Updated. You can sign in now.');
            navigate('/login');
          }}>
            <Form.Item name="password" label="Password" rules={[{ required: true, min: 6 }]}>
              <Input.Password size="large" />
            </Form.Item>
            <Button type="primary" htmlType="submit" block size="large">Save password</Button>
          </Form>
        </div>
      </div>
    );
  }

  return (
    <div className="login-split">
      <div className="login-brand">
        <span className="ss-logo" style={{ marginBottom: 40 }}>
          <LogoIcon /> Shubham Sunny DSA Sheet
        </span>
        <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', lineHeight: 1.15, marginBottom: 20, fontWeight: 800, color: 'var(--ink)' }}>
          Master DSA.<br />Track every win.<br />Earn as you learn.
        </h1>
        <p style={{ color: 'var(--ink-soft)', fontSize: 16, maxWidth: 420, lineHeight: 1.7, fontWeight: 500 }}>
          A structured practice sheet with chapters, problems, quizzes, and coin rewards — designed to keep you consistent.
        </p>
        <div style={{ marginTop: 32, display: 'flex', gap: 24 }}>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--green-800)' }}>50+</div>
            <div style={{ fontSize: 13, color: 'var(--ink-muted)', fontWeight: 600 }}>Problems</div>
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--green-800)' }}>8</div>
            <div style={{ fontSize: 13, color: 'var(--ink-muted)', fontWeight: 600 }}>Chapters</div>
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--green-800)' }}>5🪙</div>
            <div style={{ fontSize: 13, color: 'var(--ink-muted)', fontWeight: 600 }}>Per solve</div>
          </div>
        </div>
      </div>

      <div className="login-form-side">
        <div className="premium-card" style={{ width: 420, maxWidth: '100%', padding: 32, border: 'none', boxShadow: 'var(--shadow)' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: 6, color: 'var(--ink)' }}>Welcome back</h2>
          <p style={{ fontSize: 14, marginBottom: 24 }}>Sign in to continue your progress</p>
          <Tabs items={[
            {
              key: 'login', label: 'Sign in',
              children: (
                <Form layout="vertical" onFinish={async (v) => {
                  setLoading(true);
                  try { await login(v.email, v.password); navigate('/'); }
                  catch (e: unknown) { message.error(e instanceof Error ? e.message : 'Failed'); }
                  finally { setLoading(false); }
                }}>
                  <Form.Item name="email" rules={[{ required: true, type: 'email' }]}><Input placeholder="Email address" size="large" /></Form.Item>
                  <Form.Item name="password" rules={[{ required: true }]}><Input.Password placeholder="Password" size="large" /></Form.Item>
                  <Button type="primary" htmlType="submit" loading={loading} block size="large">Sign in</Button>
                </Form>
              ),
            },
            {
              key: 'reg', label: 'Register',
              children: (
                <Form layout="vertical" onFinish={async (v) => {
                  setLoading(true);
                  try { await register(v.name, v.email, v.password); navigate('/'); }
                  catch (e: unknown) { message.error(e instanceof Error ? e.message : 'Failed'); }
                  finally { setLoading(false); }
                }}>
                  <Form.Item name="name" rules={[{ required: true }]}><Input placeholder="Full name" size="large" /></Form.Item>
                  <Form.Item name="email" rules={[{ required: true, type: 'email' }]}><Input placeholder="Email address" size="large" /></Form.Item>
                  <Form.Item name="password" rules={[{ required: true, min: 6 }]}><Input.Password placeholder="Password (min 6)" size="large" /></Form.Item>
                  <Button type="primary" htmlType="submit" loading={loading} block size="large">Create account</Button>
                </Form>
              ),
            },
          ]} />
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <Button type="link" size="small" style={{ color: 'var(--ink-soft)', fontWeight: 600 }} onClick={async () => {
              const email = prompt('Enter your email for password reset');
              if (!email) return;
              const res = await api.forgotPassword(email);
              if (res.devResetUrl) setDevLink(res.devResetUrl);
              message.success(res.message);
            }}>Forgot password?</Button>
          </div>
          {devLink && (
            <p style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 8, wordBreak: 'break-all' }}>
              Dev reset: <a href={devLink} style={{ color: 'var(--green-700)' }}>{devLink}</a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

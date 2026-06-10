import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme as antTheme, Spin } from 'antd';
import { AuthProvider, useAuth } from './AuthContext';
import LoginPage from './LoginPage';
import HomePage from './HomePage';
import ProblemPage from './ProblemPage';
import WalletPage from './WalletPage';
import FavoritesPage from './FavoritesPage';
import AdminExcelPage from './AdminExcelPage';

const theme = {
  algorithm: antTheme.defaultAlgorithm,
  token: {
    colorPrimary: '#0d4429',
    colorSuccess: '#2e7d32',
    colorWarning: '#b45309',
    colorError: '#dc2626',
    borderRadius: 14,
    borderRadiusLG: 20,
    borderRadiusSM: 10,
    fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
    colorBgContainer: '#ffffff',
    colorBgLayout: '#f5f7f5',
    colorBorder: '#e2e8f0',
    colorText: '#111827',
    colorTextSecondary: '#64748b',
    colorTextTertiary: '#94a3b8',
    controlHeight: 40,
    fontSize: 14,
  },
  components: {
    Button: { primaryShadow: '0 2px 6px rgba(13,68,41,0.2)', fontWeight: 600 },
    Card: { borderRadiusLG: 20 },
    Table: { headerBg: '#f5f7f5', headerColor: '#64748b' },
    Tabs: { inkBarColor: '#0d4429', itemActiveColor: '#0d4429', itemSelectedColor: '#0d4429' },
  },
};

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}><Spin /></div>;
  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}><Spin /></div>;
  return user ? <Navigate to="/" replace /> : <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <Spin />;
  if (!user || user.role !== 'admin') return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <ConfigProvider theme={theme}>
      <AuthProvider>
        <BrowserRouter>
          <div className="ss-app">
            <Routes>
              <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
              <Route path="/" element={<PrivateRoute><HomePage /></PrivateRoute>} />
              <Route path="/topics" element={<PrivateRoute><Navigate to="/" replace /></PrivateRoute>} />
              <Route path="/topics/:slug" element={<PrivateRoute><Navigate to="/" replace /></PrivateRoute>} />
              <Route path="/problem/:slug" element={<PrivateRoute><ProblemPage /></PrivateRoute>} />
              <Route path="/wallet" element={<PrivateRoute><WalletPage /></PrivateRoute>} />
              <Route path="/favorites" element={<PrivateRoute><FavoritesPage /></PrivateRoute>} />
              <Route path="/admin" element={<PrivateRoute><AdminRoute><AdminExcelPage /></AdminRoute></PrivateRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </ConfigProvider>
  );
}

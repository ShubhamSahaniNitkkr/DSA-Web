const API_BASE = import.meta.env.PUBLIC_API_URL || 'http://localhost:5001/api';

const getToken = () =>
  typeof window !== 'undefined' ? localStorage.getItem('ss_token') : null;

export const setToken = (t: string) => localStorage.setItem('ss_token', t);
export const clearToken = () => localStorage.removeItem('ss_token');

const ADMIN_GATE_KEY = 'ss_admin_gate';
export const setAdminGate = (p: string) => sessionStorage.setItem(ADMIN_GATE_KEY, p);
export const getAdminGate = () => sessionStorage.getItem(ADMIN_GATE_KEY);
export const clearAdminGate = () => sessionStorage.removeItem(ADMIN_GATE_KEY);

async function request<T>(endpoint: string, options: RequestInit = {}, admin = false): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (admin) {
    const gate = getAdminGate();
    if (gate) headers['X-Admin-Gate'] = gate;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

async function adminRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  return request<T>(endpoint, options, true);
}

export const api = {
  login: (email: string, password: string) =>
    request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (name: string, email: string, password: string) =>
    request<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),
  forgotPassword: (email: string) =>
    request<{ message: string; devResetUrl?: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  resetPassword: (token: string, password: string) =>
    request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    }),
  getMe: () => request<{ user: User; badgeCatalog: Badge[] }>('/auth/me'),
  updatePreferences: (data: {
    emailReminders?: boolean;
    email?: string;
    reminderTimes?: string[];
    reminderDays?: number[];
  }) => request<{ user: User; emailSent?: boolean }>('/auth/preferences', { method: 'PATCH', body: JSON.stringify(data) }),
  updateAvatar: (avatarData: string) =>
    request<{ user: User }>('/auth/avatar', { method: 'PATCH', body: JSON.stringify({ avatarData }) }),
  getDashboard: () => request<DashboardData>('/dashboard'),
  getDashboardFull: (params?: { difficulty?: string; company?: string }) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return request<DashboardData & { sheet: TopicCard[]; progress: Record<string, boolean> }>(
      `/dashboard/full${q ? `?${q}` : ''}`
    );
  },
  recordFocus: () => request('/dashboard/focus', { method: 'POST' }),
  syncTime: (data: { activeSeconds?: number; solveSeconds?: number; lastSessionSeconds?: number; problemSlug?: string }) =>
    request('/dashboard/time', { method: 'POST', body: JSON.stringify(data) }),
  syncTimeKeepalive: (data: { activeSeconds?: number; solveSeconds?: number; lastSessionSeconds?: number; problemSlug?: string }) => {
    const token = getToken();
    return fetch(`${API_BASE}/dashboard/time`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
      keepalive: true,
    }).catch(() => {});
  },
  getTimeStats: () => request<{ stats: { totalActiveSeconds: number; totalSolveSeconds: number; lastSessionSeconds: number } }>('/dashboard/time-stats'),
  getFavorites: () => request<{ favorites: FavoriteItem[] }>('/dashboard/favorites'),
  getLastVisited: () => request<{ lastVisited: LastVisitedProblem | null }>('/dashboard/last-visited'),
  getProblemTimeHistory: (slug: string) =>
    request<{ history: { date: string; minutes: number }[]; demo?: boolean }>(`/problems/${slug}/time-history`),
  getProblemInsights: (slug: string) =>
    request<{ insights: ProblemInsightsData }>(`/problems/${slug}/insights`),
  getSheet: (params?: { difficulty?: string; company?: string }) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return request<{ sheet: TopicCard[]; progress: Record<string, boolean>; stats: Stats }>(
      `/sheet${q ? `?${q}` : ''}`
    );
  },
  getCompanies: () => request<{ companies: string[] }>('/companies'),
  getTopic: (slug: string, params?: { difficulty?: string; company?: string }) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return request(`/topics/${slug}${q ? `?${q}` : ''}`);
  },
  toggleProgress: (problemId: string, completed: boolean) =>
    request<{ coinsEarned: number; coins: number; success: boolean }>(`/progress/${problemId}`, {
      method: 'PATCH',
      body: JSON.stringify({ completed }),
    }),
  getProblem: (slug: string) => request<ProblemDetail>(`/problems/${slug}`),
  saveNote: (slug: string, content: string) =>
    request(`/problems/${slug}/note`, { method: 'PUT', body: JSON.stringify({ content }) }),
  toggleFavorite: (slug: string) =>
    request<{ isFavorite: boolean }>(`/problems/${slug}/favorite`, { method: 'POST' }),
  setReaction: (slug: string, reaction: 'like' | 'dislike') =>
    request(`/problems/${slug}/reaction`, { method: 'POST', body: JSON.stringify({ reaction }) }),
  runCode: (slug: string, code: string) =>
    request(`/problems/${slug}/run`, { method: 'POST', body: JSON.stringify({ code }) }),
  getQuiz: (slug: string) => request(`/quiz/problem/${slug}`),
  submitQuiz: (quizId: string, selectedIndex: number) =>
    request('/quiz/submit', { method: 'POST', body: JSON.stringify({ quizId, selectedIndex }) }),
  getWallet: () => request<WalletData>('/wallet'),
  requestWithdrawal: (data: { type: string; amount: number; upiId?: string }) =>
    request('/wallet/request', { method: 'POST', body: JSON.stringify(data) }),
  verifyAdminGate: (password: string) =>
    request<{ success: boolean }>('/admin/verify-gate', { method: 'POST', body: JSON.stringify({ password }) }),
  getAdmin: () => adminRequest('/admin'),
  getAdminAnalytics: () => adminRequest<{ analytics: AdminAnalytics }>('/admin/analytics'),
  upsertTopic: (data: object) => adminRequest('/admin/topics', { method: 'POST', body: JSON.stringify(data) }),
  upsertProblem: (data: object) => adminRequest('/admin/problems', { method: 'POST', body: JSON.stringify(data) }),
  deleteProblem: (id: string) => adminRequest(`/admin/problems/${id}`, { method: 'DELETE' }),
};

export interface AdminAnalytics {
  totalUsers: number;
  activeToday: number;
  activeWeek: number;
  totalSolves: number;
  topicCount: number;
  problemCount: number;
  avgFocusMinutesPerDay: number;
  completionRate: number;
  topSolved: { title: string; slug: string; solves: number; difficulty: string }[];
  leastSolved: { title: string; slug: string; solves: number }[];
  trafficWeek: { _id: string; visits: number; focusMinutes: number }[];
}

export interface SheetData {
  serialNo?: number;
  problemLink?: string;
  problemStatement?: string;
  examples?: string;
  youtubeLink?: string;
  practiceLink?: string;
  articleLink?: string;
  editorialLink?: string;
  solveLink?: string;
  articleTitle?: string;
  scrapeStatus?: string;
  fullArticleText?: string;
  otherApproaches?: string;
  bruteForce?: {
    algorithm?: string;
    timeComplexity?: string;
    spaceComplexity?: string;
    codeJs?: string;
    codePython?: string;
    codeJava?: string;
    codeCpp?: string;
  };
  optimal?: {
    algorithm?: string;
    timeComplexity?: string;
    spaceComplexity?: string;
    codeJs?: string;
    codePython?: string;
    codeJava?: string;
    codeCpp?: string;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  coins: number;
  upiId?: string;
  badges: string[];
  avatarData?: string;
  emailReminders?: boolean;
  reminderTimes?: string[];
  reminderDays?: number[];
  whatsapp?: string;
}

export interface Badge {
  id: string;
  name: string;
  desc: string;
  emoji?: string;
  color?: string;
}

export interface Stats {
  totalProblems: number;
  completedCount: number;
  percentage: number;
}

export interface TopicCard {
  _id: string;
  title: string;
  slug: string;
  description: string;
  icon: string;
  accentColor: string;
  chapterOrder: number;
  totalQuestions: number;
  completedCount: number;
  coinsEarnable: number;
  coinsEarned: number;
  progressPercent: number;
  problems: Problem[];
}

export interface Problem {
  _id: string;
  title: string;
  slug: string;
  subtopic: string;
  difficulty: string;
  companies: string[];
  resources: { youtube?: string; leetcode?: string; article?: string; codeforces?: string; affiliate?: string };
  sheetData?: SheetData;
}

export interface DashboardData {
  user: { name: string; coins: number; badges: Badge[]; upiId?: string };
  stats: Stats;
  consistency: { date: string; label: string; focusMinutes: number; active: boolean }[];
  calendar: { date: string; visited: boolean; solved: boolean; level: number }[];
  badgeCatalog: Badge[];
}

export interface ProblemDetail {
  problem: Problem & {
    starterCode: string;
    sheetData?: SheetData;
    testCases: { input: string; expected: string }[];
    likes: number;
    dislikes: number;
  };
  topic: { title: string; slug: string };
  note: string;
  isFavorite: boolean;
  userReaction: string | null;
  completed: boolean;
}

export interface ProblemInsightsData {
  lastAttempted: { name: string; at: string; isYou?: boolean } | null;
  fastestSolver: { name: string; timeSeconds: number; isYou?: boolean } | null;
  totalSolvers: number;
  you: {
    lastAttemptedAt: string | null;
    lastSessionSeconds: number;
    totalTimeSeconds: number;
    attemptCount: number;
  };
  demo?: boolean;
}

export interface LastVisitedProblem {
  slug: string;
  title: string;
  difficulty: string;
  subtopic?: string;
  topic: string;
  lastOpenedAt: string;
  lastSessionSeconds: number;
  totalTimeSeconds: number;
}

export interface FavoriteItem {
  slug: string;
  title: string;
  topic: string;
  difficulty: string;
  subtopic?: string;
  timeSpentSeconds: number;
  lastOpenedAt: string | null;
  favoritedAt?: string;
}

export interface WalletData {
  coins: number;
  rupees: number;
  paise: number;
  paisePerCoin: number;
  upiId: string;
  withdrawals: { type: string; amount: number; status: string; createdAt: string }[];
}

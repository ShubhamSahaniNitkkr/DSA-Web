/** Same-origin /api on HTTPS (Amplify proxy). Avoids mixed-content blocks. */
export function getApiBase(): string {
  const env = import.meta.env.PUBLIC_API_URL?.replace(/\/$/, '');
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    if (!env || env.startsWith('http://')) return '/api';
    return env;
  }
  return env || 'http://localhost:5001/api';
}

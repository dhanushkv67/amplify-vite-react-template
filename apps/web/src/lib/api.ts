export type User = { id: string; email: string };

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) { super(message); this.name = 'ApiError'; }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!path.startsWith('/api/') || path.startsWith('//')) throw new Error('API path must be same-origin');
  let response: Response;
  try {
    response = await fetch(path, { ...options, credentials: 'include', headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers,
    } });
  } catch { throw new ApiError(0, 'Network unavailable. Please try again.'); }
  if (response.status === 204) return undefined as T;
  const content = await response.json().catch(() => null) as { error?: string } | null;
  if (!response.ok) throw new ApiError(response.status, content?.error ?? `Request failed (${response.status})`);
  return content as T;
}

export const authApi = {
  me: () => api<User>('/api/auth/me'),
  signup: (email: string, password: string) => api<User>('/api/auth/signup', {
    method: 'POST', body: JSON.stringify({ email, password }),
  }),
  login: (email: string, password: string) => api<User>('/api/auth/login', {
    method: 'POST', body: JSON.stringify({ email, password }),
  }),
  logout: () => api<void>('/api/auth/logout', { method: 'POST' }),
};

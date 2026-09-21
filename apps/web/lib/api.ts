const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('project-control-token');
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Request failed');
  }

  return (await res.json()) as T;
}

export const api = {
  health: () => request<{ status: string; service: string }>('/health'),
  isAuthenticated: () => typeof window !== 'undefined' && Boolean(localStorage.getItem('project-control-token')),
  me: () => request<any>('/auth/me'),
  getProject: (projectId: number) => request<any>(`/projects/${projectId}`),
  getProjects: () => request<any[]>('/projects'),
  getDashboard: (projectId: number) => request<any>(`/projects/${projectId}/dashboard`),
  getRisks: (projectId: number) => request<any[]>(`/projects/${projectId}/risks`),
  getIssues: (projectId: number) => request<any[]>(`/projects/${projectId}/issues`),
  getDecisions: (projectId: number) => request<any[]>(`/projects/${projectId}/decisions`),
  getChanges: (projectId: number) => request<any[]>(`/projects/${projectId}/changes`),
  getMilestones: (projectId: number) => request<any[]>(`/projects/${projectId}/milestones`),
  createMilestone: (projectId: number, payload: any) =>
    request<any>(`/projects/${projectId}/milestones`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateMilestone: (projectId: number, milestoneId: number, payload: any) =>
    request<any>(`/projects/${projectId}/milestones/${milestoneId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  getWeeklyReports: (projectId: number) => request<any[]>(`/projects/${projectId}/weekly-reports`),
  login: (email: string, password: string) =>
    request<{ access_token: string; token_type: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
};

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
  createRisk: (projectId: number, payload: any) =>
    request<any>(`/projects/${projectId}/risks`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateRisk: (projectId: number, riskId: number, payload: any) =>
    request<any>(`/projects/${projectId}/risks/${riskId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  getRiskChanges: (projectId: number, riskId: number) =>
    request<any[]>(`/projects/${projectId}/risks/${riskId}/changes`),
  createRiskChange: (projectId: number, riskId: number, payload: any) =>
    request<any>(`/projects/${projectId}/risks/${riskId}/changes`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getAuditLogs: (projectId: number) => request<any[]>(`/projects/${projectId}/audit-logs`),
  getIssues: (projectId: number) => request<any[]>(`/projects/${projectId}/issues`),
  createIssue: (projectId: number, payload: any) =>
    request<any>(`/projects/${projectId}/issues`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateIssue: (projectId: number, issueId: number, payload: any) =>
    request<any>(`/projects/${projectId}/issues/${issueId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  getIssueChanges: (projectId: number, issueId: number) =>
    request<any[]>(`/projects/${projectId}/issues/${issueId}/changes`),
  createIssueChange: (projectId: number, issueId: number, payload: any) =>
    request<any>(`/projects/${projectId}/issues/${issueId}/changes`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getDecisions: (projectId: number) => request<any[]>(`/projects/${projectId}/decisions`),
  createDecision: (projectId: number, payload: any) =>
    request<any>(`/projects/${projectId}/decisions`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateDecision: (projectId: number, decisionId: number, payload: any) =>
    request<any>(`/projects/${projectId}/decisions/${decisionId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  getChanges: (projectId: number) => request<any[]>(`/projects/${projectId}/changes`),
  createChange: (projectId: number, payload: any) =>
    request<any>(`/projects/${projectId}/changes`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateChange: (projectId: number, changeId: number, payload: any) =>
    request<any>(`/projects/${projectId}/changes/${changeId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
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
  createWeeklyReport: (projectId: number, payload: any) =>
    request<any>(`/projects/${projectId}/weekly-reports`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateWeeklyReport: (projectId: number, reportId: number, payload: any) =>
    request<any>(`/projects/${projectId}/weekly-reports/${reportId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  login: (email: string, password: string) =>
    request<{ access_token: string; token_type: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
};

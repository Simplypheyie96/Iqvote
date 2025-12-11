import { projectId, publicAnonKey } from './supabase/info';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-e2c9f810`;

export async function apiCall(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('access_token') || publicAnonKey;
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    const data = await response.json().catch(() => ({ error: 'Request failed' }));
    const error = new Error(data.error || 'API request failed');
    (error as any).status = response.status;
    throw error;
  }
  
  const data = await response.json();
  return data;
}

export const api = {
  // Auth
  signup: (email: string, password: string, name: string, role: string) =>
    apiCall('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, role }),
    }),
  
  getSession: () => apiCall('/auth/session'),
  
  getCurrentUser: async () => {
    const session = await apiCall('/auth/session');
    if (!session.session || !session.session.profile) {
      throw new Error('Unauthorized');
    }
    return { user: session.session.profile };
  },
  
  // Employees
  getEmployees: () => apiCall('/employees'),
  createEmployee: (data: any) =>
    apiCall('/admin/employees', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateEmployee: (id: string, data: any) =>
    apiCall(`/admin/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteEmployee: (id: string) =>
    apiCall(`/admin/employees/${id}`, {
      method: 'DELETE',
    }),
  
  // Elections
  getElections: () => apiCall('/elections'),
  getCurrentElection: () => apiCall('/elections/current'),
  getElection: (id: string) => apiCall(`/elections/${id}`),
  
  // Ballots
  getBallot: (electionId: string) => apiCall(`/elections/${electionId}/ballot`),
  submitBallot: (electionId: string, selections: any[]) =>
    apiCall(`/elections/${electionId}/ballot`, {
      method: 'POST',
      body: JSON.stringify({ selections }),
    }),
  
  // Leaderboard
  getLeaderboard: (electionId: string) => apiCall(`/elections/${electionId}/leaderboard`),
  
  // Aggregated leaderboard (by time period)
  getAggregatedLeaderboard: (year?: string, month?: string) => {
    const params = new URLSearchParams();
    if (year) params.append('year', year);
    if (month !== undefined && month !== null && month !== '') params.append('month', month.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiCall(`/leaderboard/aggregated${query}`);
  },
  
  // Admin
  createElection: (data: any) =>
    apiCall('/admin/elections', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  importEmployees: (employees: any[]) =>
    apiCall('/admin/employees/import', {
      method: 'POST',
      body: JSON.stringify({ employees }),
    }),
  
  getVotes: (electionId: string) => apiCall(`/admin/elections/${electionId}/votes`),
  
  revokeBallot: (election_id: string, voter_id: string, reason: string) =>
    apiCall('/admin/ballots/revoke', {
      method: 'POST',
      body: JSON.stringify({ election_id, voter_id, reason }),
    }),
  
  exportResults: (electionId: string) => apiCall(`/admin/elections/${electionId}/export`),
  
  importHistoricalData: (data: any) =>
    apiCall('/admin/import/historical', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  // User history
  getMyVotes: () => apiCall('/my-votes'),
  getMyReceivedVotes: () => apiCall('/my-received-votes'),
  
  // User management (admin only)
  getUsers: () => apiCall('/users'),
  updateUserAdmin: (userId: string, isAdmin: boolean) =>
    apiCall(`/users/${userId}/admin`, {
      method: 'PUT',
      body: JSON.stringify({ is_admin: isAdmin }),
    }),
  convertUserToEmployee: (userId: string, data?: { department?: string; image_url?: string }) =>
    apiCall(`/users/${userId}/convert-to-employee`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    }),
  deleteUser: (userId: string) =>
    apiCall(`/users/${userId}`, {
      method: 'DELETE',
    }),
};
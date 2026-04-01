import { projectId, publicAnonKey } from './supabase/info';
import { createClient } from './supabase/client';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-e2c9f810`;

// Cache session to avoid constant re-fetching
let cachedSession: { token: string; expiresAt: number } | null = null;
const SESSION_CACHE_DURATION = 50000; // 50 seconds (tokens expire at 60s)

async function getAuthToken(): Promise<string> {
  // Return cached token if still valid
  if (cachedSession && cachedSession.expiresAt > Date.now()) {
    return cachedSession.token;
  }

  const supabase = createClient();
  
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    // If there's a refresh token error, clear the session and use anon key
    if (sessionError) {
      console.error('Session error:', sessionError);
      if (sessionError.message.includes('Refresh Token')) {
        console.log('Invalid refresh token detected, clearing session');
        await supabase.auth.signOut();
        cachedSession = null;
        return publicAnonKey;
      }
    }
    
    const token = session?.access_token || publicAnonKey;
    
    // Cache the token
    if (session?.access_token) {
      cachedSession = {
        token,
        expiresAt: Date.now() + SESSION_CACHE_DURATION
      };
    }
    
    return token;
  } catch (err: any) {
    // If it's a refresh token error, clear the session
    if (err.message?.includes('Refresh Token')) {
      console.log('Refresh token error in catch, clearing session');
      await supabase.auth.signOut();
      cachedSession = null;
    }
    return publicAnonKey;
  }
}

// Clear cached session (call this on sign out)
export function clearSessionCache() {
  cachedSession = null;
}

export async function apiCall(endpoint: string, options: RequestInit = {}) {
  const token = await getAuthToken();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });
  } catch (err: any) {
    if (err.name === 'AbortError') throw new Error('Request timed out. Please try again.');
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
  
  if (!response.ok) {
    const data = await response.json().catch(() => ({ error: 'Request failed' }));
    const error = new Error(data.error || 'API request failed');
    (error as any).status = response.status;
    (error as any).details = data;
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
  forgotPassword: (email: string) =>
    apiCall('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  resetPassword: (token: string, password: string) =>
    apiCall('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    }),
  
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
  
  deleteElection: (electionId: string) =>
    apiCall(`/admin/elections/${electionId}`, {
      method: 'DELETE',
    }),

  notifyElection: (electionId: string) =>
    apiCall(`/admin/elections/${electionId}/notify`, {
      method: 'POST',
    }),
  
  getElectionVoteCounts: () => apiCall('/admin/elections/vote-counts'),
  
  updateElectionStatus: (electionId: string, action: 'close' | 'reopen', newEndTime?: string) =>
    apiCall(`/admin/elections/${electionId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ action, new_end_time: newEndTime }),
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
  
  exportAllData: () => apiCall('/admin/export/all-data'),
  
  importHistoricalData: (data: any) =>
    apiCall('/admin/import/historical', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  // Self-profile update
  updateMyProfile: (data: { name?: string; role?: string; image_url?: string }) =>
    apiCall('/profile', {
      method: 'PUT',
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
  resetUserPassword: (userId: string, newPassword: string) =>
    apiCall(`/users/${userId}/reset-password`, {
      method: 'PUT',
      body: JSON.stringify({ new_password: newPassword }),
    }),
};

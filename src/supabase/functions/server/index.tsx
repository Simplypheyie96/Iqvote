import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';

const app = new Hono();

app.use('*', cors());
app.use('*', logger(console.log));

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Helper to get authenticated user
async function getAuthenticatedUser(request: Request) {
  const accessToken = request.headers.get('Authorization')?.split(' ')[1];
  if (!accessToken) return null;
  
  // Create a client with the user's access token for proper validation
  const userClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    }
  );
  
  const { data: { user }, error } = await userClient.auth.getUser();
  if (error || !user) {
    console.log('Auth validation error:', error);
    return null;
  }
  
  return user;
}

// Helper to check if user is admin
async function isUserAdmin(userId: string): Promise<boolean> {
  const userProfile = await kv.get(`user:${userId}`);
  return userProfile?.is_admin === true;
}

async function isSuperAdmin(userId: string): Promise<boolean> {
  const userProfile = await kv.get(`user:${userId}`);
  return userProfile?.email === 'ajayifey@gmail.com' && userProfile?.is_admin === true;
}

async function isSuperAdminEmail(email: string): Promise<boolean> {
  return email === 'ajayifey@gmail.com';
}

// Helper to create audit log
async function createAuditLog(action: string, details: any) {
  const auditId = crypto.randomUUID();
  const auditLog = {
    id: auditId,
    timestamp: new Date().toISOString(),
    action,
    ...details
  };
  await kv.set(`audit:${auditId}`, auditLog);
  return auditLog;
}

// Auth routes
app.post('/make-server-e2c9f810/auth/signup', async (c) => {
  try {
    const { email, password, name, role } = await c.req.json();
    
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role },
      // Automatically confirm the user's email since an email server hasn't been configured
      email_confirm: true
    });
    
    if (error) {
      console.log('Signup error:', error);
      return c.json({ error: error.message }, 400);
    }
    
    // Check if this is the first user - if so, make them admin
    // Check for existing users (voters) not employees
    const existingUsers = await kv.getByPrefix('user:');
    const isFirstUser = existingUsers.length === 0;
    
    // Store user profile (VOTER profile, not employee)
    // Users can vote but are NOT automatically candidates
    const createdAt = new Date().toISOString();
    await kv.set(`user:${data.user.id}`, {
      id: data.user.id,
      email,
      name,
      role,
      is_admin: isFirstUser, // First user is automatically admin
      active: true,
      created_at: createdAt
    });
    
    // Create audit log for user signup
    await createAuditLog('user_signup', {
      user_id: data.user.id,
      user_email: email,
      user_name: name,
      type: 'auth',
      details: { role, is_first_user: isFirstUser }
    });
    
    console.log(`User created: ${email}${isFirstUser ? ' (ADMIN - first user)' : ''}`);
    console.log('Note: User can vote but is NOT automatically a votable employee');
    
    return c.json({ user: data.user, is_first_user: isFirstUser });
  } catch (error) {
    console.log('Signup error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

app.get('/make-server-e2c9f810/auth/session', async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    // Get user profile (voter profile, not employee)
    let profile = await kv.get(`user:${user.id}`);
    
    if (!profile) {
      return c.json({ error: 'User profile not found' }, 404);
    }
    
    if (await isSuperAdminEmail(user.email || '') && !profile.is_admin) {
      console.log(`Auto-granting admin privileges: ${user.email}`);
      profile.is_admin = true;
      profile.updated_at = new Date().toISOString();
      await kv.set(`user:${user.id}`, profile);
    }
    
    return c.json({ session: { user, profile } });
  } catch (error) {
    console.log('Session error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// Self-profile update (authenticated user updates their own profile)
app.put('/make-server-e2c9f810/profile', async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const profile = await kv.get(`user:${user.id}`);
    if (!profile) {
      return c.json({ error: 'Profile not found' }, 404);
    }

    const { name, role, image_url } = await c.req.json();

    const updated = {
      ...profile,
      ...(name !== undefined && { name }),
      ...(role !== undefined && { role }),
      ...(image_url !== undefined && { image_url }),
      updated_at: new Date().toISOString(),
    };

    await kv.set(`user:${user.id}`, updated);
    return c.json({ user: updated });
  } catch (error) {
    console.log('Update profile error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// Employee routes
app.get('/make-server-e2c9f810/employees', async (c) => {
  try {
    const employees = await kv.getByPrefix('employee:');
    const active = employees.filter(e => e.active !== false);
    return c.json({ employees: active });
  } catch (error) {
    console.log('Get employees error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// User management routes (for admin to manage voters)
app.get('/make-server-e2c9f810/users', async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    // Check if user is admin
    const profile = await kv.get(`user:${user.id}`);
    if (!profile?.is_admin) {
      return c.json({ error: 'Forbidden: Admin access required' }, 403);
    }
    
    const users = await kv.getByPrefix('user:');
    const sorted = users.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return c.json({ users: sorted });
  } catch (error) {
    console.log('Get users error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

app.put('/make-server-e2c9f810/users/:userId/admin', async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    if (!(await isSuperAdmin(user.id))) {
      return c.json({ error: 'Forbidden: Only the system owner can manage admin privileges' }, 403);
    }
    
    const userId = c.req.param('userId');
    const { is_admin } = await c.req.json();
    
    const targetUser = await kv.get(`user:${userId}`);
    if (!targetUser) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    if (await isSuperAdminEmail(targetUser.email)) {
      return c.json({ error: 'Cannot modify admin status of system owner' }, 403);
    }
    
    // Update admin status
    const oldAdminStatus = targetUser.is_admin;
    targetUser.is_admin = is_admin;
    targetUser.updated_at = new Date().toISOString();
    await kv.set(`user:${userId}`, targetUser);
    
    // Create audit log
    const auditId = crypto.randomUUID();
    const currentUserProfile = await kv.get(`user:${user.id}`);
    const auditLog = {
      id: auditId,
      timestamp: new Date().toISOString(),
      action: is_admin ? 'admin_granted' : 'admin_revoked',
      admin_id: user.id,
      admin_email: user.email,
      admin_name: currentUserProfile?.name || user.email,
      target_user_id: userId,
      target_user_email: targetUser.email,
      target_user_name: targetUser.name,
      old_value: oldAdminStatus,
      new_value: is_admin,
      details: {
        reason: is_admin ? 'Admin privileges granted' : 'Admin privileges revoked',
        performed_by: currentUserProfile?.name || user.email
      }
    };
    await kv.set(`audit:${auditId}`, auditLog);
    
    console.log(`User ${targetUser.email} admin status updated to: ${is_admin} by ${user.email}`);
    
    return c.json({ user: targetUser });
  } catch (error) {
    console.log('Update user admin status error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

app.post('/make-server-e2c9f810/users/:userId/convert-to-employee', async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    // Check if user is admin
    const profile = await kv.get(`user:${user.id}`);
    if (!profile?.is_admin) {
      return c.json({ error: 'Forbidden: Admin access required' }, 403);
    }
    
    const userId = c.req.param('userId');
    const targetUser = await kv.get(`user:${userId}`);
    if (!targetUser) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    // Check if user is already an employee
    const existingEmployee = await kv.get(`employee:${userId}`);
    if (existingEmployee) {
      return c.json({ error: 'User is already an employee' }, 400);
    }
    
    // Get optional additional data from request
    const { department, image_url } = await c.req.json().catch(() => ({}));
    
    // Create employee record from user data
    const employee = {
      id: targetUser.id,
      email: targetUser.email,
      name: targetUser.name,
      role: targetUser.role || 'Employee',
      department: department || '',
      image_url: image_url || '',
      active: true,
      is_admin: targetUser.is_admin || false,
      created_at: new Date().toISOString()
    };
    
    await kv.set(`employee:${userId}`, employee);
    
    console.log(`User ${targetUser.email} converted to employee by ${profile.email}`);
    
    return c.json({ employee });
  } catch (error) {
    console.log('Convert user to employee error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

app.delete('/make-server-e2c9f810/users/:userId', async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    // Check if user is admin
    const profile = await kv.get(`user:${user.id}`);
    if (!profile?.is_admin) {
      return c.json({ error: 'Forbidden: Admin access required' }, 403);
    }
    
    const userId = c.req.param('userId');
    const targetUser = await kv.get(`user:${userId}`);
    if (!targetUser) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    if (await isSuperAdminEmail(targetUser.email)) {
      return c.json({ error: 'Cannot delete the system owner account' }, 403);
    }
    
    // Delete from KV store
    await kv.del(`user:${userId}`);
    
    // Delete from Supabase Auth (this will sign them out)
    try {
      const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(userId);
      if (deleteAuthError) {
        console.log('Warning: Could not delete user from Supabase Auth:', deleteAuthError);
      }
    } catch (authError) {
      console.log('Warning: Error deleting user from auth:', authError);
    }
    
    // Create audit log
    const auditId = crypto.randomUUID();
    const currentUserProfile = await kv.get(`user:${user.id}`);
    const auditLog = {
      id: auditId,
      timestamp: new Date().toISOString(),
      action: 'user_deleted',
      admin_id: user.id,
      admin_email: user.email,
      admin_name: currentUserProfile?.name || user.email,
      target_user_id: userId,
      target_user_email: targetUser.email,
      target_user_name: targetUser.name,
      details: {
        reason: 'User account deleted by admin',
        performed_by: currentUserProfile?.name || user.email
      }
    };
    await kv.set(`audit:${auditId}`, auditLog);
    
    console.log(`User ${targetUser.email} deleted by admin ${user.email}`);
    
    return c.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.log('Delete user error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

app.put('/make-server-e2c9f810/users/:userId/reset-password', async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    // Check if user is admin
    const profile = await kv.get(`user:${user.id}`);
    if (!profile?.is_admin) {
      return c.json({ error: 'Forbidden: Admin access required' }, 403);
    }
    
    const userId = c.req.param('userId');
    const { new_password } = await c.req.json();
    
    if (!new_password || new_password.length < 6) {
      return c.json({ error: 'Password must be at least 6 characters' }, 400);
    }
    
    const targetUser = await kv.get(`user:${userId}`);
    if (!targetUser) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    // Update password using Supabase admin API
    const { data, error: updateError } = await supabase.auth.admin.updateUserById(
      userId,
      { password: new_password }
    );
    
    if (updateError) {
      console.log('Password update error:', updateError);
      return c.json({ error: updateError.message }, 400);
    }
    
    // Create audit log
    const auditId = crypto.randomUUID();
    const currentUserProfile = await kv.get(`user:${user.id}`);
    const auditLog = {
      id: auditId,
      timestamp: new Date().toISOString(),
      action: 'password_reset',
      admin_id: user.id,
      admin_email: user.email,
      admin_name: currentUserProfile?.name || user.email,
      target_user_id: userId,
      target_user_email: targetUser.email,
      target_user_name: targetUser.name,
      details: {
        reason: 'Password reset by admin',
        performed_by: currentUserProfile?.name || user.email
      }
    };
    await kv.set(`audit:${auditId}`, auditLog);
    
    console.log(`Password reset for user ${targetUser.email} by admin ${user.email}`);
    
    return c.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.log('Reset password error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// Election routes
app.get('/make-server-e2c9f810/elections', async (c) => {
  try {
    const elections = await kv.getByPrefix('election:');
    const sorted = elections.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return c.json({ elections: sorted });
  } catch (error) {
    console.log('Get elections error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

app.get('/make-server-e2c9f810/elections/current', async (c) => {
  try {
    const elections = await kv.getByPrefix('election:');
    const now = new Date();
    
    const active = elections.find(e => {
      const start = new Date(e.start_time);
      const end = new Date(e.end_time);
      return start <= now && now <= end;
    });
    
    return c.json({ election: active || null });
  } catch (error) {
    console.log('Get current election error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

app.get('/make-server-e2c9f810/elections/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const election = await kv.get(`election:${id}`);
    
    if (!election) {
      return c.json({ error: 'Election not found' }, 404);
    }
    
    return c.json({ election });
  } catch (error) {
    console.log('Get election error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// Ballot routes
app.get('/make-server-e2c9f810/elections/:electionId/ballot', async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const electionId = c.req.param('electionId');
    
    // Check by user ID first
    let ballot = await kv.get(`ballot:${electionId}:${user.id}`);
    
    // If not found by user ID, check by email (for backwards compatibility)
    if (!ballot && user.email) {
      ballot = await kv.get(`ballot:${electionId}:email:${user.email}`);
    }
    
    return c.json({ ballot: ballot || null });
  } catch (error) {
    console.log('Get ballot error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

app.post('/make-server-e2c9f810/elections/:electionId/ballot', async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const electionId = c.req.param('electionId');
    const { selections } = await c.req.json();
    
    // Get election
    const election = await kv.get(`election:${electionId}`);
    if (!election) {
      return c.json({ error: 'Election not found' }, 404);
    }
    
    // Validate voting window
    const now = new Date();
    const start = new Date(election.start_time);
    const end = new Date(election.end_time);
    
    if (now < start) {
      return c.json({ error: 'Voting has not started yet' }, 400);
    }
    
    if (now > end) {
      return c.json({ error: 'Voting has ended' }, 400);
    }
    
    // Validate selections
    if (!selections || selections.length !== 3) {
      return c.json({ error: 'Must select exactly 3 employees' }, 400);
    }
    
    const ranks = selections.map(s => s.rank).sort();
    if (ranks.join(',') !== '1,2,3') {
      return c.json({ error: 'Must have ranks 1, 2, and 3' }, 400);
    }
    
    const employeeIds = selections.map(s => s.employee_id);
    const uniqueIds = new Set(employeeIds);
    if (uniqueIds.size !== 3) {
      return c.json({ error: 'Must select 3 distinct employees' }, 400);
    }
    
    // Check if user has already voted - PREVENT CHANGING VOTES
    const existingBallot = await kv.get(`ballot:${electionId}:${user.id}`);
    if (existingBallot && !existingBallot.revoked) {
      return c.json({ error: 'You have already voted in this election. Votes cannot be changed.' }, 400);
    }
    
    // Add new votes (only happens if no previous vote exists)
    for (const selection of selections) {
      const tally = await kv.get(`tally:${electionId}:${selection.employee_id}`) || {
        employee_id: selection.employee_id,
        total_points: 0,
        count_first: 0,
        count_second: 0,
        count_third: 0
      };
      
      tally.total_points += selection.points;
      if (selection.rank === 1) tally.count_first++;
      if (selection.rank === 2) tally.count_second++;
      if (selection.rank === 3) tally.count_third++;
      
      await kv.set(`tally:${electionId}:${selection.employee_id}`, tally);
    }
    
    // Save ballot
    const ballot = {
      voter_id: user.id,
      election_id: electionId,
      selections,
      created_at: new Date().toISOString(),
      revoked: false
    };
    
    await kv.set(`ballot:${electionId}:${user.id}`, ballot);
    
    return c.json({ ballot });
  } catch (error) {
    console.log('Submit ballot error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// Leaderboard route
app.get('/make-server-e2c9f810/elections/:electionId/leaderboard', async (c) => {
  try {
    const electionId = c.req.param('electionId');
    
    const tallies = await kv.getByPrefix(`tally:${electionId}:`);
    const allEmployees = await kv.getByPrefix('employee:');
    const employeeMap = new Map(allEmployees.map(emp => [emp.id, emp]));
    
    // Get all ballots to count unique voters
    const allBallots = await kv.getByPrefix(`ballot:`);
    const electionBallots = allBallots.filter(b => 
      b.election_id === electionId && !b.revoked
    );
    
    // Compile reasons for each employee
    const reasonsMap = new Map<string, {count: number, messages: string[]}>();
    electionBallots.forEach(ballot => {
      ballot.selections.forEach((sel: any) => {
        if (sel.reason && sel.reason.trim()) {
          if (!reasonsMap.has(sel.employee_id)) {
            reasonsMap.set(sel.employee_id, { count: 0, messages: [] });
          }
          const data = reasonsMap.get(sel.employee_id)!;
          data.count++;
          data.messages.push(sel.reason.trim());
        }
      });
    });
    
    const leaderboard = tallies
      .filter(t => t.total_points > 0)
      .map(t => ({
        ...t,
        employee: employeeMap.get(t.employee_id),
        vote_count: t.count_first + t.count_second + t.count_third,
        message_count: reasonsMap.get(t.employee_id)?.count || 0,
        messages: reasonsMap.get(t.employee_id)?.messages || []
      }))
      .sort((a, b) => {
        if (b.total_points !== a.total_points) return b.total_points - a.total_points;
        if (b.count_first !== a.count_first) return b.count_first - a.count_first;
        if (b.count_second !== a.count_second) return b.count_second - a.count_second;
        return b.count_third - a.count_third;
      });
    
    return c.json({ leaderboard });
  } catch (error) {
    console.log('Get leaderboard error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// Aggregated leaderboard route (by time period)
app.get('/make-server-e2c9f810/leaderboard/aggregated', async (c) => {
  try {
    const year = c.req.query('year');
    const month = c.req.query('month'); // 0-based: 0=Jan, 11=Dec
    
    const allElections = await kv.getByPrefix('election:');
    const allEmployees = await kv.getByPrefix('employee:');
    const employeeMap = new Map(allEmployees.map(emp => [emp.id, emp]));
    
    // Filter elections by time period
    let filteredElections = allElections;
    
    if (year) {
      filteredElections = allElections.filter(e => {
        const electionDate = new Date(e.start_time);
        const electionYear = electionDate.getFullYear();
        
        if (year === 'all-time') {
          return true; // Include all elections
        }
        
        if (month !== undefined && month !== null && month !== '') {
          // Specific month and year
          const electionMonth = electionDate.getMonth();
          return electionYear === parseInt(year) && electionMonth === parseInt(month);
        } else {
          // Just year
          return electionYear === parseInt(year);
        }
      });
    }
    
    // Aggregate tallies across filtered elections
    const aggregatedTallies = new Map<string, {
      employee_id: string;
      total_points: number;
      count_first: number;
      count_second: number;
      count_third: number;
    }>();
    
    // Get all messages across filtered elections
    const aggregatedMessages = new Map<string, {count: number, messages: string[]}>();
    
    // Fetch all ballots ONCE upfront (instead of per-election to avoid N+1 timeout)
    const allBallots = await kv.getByPrefix('ballot:');
    
    for (const election of filteredElections) {
      const tallies = await kv.getByPrefix(`tally:${election.id}:`);
      
      // Filter ballots for this election from the pre-fetched set
      const electionBallots = allBallots.filter(b => 
        b.election_id === election.id && !b.revoked
      );
      
      // Compile reasons for each employee
      electionBallots.forEach(ballot => {
        ballot.selections.forEach((sel: any) => {
          if (sel.reason && sel.reason.trim()) {
            if (!aggregatedMessages.has(sel.employee_id)) {
              aggregatedMessages.set(sel.employee_id, { count: 0, messages: [] });
            }
            const data = aggregatedMessages.get(sel.employee_id)!;
            data.count++;
            data.messages.push(sel.reason.trim());
          }
        });
      });
      
      tallies.forEach(tally => {
        if (!aggregatedTallies.has(tally.employee_id)) {
          aggregatedTallies.set(tally.employee_id, {
            employee_id: tally.employee_id,
            total_points: 0,
            count_first: 0,
            count_second: 0,
            count_third: 0
          });
        }
        
        const agg = aggregatedTallies.get(tally.employee_id)!;
        agg.total_points += tally.total_points;
        agg.count_first += tally.count_first;
        agg.count_second += tally.count_second;
        agg.count_third += tally.count_third;
      });
    }
    
    const leaderboard = Array.from(aggregatedTallies.values())
      .filter(t => t.total_points > 0)
      .map(t => ({
        ...t,
        employee: employeeMap.get(t.employee_id),
        vote_count: t.count_first + t.count_second + t.count_third,
        message_count: aggregatedMessages.get(t.employee_id)?.count || 0,
        messages: aggregatedMessages.get(t.employee_id)?.messages || []
      }))
      .sort((a, b) => {
        if (b.total_points !== a.total_points) return b.total_points - a.total_points;
        if (b.count_first !== a.count_first) return b.count_first - a.count_first;
        if (b.count_second !== a.count_second) return b.count_second - a.count_second;
        return b.count_third - a.count_third;
      });
    
    return c.json({ leaderboard, elections_count: filteredElections.length });
  } catch (error) {
    console.log('Get aggregated leaderboard error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// Admin routes
app.post('/make-server-e2c9f810/admin/elections', async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    if (!(await isUserAdmin(user.id))) {
      return c.json({ error: 'Admin access required' }, 403);
    }
    
    const { title, start_time, end_time, eligible_employees } = await c.req.json();
    
    const electionId = crypto.randomUUID();
    const election = {
      id: electionId,
      title,
      start_time,
      end_time,
      eligible_employees: eligible_employees || [], // Store eligible employee IDs
      created_at: new Date().toISOString(),
      created_by: user.id
    };
    
    await kv.set(`election:${electionId}`, election);
    
    return c.json({ election });
  } catch (error) {
    console.log('Create election error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// Delete election
app.delete('/make-server-e2c9f810/admin/elections/:id', async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    if (!(await isUserAdmin(user.id))) {
      return c.json({ error: 'Admin access required' }, 403);
    }
    
    const electionId = c.req.param('id');
    
    // Check if election exists
    const election = await kv.get(`election:${electionId}`);
    if (!election) {
      return c.json({ error: 'Election not found' }, 404);
    }
    
    console.log(`Deleting election: ${election.title} (${electionId})`);
    
    // Delete all associated data
    // 1. Delete all ballots for this election
    const allBallots = await kv.getByPrefix(`ballot:${electionId}:`);
    for (const ballot of allBallots) {
      await kv.del(`ballot:${electionId}:${ballot.voter_id}`);
    }
    console.log(`Deleted ${allBallots.length} ballots`);
    
    // 2. Delete all tallies for this election
    const allTallies = await kv.getByPrefix(`tally:${electionId}:`);
    for (const tally of allTallies) {
      await kv.del(`tally:${electionId}:${tally.employee_id}`);
    }
    console.log(`Deleted ${allTallies.length} tallies`);
    
    // 3. Delete all audit logs for this election
    const allAudits = await kv.getByPrefix(`audit:`);
    const electionAudits = allAudits.filter(audit => audit.election_id === electionId);
    for (const audit of electionAudits) {
      await kv.del(`audit:${audit.id}`);
    }
    console.log(`Deleted ${electionAudits.length} audit logs`);
    
    // 4. Delete the election itself
    await kv.del(`election:${electionId}`);
    
    // Log the deletion
    const auditId = crypto.randomUUID();
    await kv.set(`audit:${auditId}`, {
      id: auditId,
      action: 'delete_election',
      election_id: electionId,
      election_title: election.title,
      admin_id: user.id,
      timestamp: new Date().toISOString(),
      details: {
        ballots_deleted: allBallots.length,
        tallies_deleted: allTallies.length,
        audits_deleted: electionAudits.length
      }
    });
    
    console.log(`Election ${electionId} and all associated data deleted successfully`);
    
    return c.json({ 
      success: true,
      deleted: {
        election: 1,
        ballots: allBallots.length,
        tallies: allTallies.length,
        audits: electionAudits.length
      }
    });
  } catch (error) {
    console.log('Delete election error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// Batch vote counts for all elections (avoids N+1 queries)
app.get('/make-server-e2c9f810/admin/elections/vote-counts', async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    if (!(await isUserAdmin(user.id))) {
      return c.json({ error: 'Admin access required' }, 403);
    }
    
    const allBallots = await kv.getByPrefix('ballot:');
    const counts: Record<string, number> = {};
    
    for (const ballot of allBallots) {
      if (ballot.revoked) continue;
      const electionId = ballot.election_id;
      if (electionId) {
        counts[electionId] = (counts[electionId] || 0) + 1;
      }
    }
    
    return c.json({ counts });
  } catch (error) {
    console.log('Get vote counts error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// Update election status (close/reopen)
app.put('/make-server-e2c9f810/admin/elections/:id/status', async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    if (!(await isUserAdmin(user.id))) {
      return c.json({ error: 'Admin access required' }, 403);
    }
    
    const electionId = c.req.param('id');
    const { action, new_end_time } = await c.req.json();
    
    const election = await kv.get(`election:${electionId}`);
    if (!election) {
      return c.json({ error: 'Election not found' }, 404);
    }
    
    const now = new Date();
    const start = new Date(election.start_time);
    const end = new Date(election.end_time);
    
    if (action === 'close') {
      if (now > end) {
        return c.json({ error: 'Election is already closed' }, 400);
      }
      
      if (now < start) {
        election.start_time = now.toISOString();
      }
      election.end_time = now.toISOString();
      election.manually_closed = true;
      election.closed_at = now.toISOString();
      election.closed_by = user.id;
      
    } else if (action === 'reopen') {
      if (now < end) {
        return c.json({ error: 'Election is not closed yet' }, 400);
      }
      
      if (!new_end_time) {
        return c.json({ error: 'new_end_time is required to reopen an election' }, 400);
      }
      
      const newEnd = new Date(new_end_time);
      if (newEnd <= now) {
        return c.json({ error: 'New end time must be in the future' }, 400);
      }
      
      election.end_time = newEnd.toISOString();
      election.manually_closed = false;
      election.reopened_at = now.toISOString();
      election.reopened_by = user.id;
      
    } else {
      return c.json({ error: 'Invalid action. Use "close" or "reopen"' }, 400);
    }
    
    election.updated_at = now.toISOString();
    await kv.set(`election:${electionId}`, election);
    
    const auditId = crypto.randomUUID();
    const adminProfile = await kv.get(`user:${user.id}`);
    await kv.set(`audit:${auditId}`, {
      id: auditId,
      action: action === 'close' ? 'election_closed' : 'election_reopened',
      election_id: electionId,
      election_title: election.title,
      admin_id: user.id,
      admin_email: user.email,
      admin_name: adminProfile?.name || user.email,
      timestamp: now.toISOString(),
      details: {
        action,
        new_end_time: election.end_time,
        performed_by: adminProfile?.name || user.email
      }
    });
    
    console.log(`Election "${election.title}" ${action}d by ${user.email}`);
    
    return c.json({ election });
  } catch (error) {
    console.log('Update election status error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// Employee management
app.post('/make-server-e2c9f810/admin/employees', async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    if (!(await isUserAdmin(user.id))) {
      return c.json({ error: 'Admin access required' }, 403);
    }
    
    const { name, email, role, department, image_url } = await c.req.json();
    
    const id = crypto.randomUUID();
    const employee = {
      id,
      name,
      email,
      role,
      department,
      image_url,
      active: true,
      created_at: new Date().toISOString()
    };
    
    await kv.set(`employee:${id}`, employee);
    
    return c.json({ employee });
  } catch (error) {
    console.log('Create employee error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

app.put('/make-server-e2c9f810/admin/employees/:id', async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    if (!(await isUserAdmin(user.id))) {
      return c.json({ error: 'Admin access required' }, 403);
    }
    
    const employeeId = c.req.param('id');
    const updates = await c.req.json();
    
    const existing = await kv.get(`employee:${employeeId}`);
    if (!existing) {
      return c.json({ error: 'Employee not found' }, 404);
    }
    
    const updated = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    await kv.set(`employee:${employeeId}`, updated);
    
    return c.json({ employee: updated });
  } catch (error) {
    console.log('Update employee error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

app.delete('/make-server-e2c9f810/admin/employees/:id', async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    if (!(await isUserAdmin(user.id))) {
      return c.json({ error: 'Admin access required' }, 403);
    }
    
    const employeeId = c.req.param('id');
    
    const existing = await kv.get(`employee:${employeeId}`);
    if (!existing) {
      return c.json({ error: 'Employee not found' }, 404);
    }
    
    // Soft delete - mark as inactive
    const updated = {
      ...existing,
      active: false,
      deleted_at: new Date().toISOString()
    };
    
    await kv.set(`employee:${employeeId}`, updated);
    
    return c.json({ success: true });
  } catch (error) {
    console.log('Delete employee error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

app.post('/make-server-e2c9f810/admin/employees/import', async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    if (!(await isUserAdmin(user.id))) {
      return c.json({ error: 'Admin access required' }, 403);
    }
    
    const { employees } = await c.req.json();
    
    const created = [];
    for (const emp of employees) {
      const { email, password, name, role } = emp;
      
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password: password || crypto.randomUUID().slice(0, 12),
        user_metadata: { name, role },
        email_confirm: true
      });
      
      if (!error && data.user) {
        const employee = {
          id: data.user.id,
          email,
          name,
          role,
          active: true,
          created_at: new Date().toISOString()
        };
        
        await kv.set(`employee:${data.user.id}`, employee);
        created.push(employee);
      }
    }
    
    return c.json({ employees: created });
  } catch (error) {
    console.log('Import employees error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

app.get('/make-server-e2c9f810/admin/elections/:electionId/votes', async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    if (!(await isUserAdmin(user.id))) {
      return c.json({ error: 'Admin access required' }, 403);
    }
    
    const electionId = c.req.param('electionId');
    const ballots = await kv.getByPrefix(`ballot:${electionId}:`);
    const users = await kv.getByPrefix('user:');
    
    const votes = ballots.map(ballot => {
      // Find voter from users list (voters are users, not employees)
      const voter = users.find(u => u.id === ballot.voter_id);
      // Strip out reasons to maintain anonymity - admins should not see who wrote what
      const selectionsWithoutReasons = ballot.selections.map((sel: any) => ({
        rank: sel.rank,
        employee_id: sel.employee_id,
        points: sel.points
        // reason field intentionally omitted for anonymity
      }));
      return {
        ...ballot,
        selections: selectionsWithoutReasons,
        voter
      };
    });
    
    return c.json({ votes });
  } catch (error) {
    console.log('Get votes error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

app.post('/make-server-e2c9f810/admin/ballots/revoke', async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    if (!(await isUserAdmin(user.id))) {
      return c.json({ error: 'Admin access required' }, 403);
    }
    
    const { election_id, voter_id, reason } = await c.req.json();
    
    const ballot = await kv.get(`ballot:${election_id}:${voter_id}`);
    if (!ballot) {
      return c.json({ error: 'Ballot not found' }, 404);
    }
    
    // Update tallies - remove votes
    if (!ballot.revoked) {
      for (const selection of ballot.selections) {
        const tally = await kv.get(`tally:${election_id}:${selection.employee_id}`) || {
          employee_id: selection.employee_id,
          total_points: 0,
          count_first: 0,
          count_second: 0,
          count_third: 0
        };
        
        tally.total_points -= selection.points;
        if (selection.rank === 1) tally.count_first--;
        if (selection.rank === 2) tally.count_second--;
        if (selection.rank === 3) tally.count_third--;
        
        await kv.set(`tally:${election_id}:${selection.employee_id}`, tally);
      }
    }
    
    ballot.revoked = true;
    ballot.revoked_at = new Date().toISOString();
    ballot.revoked_by = user.id;
    ballot.revoke_reason = reason;
    
    await kv.set(`ballot:${election_id}:${voter_id}`, ballot);
    
    // Log audit
    const auditId = crypto.randomUUID();
    await kv.set(`audit:${auditId}`, {
      id: auditId,
      action: 'revoke_ballot',
      election_id,
      voter_id,
      admin_id: user.id,
      reason,
      timestamp: new Date().toISOString()
    });
    
    return c.json({ ballot });
  } catch (error) {
    console.log('Revoke ballot error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

app.get('/make-server-e2c9f810/admin/elections/:electionId/export', async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    if (!(await isUserAdmin(user.id))) {
      return c.json({ error: 'Admin access required' }, 403);
    }
    
    const electionId = c.req.param('electionId');
    const election = await kv.get(`election:${electionId}`);
    const ballots = await kv.getByPrefix(`ballot:${electionId}:`);
    const tallies = await kv.getByPrefix(`tally:${electionId}:`);
    const employees = await kv.getByPrefix('employee:');
    
    // Format for export
    const leaderboard = tallies.map(tally => {
      const employee = employees.find(e => e.id === tally.employee_id);
      return {
        employee_name: employee?.name,
        employee_email: employee?.email,
        employee_role: employee?.role,
        total_points: tally.total_points,
        first_place_votes: tally.count_first,
        second_place_votes: tally.count_second,
        third_place_votes: tally.count_third
      };
    });
    
    return c.json({ election, leaderboard, ballots });
  } catch (error) {
    console.log('Export results error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// Export all election data (comprehensive)
app.get('/make-server-e2c9f810/admin/export/all-data', async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    if (!(await isUserAdmin(user.id))) {
      return c.json({ error: 'Admin access required' }, 403);
    }
    
    // Fetch all data in parallel where possible
    const [allElections, allEmployees, allBallots, allUsers] = await Promise.all([
      kv.getByPrefix('election:'),
      kv.getByPrefix('employee:'),
      kv.getByPrefix('ballot:'),
      kv.getByPrefix('user:'),
    ]);
    
    // Sort elections by start_time descending
    const sortedElections = allElections.sort((a: any, b: any) =>
      new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
    );
    
    // Build employee lookup
    const employeeMap: Record<string, any> = {};
    for (const emp of allEmployees) {
      employeeMap[emp.id] = emp;
    }
    
    // Build user lookup
    const userMap: Record<string, any> = {};
    for (const u of allUsers) {
      userMap[u.id] = u;
    }
    
    // For each election, gather tallies + ballot metadata
    const electionDetails = [];
    for (const election of sortedElections) {
      const tallies = await kv.getByPrefix(`tally:${election.id}:`);
      
      const electionBallots = allBallots.filter((b: any) => b.election_id === election.id);
      const activeBallots = electionBallots.filter((b: any) => !b.revoked);
      const revokedBallots = electionBallots.filter((b: any) => b.revoked);
      
      const leaderboard = tallies
        .filter((t: any) => t.total_points > 0)
        .map((t: any) => {
          const emp = employeeMap[t.employee_id];
          return {
            employee_id: t.employee_id,
            employee_name: emp?.name || 'Unknown',
            employee_email: emp?.email || '',
            employee_role: emp?.role || '',
            employee_department: emp?.department || '',
            total_points: t.total_points,
            count_first: t.count_first,
            count_second: t.count_second,
            count_third: t.count_third,
            total_votes: t.count_first + t.count_second + t.count_third,
          };
        })
        .sort((a: any, b: any) => {
          if (b.total_points !== a.total_points) return b.total_points - a.total_points;
          if (b.count_first !== a.count_first) return b.count_first - a.count_first;
          if (b.count_second !== a.count_second) return b.count_second - a.count_second;
          return b.count_third - a.count_third;
        });
      
      const voters = activeBallots.map((b: any) => {
        const voter = userMap[b.voter_id];
        return {
          voter_name: voter?.name || 'Unknown',
          voter_email: voter?.email || '',
          voted_at: b.created_at,
        };
      });
      
      const now = new Date();
      const start = new Date(election.start_time);
      const end = new Date(election.end_time);
      let status = 'past';
      if (now >= start && now <= end) status = 'active';
      else if (now < start) status = 'upcoming';
      
      electionDetails.push({
        id: election.id,
        title: election.title,
        status,
        start_time: election.start_time,
        end_time: election.end_time,
        created_at: election.created_at,
        candidate_count: election.eligible_employees?.length || 0,
        total_ballots: activeBallots.length,
        revoked_ballots: revokedBallots.length,
        is_historical: election.is_historical || false,
        leaderboard,
        voters,
      });
    }
    
    const employeeSummary = allEmployees
      .filter((e: any) => e.active !== false)
      .map((e: any) => ({
        id: e.id,
        name: e.name,
        email: e.email,
        role: e.role || '',
        department: e.department || '',
        created_at: e.created_at,
      }));
    
    const userSummary = allUsers.map((u: any) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role || '',
      is_admin: u.is_admin || false,
      created_at: u.created_at,
    }));
    
    console.log(`Export all data: ${sortedElections.length} elections, ${allEmployees.length} employees, ${allBallots.length} ballots by admin ${user.email}`);
    
    return c.json({
      exported_at: new Date().toISOString(),
      elections: electionDetails,
      employees: employeeSummary,
      users: userSummary,
      summary: {
        total_elections: sortedElections.length,
        total_employees: employeeSummary.length,
        total_users: userSummary.length,
        total_ballots: allBallots.filter((b: any) => !b.revoked).length,
        total_revoked: allBallots.filter((b: any) => b.revoked).length,
      },
    });
  } catch (error) {
    console.log('Export all data error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

app.post('/make-server-e2c9f810/admin/import/historical', async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    if (!(await isUserAdmin(user.id))) {
      return c.json({ error: 'Admin access required' }, 403);
    }
    
    const { title, date, entries } = await c.req.json();
    
    if (!title || !date || !entries || entries.length === 0) {
      return c.json({ error: 'Invalid data: title, date, and entries are required' }, 400);
    }
    
    // Create historical election (already ended)
    const electionId = crypto.randomUUID();
    const electionDate = new Date(date);
    
    const election = {
      id: electionId,
      title,
      start_time: new Date(electionDate.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days before
      end_time: electionDate.toISOString(), // Ends on the provided date
      created_at: new Date().toISOString(),
      created_by: user.id,
      is_historical: true
    };
    
    await kv.set(`election:${electionId}`, election);
    
    // Process each entry
    const employees = await kv.getByPrefix('employee:');
    
    for (const entry of entries) {
      if (!entry.employee_name || !entry.total_points) continue;
      
      // Find or create employee
      let employee = employees.find(e => 
        e.name.toLowerCase() === entry.employee_name.toLowerCase() ||
        (entry.employee_email && e.email.toLowerCase() === entry.employee_email.toLowerCase())
      );
      
      if (!employee && entry.employee_email) {
        // Create new employee record if they don't exist
        const employeeId = crypto.randomUUID();
        employee = {
          id: employeeId,
          name: entry.employee_name,
          email: entry.employee_email,
          role: 'Employee',
          active: true,
          is_admin: false,
          created_at: new Date().toISOString()
        };
        await kv.set(`employee:${employeeId}`, employee);
        employees.push(employee);
      }
      
      if (!employee) {
        console.log(`Warning: Could not find or create employee: ${entry.employee_name}`);
        continue;
      }
      
      // Create tally entry
      const tally = {
        employee_id: employee.id,
        total_points: entry.total_points || 0,
        count_first: entry.count_first || 0,
        count_second: entry.count_second || 0,
        count_third: entry.count_third || 0
      };
      
      await kv.set(`tally:${electionId}:${employee.id}`, tally);
    }
    
    // Log audit
    const auditId = crypto.randomUUID();
    await kv.set(`audit:${auditId}`, {
      id: auditId,
      action: 'import_historical_data',
      election_id: electionId,
      admin_id: user.id,
      entries_count: entries.length,
      timestamp: new Date().toISOString()
    });
    
    return c.json({ 
      success: true, 
      election,
      entries_imported: entries.length 
    });
  } catch (error) {
    console.log('Import historical data error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// Initialize with seed data if needed
app.get('/make-server-e2c9f810/init', async (c) => {
  try {
    // Check if already initialized
    const existing = await kv.getByPrefix('employee:');
    if (existing.length > 0) {
      return c.json({ message: 'Already initialized', count: existing.length });
    }
    
    console.log('Starting initialization...');
    
    // Just return success - no demo data needed
    // Users will sign up normally through the sign-up flow
    // Admins can create elections through the admin panel
    
    console.log('Initialization complete - ready for production use');
    
    return c.json({ 
      message: 'System initialized and ready for use', 
      note: 'Users can now sign up and admins can create elections'
    });
  } catch (error) {
    console.error('Init error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// Create comprehensive demo data
app.post('/make-server-e2c9f810/demo/create', async (c) => {
  try {
    console.log('Creating demo data...');
    
    // Demo employees with auth
    const demoEmployees = [
      { email: 'admin@iqvote.demo', password: 'admin123', name: 'Alex Admin', role: 'CEO', is_admin: true },
      { email: 'employee@iqvote.demo', password: 'employee123', name: 'Emma Employee', role: 'Senior Developer', is_admin: false },
      { email: 'john@iqvote.demo', password: 'demo123', name: 'John Smith', role: 'Product Manager', is_admin: false },
      { email: 'sarah@iqvote.demo', password: 'demo123', name: 'Sarah Chen', role: 'UX Designer', is_admin: false },
      { email: 'michael@iqvote.demo', password: 'demo123', name: 'Michael Torres', role: 'Engineering Lead', is_admin: false },
      { email: 'emily@iqvote.demo', password: 'demo123', name: 'Emily Watson', role: 'Marketing Manager', is_admin: false },
      { email: 'david@iqvote.demo', password: 'demo123', name: 'David Kim', role: 'Sales Director', is_admin: false },
      { email: 'jessica@iqvote.demo', password: 'demo123', name: 'Jessica Brown', role: 'DevOps Engineer', is_admin: false },
    ];
    
    const createdEmployees = [];
    
    for (const emp of demoEmployees) {
      // Try to create the user
      const { data, error } = await supabase.auth.admin.createUser({
        email: emp.email,
        password: emp.password,
        user_metadata: { name: emp.name, role: emp.role },
        email_confirm: true
      });
      
      if (error) {
        // If user already exists, fetch them from Supabase
        if (error.message.includes('already') || error.code === 'email_exists') {
          console.log(`User ${emp.email} already exists, fetching existing user...`);
          
          // Fetch the existing user by email
          const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
          
          if (!listError && users) {
            const existingUser = users.find(u => u.email === emp.email);
            
            if (existingUser) {
              console.log(`Found existing user: ${emp.email}`);
              
              // Check if employee profile exists in KV
              const existingProfile = await kv.get(`employee:${existingUser.id}`);
              
              if (existingProfile) {
                console.log(`Employee profile already exists for ${emp.email}, using it`);
                createdEmployees.push(existingProfile);
              } else {
                // Create the employee profile
                const employee = {
                  id: existingUser.id,
                  email: emp.email,
                  name: emp.name,
                  role: emp.role,
                  is_admin: emp.is_admin,
                  active: true,
                  created_at: new Date().toISOString()
                };
                
                await kv.set(`employee:${existingUser.id}`, employee);
                createdEmployees.push(employee);
                console.log(`Created employee profile for existing user: ${emp.name}`);
              }
            }
          }
        }
        continue;
      }
      
      if (data.user) {
        const employee = {
          id: data.user.id,
          email: emp.email,
          name: emp.name,
          role: emp.role,
          is_admin: emp.is_admin,
          active: true,
          created_at: new Date().toISOString()
        };
        
        await kv.set(`employee:${data.user.id}`, employee);
        createdEmployees.push(employee);
        console.log(`Created new user: ${emp.name} (${emp.email})`);
      }
    }
    
    if (createdEmployees.length === 0) {
      return c.json({ 
        error: 'No employees were created or found. Please check the logs.' 
      }, 400);
    }
    
    console.log(`Successfully prepared ${createdEmployees.length} employees`);
    
    // Create current active election (November 2024)
    const currentElectionId = crypto.randomUUID();
    const currentElection = {
      id: currentElectionId,
      title: 'Employee of the Month - November 2024',
      start_time: new Date('2024-11-01T00:00:00Z').toISOString(),
      end_time: new Date('2024-11-30T23:59:59Z').toISOString(),
      created_at: new Date().toISOString(),
      created_by: createdEmployees[0].id,
      // Only non-admins can receive votes
      eligible_employees: createdEmployees.filter(e => !e.is_admin).map(e => e.id)
    };
    
    await kv.set(`election:${currentElectionId}`, currentElection);
    
    // Sample voting reasons
    const voteReasons = [
      "Outstanding leadership on the Q4 project. Always goes above and beyond!",
      "Incredible problem solver and team player. Helped me debug a critical issue.",
      "Mentored junior developers and created amazing documentation.",
      "Great communication skills and always willing to help others.",
      "Innovative thinking led to 30% performance improvement in our app.",
      "Excellent customer service and positive attitude every day.",
      "Delivered the mobile redesign ahead of schedule with zero bugs!",
      "Best onboarding buddy ever! Made me feel welcome from day one.",
      "Creative solutions to complex problems. A true asset to the team.",
      "Consistently exceeds expectations and lifts team morale.",
    ];
    
    // Create ballots from 5 employees voting
    const voters = createdEmployees.slice(0, 5); // First 5 employees vote
    const votableEmployees = createdEmployees.filter(e => !e.is_admin);
    
    for (let i = 0; i < voters.length; i++) {
      const voter = voters[i];
      
      // Each voter picks 3 different employees
      const shuffled = [...votableEmployees].sort(() => Math.random() - 0.5);
      const picks = shuffled.slice(0, 3);
      
      const selections = [
        { 
          rank: 1, 
          employee_id: picks[0].id, 
          points: 5,
          reason: voteReasons[Math.floor(Math.random() * voteReasons.length)]
        },
        { 
          rank: 2, 
          employee_id: picks[1].id, 
          points: 3,
          reason: voteReasons[Math.floor(Math.random() * voteReasons.length)]
        },
        { 
          rank: 3, 
          employee_id: picks[2].id, 
          points: 2,
          reason: voteReasons[Math.floor(Math.random() * voteReasons.length)]
        },
      ];
      
      const ballot = {
        voter_id: voter.id,
        election_id: currentElectionId,
        selections,
        created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        revoked: false
      };
      
      await kv.set(`ballot:${currentElectionId}:${voter.id}`, ballot);
      
      // Update tallies
      for (const sel of selections) {
        const tally = await kv.get(`tally:${currentElectionId}:${sel.employee_id}`) || {
          employee_id: sel.employee_id,
          total_points: 0,
          count_first: 0,
          count_second: 0,
          count_third: 0
        };
        
        tally.total_points += sel.points;
        if (sel.rank === 1) tally.count_first++;
        if (sel.rank === 2) tally.count_second++;
        if (sel.rank === 3) tally.count_third++;
        
        await kv.set(`tally:${currentElectionId}:${sel.employee_id}`, tally);
      }
    }
    
    // Create 2 historical elections (October & September 2024)
    const historicalElections = [
      { title: 'Employee of the Month - October 2024', month: 9, year: 2024 }, // October = month 9 (0-indexed)
      { title: 'Employee of the Month - September 2024', month: 8, year: 2024 }
    ];
    
    for (const hist of historicalElections) {
      const electionId = crypto.randomUUID();
      const election = {
        id: electionId,
        title: hist.title,
        start_time: new Date(hist.year, hist.month, 1).toISOString(),
        end_time: new Date(hist.year, hist.month + 1, 0, 23, 59, 59).toISOString(),
        created_at: new Date(hist.year, hist.month, 1).toISOString(),
        created_by: createdEmployees[0].id,
        is_historical: true,
        eligible_employees: votableEmployees.map(e => e.id)
      };
      
      await kv.set(`election:${electionId}`, election);
      
      // Create tallies for historical elections
      const shuffledForHistory = [...votableEmployees].sort(() => Math.random() - 0.5);
      for (let i = 0; i < Math.min(5, shuffledForHistory.length); i++) {
        const emp = shuffledForHistory[i];
        const tally = {
          employee_id: emp.id,
          total_points: Math.max(5, 25 - i * 5),
          count_first: Math.floor(Math.random() * 3) + (i === 0 ? 2 : 0),
          count_second: Math.floor(Math.random() * 3),
          count_third: Math.floor(Math.random() * 3)
        };
        
        await kv.set(`tally:${electionId}:${emp.id}`, tally);
      }
    }
    
    console.log('Demo data created successfully!');
    console.log(`
    ✅ DEMO ACCOUNTS CREATED:
    
    👑 Admin Account:
       Email: admin@iqvote.demo
       Password: admin123
       
    👤 Employee Account:
       Email: employee@iqvote.demo
       Password: employee123
       
    📊 Created:
       - ${createdEmployees.length} employees
       - 3 elections (1 active, 2 historical)
       - ${voters.length} ballots with voting reasons
       - Compiled tallies and leaderboard data
    `);
    
    return c.json({ 
      success: true,
      demo_accounts: {
        admin: { email: 'admin@iqvote.demo', password: 'admin123' },
        employee: { email: 'employee@iqvote.demo', password: 'employee123' }
      },
      stats: {
        employees: createdEmployees.length,
        elections: 3,
        ballots: voters.length
      }
    });
  } catch (error) {
    console.error('Demo creation error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// Reset all data - USE WITH CAUTION
app.post('/make-server-e2c9f810/reset', async (c) => {
  try {
    console.log('Starting comprehensive reset...');
    
    // Delete ALL users from Supabase Auth
    console.log('Deleting all Supabase Auth users...');
    let authUsersDeleted = 0;
    let authErrors = [];
    
    try {
      const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
      
      if (listError) {
        console.error('Error listing users:', listError);
        authErrors.push(`List users error: ${listError.message}`);
      } else if (users && users.length > 0) {
        console.log(`Found ${users.length} users to delete`);
        
        for (const user of users) {
          try {
            const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
            
            if (deleteError) {
              console.error(`Failed to delete user ${user.email}:`, deleteError);
              authErrors.push(`Delete ${user.email}: ${deleteError.message}`);
            } else {
              authUsersDeleted++;
              console.log(`✓ Deleted user: ${user.email}`);
            }
          } catch (deleteErr) {
            console.error(`Exception deleting user ${user.email}:`, deleteErr);
            authErrors.push(`Exception deleting ${user.email}: ${String(deleteErr)}`);
          }
        }
      } else {
        console.log('No users found in Supabase Auth');
      }
    } catch (authErr) {
      console.error('Auth cleanup exception:', authErr);
      authErrors.push(`Auth cleanup exception: ${String(authErr)}`);
    }
    
    console.log(`Auth users deleted: ${authUsersDeleted}`);
    if (authErrors.length > 0) {
      console.error('Auth errors encountered:', authErrors);
    }
    
    // Clear entire KV store by directly querying the database
    console.log('Clearing all KV store data...');
    const prefixes = [
      'user:',      // VOTERS - people who can vote
      'employee:',  // CANDIDATES - people who can be voted FOR
      'election:',
      'ballot:',
      'tally:',
      'eligibility:',
      'leaderboard:',
      'vote_reasons:',
      'audit:'
    ];
    
    let totalDeleted = 0;
    const kvErrors = [];
    
    for (const prefix of prefixes) {
      try {
        // Use direct database query to get keys
        const { data: items, error } = await supabase
          .from('kv_store_e2c9f810')
          .select('key')
          .like('key', `${prefix}%`);
        
        if (error) {
          console.error(`Error fetching keys with prefix ${prefix}:`, error);
          kvErrors.push(`Fetch ${prefix}: ${error.message}`);
          continue;
        }
        
        if (items && items.length > 0) {
          console.log(`Found ${items.length} items with prefix ${prefix}`);
          
          // Delete all at once
          const keys = items.map(item => item.key);
          await kv.mdel(keys);
          
          totalDeleted += items.length;
          console.log(`✓ Deleted ${items.length} items with prefix ${prefix}`);
        } else {
          console.log(`No items found with prefix ${prefix}`);
        }
      } catch (err) {
        console.error(`Error deleting items with prefix ${prefix}:`, err);
        kvErrors.push(`Delete ${prefix}: ${String(err)}`);
      }
    }
    
    console.log(`Total KV items deleted: ${totalDeleted}`);
    if (kvErrors.length > 0) {
      console.error('KV errors encountered:', kvErrors);
    }
    
    // Delete all images from storage
    console.log('Cleaning up storage buckets...');
    let storageFilesDeleted = 0;
    const storageErrors = [];
    
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      if (buckets) {
        for (const bucket of buckets) {
          if (bucket.name.startsWith('make-e2c9f810')) {
            try {
              const { data: files } = await supabase.storage.from(bucket.name).list();
              if (files && files.length > 0) {
                const filePaths = files.map(f => f.name);
                const { error: removeError } = await supabase.storage.from(bucket.name).remove(filePaths);
                
                if (removeError) {
                  console.error(`Error removing files from ${bucket.name}:`, removeError);
                  storageErrors.push(`${bucket.name}: ${removeError.message}`);
                } else {
                  storageFilesDeleted += files.length;
                  console.log(`✓ Deleted ${files.length} files from bucket ${bucket.name}`);
                }
              } else {
                console.log(`No files in bucket ${bucket.name}`);
              }
            } catch (bucketErr) {
              console.error(`Error processing bucket ${bucket.name}:`, bucketErr);
              storageErrors.push(`${bucket.name}: ${String(bucketErr)}`);
            }
          }
        }
      }
    } catch (storageErr) {
      console.error('Storage cleanup error:', storageErr);
      storageErrors.push(`Storage cleanup: ${String(storageErr)}`);
    }
    
    console.log('==================================');
    console.log('✅ RESET COMPLETE');
    console.log('Data deleted:');
    console.log(`- ${authUsersDeleted} user accounts`);
    console.log(`- ${totalDeleted} database entries`);
    console.log(`- ${storageFilesDeleted} storage files`);
    
    if (authErrors.length > 0 || kvErrors.length > 0 || storageErrors.length > 0) {
      console.log('\n⚠️  Some errors occurred:');
      if (authErrors.length > 0) console.log('Auth errors:', authErrors);
      if (kvErrors.length > 0) console.log('KV errors:', kvErrors);
      if (storageErrors.length > 0) console.log('Storage errors:', storageErrors);
    }
    
    console.log('==================================');
    console.log('System is now ready for fresh setup.');
    console.log('Next: Sign up with a new account to become admin!');
    
    return c.json({ 
      success: true,
      message: 'Reset completed',
      details: {
        users_deleted: authUsersDeleted,
        database_entries_deleted: totalDeleted,
        storage_files_deleted: storageFilesDeleted
      },
      errors: {
        auth_errors: authErrors,
        kv_errors: kvErrors,
        storage_errors: storageErrors
      },
      has_errors: authErrors.length > 0 || kvErrors.length > 0 || storageErrors.length > 0
    });
  } catch (error) {
    console.error('Reset error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// Get user's voting history
app.get('/make-server-e2c9f810/my-votes', async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get all elections
    const allElections = await kv.getByPrefix('election:');
    
    // Get user's ballots by user ID
    const allBallots = await kv.getByPrefix(`ballot:`);
    const userBallots = allBallots.filter(b => b.voter_id === user.id);
    
    // Get all employees for mapping
    const allEmployees = await kv.getByPrefix('employee:');
    const employeeMap = new Map(allEmployees.map(emp => [emp.id, emp]));

    const votes = userBallots.map(ballot => {
      const election = allElections.find(e => e.id === ballot.election_id);
      if (!election) return null;

      const selections = ballot.selections.map((sel: any) => ({
        rank: sel.rank,
        employee: employeeMap.get(sel.employee_id) || { id: sel.employee_id, name: 'Unknown', role: '' },
        points: sel.points
      }));

      return {
        election,
        ballot,
        selections
      };
    }).filter(v => v !== null);

    // Sort by date, newest first
    votes.sort((a: any, b: any) => new Date(b.ballot.created_at).getTime() - new Date(a.ballot.created_at).getTime());

    return c.json({ votes });
  } catch (error) {
    console.log('Get my votes error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// Get votes received by user (anonymous - no voter info)
app.get('/make-server-e2c9f810/my-received-votes', async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if user is an employee (candidate) - only employees can receive votes
    const profile = await kv.get(`employee:${user.id}`);
    if (!profile) {
      // User is not an employee/candidate, so they cannot receive votes
      return c.json({ votes: [] });
    }

    // Get all elections
    const allElections = await kv.getByPrefix('election:');
    
    const votes = [];

    for (const election of allElections) {
      // Get tallies for this election
      const tallies = await kv.getByPrefix(`tally:${election.id}:`);
      const myTally = tallies.find(t => t.employee_id === user.id);

      if (myTally && myTally.total_points > 0) {
        // Calculate rank
        const sortedTallies = tallies
          .filter(t => t.total_points > 0)
          .sort((a, b) => {
            if (b.total_points !== a.total_points) return b.total_points - a.total_points;
            if (b.count_first !== a.count_first) return b.count_first - a.count_first;
            if (b.count_second !== a.count_second) return b.count_second - a.count_second;
            return b.count_third - a.count_third;
          });

        const rank = sortedTallies.findIndex(t => t.employee_id === user.id) + 1;

        // Count total participants (unique voters)
        const allBallots = await kv.getByPrefix(`ballot:`);
        const electionBallots = allBallots.filter(b => 
          b.election_id === election.id && !b.revoked
        );

        votes.push({
          election,
          total_points: myTally.total_points,
          rank,
          total_participants: electionBallots.length
        });
      }
    }

    // Sort by election end date, newest first
    votes.sort((a, b) => new Date(b.election.end_time).getTime() - new Date(a.election.end_time).getTime());

    return c.json({ votes });
  } catch (error) {
    console.log('Get my received votes error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// Admin user management endpoint - Update user admin status by email
app.post('/make-server-e2c9f810/admin/users/grant-admin', async (c) => {
  try {
    const { email } = await c.req.json();
    
    if (!email) {
      return c.json({ error: 'Email is required' }, 400);
    }
    
    // Find user by email in auth
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.log('Error listing users:', listError);
      return c.json({ error: 'Failed to find user' }, 500);
    }
    
    const authUser = users.find(u => u.email === email);
    
    if (!authUser) {
      return c.json({ error: 'User not found with that email' }, 404);
    }
    
    // Get user profile
    const userProfile = await kv.get(`user:${authUser.id}`);
    
    if (!userProfile) {
      return c.json({ error: 'User profile not found' }, 404);
    }
    
    // Update admin status
    const updated = {
      ...userProfile,
      is_admin: true,
      updated_at: new Date().toISOString()
    };
    
    await kv.set(`user:${authUser.id}`, updated);
    
    console.log(`Admin access granted to user: ${email}`);
    
    return c.json({ 
      success: true, 
      user: {
        id: authUser.id,
        email: authUser.email,
        name: updated.name,
        is_admin: true
      }
    });
  } catch (error) {
    console.log('Grant admin error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// System Activity Monitor - ALL ADMINS
app.get('/make-server-e2c9f810/admin/system-activity', async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    // Check if user is an admin
    if (!(await isUserAdmin(user.id))) {
      return c.json({ error: 'Forbidden: Admin access required' }, 403);
    }
    
    // Collect all activities from various sources
    const activities: any[] = [];
    
    // Get all users (for auth events)
    const allUsers = await kv.getByPrefix('user:');
    allUsers.forEach(userProfile => {
      activities.push({
        id: `auth-signup-${userProfile.id}`,
        timestamp: userProfile.created_at,
        action: 'user_signup',
        user_email: userProfile.email,
        user_name: userProfile.name,
        type: 'auth',
        details: { role: userProfile.role }
      });
      
      if (userProfile.is_admin) {
        activities.push({
          id: `auth-admin-${userProfile.id}`,
          timestamp: userProfile.updated_at || userProfile.created_at,
          action: 'admin_granted',
          user_email: userProfile.email,
          user_name: userProfile.name,
          type: 'admin',
          details: {}
        });
      }
    });
    
    // Get all elections
    const allElections = await kv.getByPrefix('election:');
    allElections.forEach(election => {
      const creator = allUsers.find(u => u.id === election.created_by);
      activities.push({
        id: `election-${election.id}`,
        timestamp: election.created_at,
        action: 'election_created',
        user_email: creator?.email,
        user_name: creator?.name,
        type: 'election',
        details: { 
          title: election.title,
          start_time: election.start_time,
          end_time: election.end_time
        }
      });
    });
    
    // Get all ballots (votes)
    const allBallots = await kv.getByPrefix('ballot:');
    allBallots.forEach(ballot => {
      const voter = allUsers.find(u => u.id === ballot.voter_id);
      const election = allElections.find(e => e.id === ballot.election_id);
      
      activities.push({
        id: `vote-${ballot.election_id}-${ballot.voter_id}`,
        timestamp: ballot.created_at,
        action: ballot.revoked ? 'vote_revoked' : 'vote_cast',
        user_email: voter?.email,
        user_name: voter?.name,
        type: 'vote',
        details: { 
          election_title: election?.title,
          revoked: ballot.revoked,
          revoke_reason: ballot.revoke_reason
        }
      });
    });
    
    // Get all employees
    const allEmployees = await kv.getByPrefix('employee:');
    allEmployees.forEach(employee => {
      activities.push({
        id: `employee-${employee.id}`,
        timestamp: employee.created_at,
        action: 'employee_created',
        user_email: 'system',
        user_name: 'System',
        type: 'employee',
        details: { 
          employee_name: employee.name,
          employee_role: employee.role
        }
      });
      
      if (employee.deleted_at) {
        activities.push({
          id: `employee-deleted-${employee.id}`,
          timestamp: employee.deleted_at,
          action: 'employee_deleted',
          user_email: 'admin',
          user_name: 'Admin',
          type: 'employee',
          details: { employee_name: employee.name }
        });
      }
    });
    
    // Get audit logs if any
    const auditLogs = await kv.getByPrefix('audit:');
    auditLogs.forEach(audit => {
      const admin = allUsers.find(u => u.id === audit.admin_id);
      activities.push({
        id: audit.id,
        timestamp: audit.timestamp,
        action: audit.action,
        user_email: admin?.email,
        user_name: admin?.name,
        type: 'admin',
        details: audit
      });
    });
    
    // Sort by timestamp, newest first
    activities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    // Limit to last 500 activities
    const recentActivities = activities.slice(0, 500);
    
    return c.json({ activities: recentActivities });
  } catch (error) {
    console.log('Get system activity error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// RESET DATABASE ROUTE - WARNING: This will delete ALL data!
app.post('/make-server-e2c9f810/admin/reset-database', async (c) => {
  try {
    const existingUsers = await kv.getByPrefix('user:');
    
    if (existingUsers.length > 0) {
      const user = await getAuthenticatedUser(c.req.raw);
      if (!user) {
        return c.json({ error: 'Unauthorized: Authentication required when users exist' }, 401);
      }
      
      if (!(await isSuperAdmin(user.id))) {
        return c.json({ error: 'Forbidden: Only the system owner can reset the database when users exist' }, 403);
      }
    }
    
    console.log('=== STARTING DATABASE RESET ===');
    
    // Get all data to count items
    const users = await kv.getByPrefix('user:');
    const employees = await kv.getByPrefix('employee:');
    const elections = await kv.getByPrefix('election:');
    const ballots = await kv.getByPrefix('ballot:');
    const tallies = await kv.getByPrefix('tally:');
    const audits = await kv.getByPrefix('audit:');
    
    console.log(`Found: ${users.length} users, ${employees.length} employees, ${elections.length} elections, ${ballots.length} ballots, ${tallies.length} tallies, ${audits.length} audits`);
    
    // Use Supabase client to delete all records directly (more efficient)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    // Delete all keys by prefix using SQL-like patterns
    await supabaseClient.from('kv_store_e2c9f810').delete().like('key', 'user:%');
    await supabaseClient.from('kv_store_e2c9f810').delete().like('key', 'employee:%');
    await supabaseClient.from('kv_store_e2c9f810').delete().like('key', 'election:%');
    await supabaseClient.from('kv_store_e2c9f810').delete().like('key', 'ballot:%');
    await supabaseClient.from('kv_store_e2c9f810').delete().like('key', 'tally:%');
    await supabaseClient.from('kv_store_e2c9f810').delete().like('key', 'audit:%');
    
    console.log('KV store cleared');
    
    // Delete all users from Supabase Auth
    let deletedAuthUsers = 0;
    for (const user of users) {
      try {
        const { error } = await supabase.auth.admin.deleteUser(user.id);
        if (!error) {
          deletedAuthUsers++;
        } else {
          console.log(`Warning: Could not delete auth user ${user.email}:`, error.message);
        }
      } catch (error) {
        console.log(`Warning: Error deleting auth user ${user.email}:`, error);
      }
    }
    
    console.log(`Deleted ${deletedAuthUsers} users from Supabase Auth`);
    console.log('=== DATABASE RESET COMPLETE ===');
    console.log('You can now sign up as the first user to automatically receive admin privileges');
    
    return c.json({
      success: true,
      message: 'Database reset complete',
      deleted: {
        users: users.length,
        employees: employees.length,
        elections: elections.length,
        ballots: ballots.length,
        tallies: tallies.length,
        audits: audits.length,
        auth_users: deletedAuthUsers
      }
    });
  } catch (error) {
    console.log('Reset database error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// Debug endpoint to check auth users
app.get('/make-server-e2c9f810/debug/auth-users', async (c) => {
  try {
    const user = await getAuthenticatedUser(c.req.raw);
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Only allow admins to access this
    const isAdmin = await isUserAdmin(user.id);
    if (!isAdmin) {
      return c.json({ error: 'Forbidden - Admin access required' }, 403);
    }

    // List all auth users
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.error('Error listing auth users:', error);
      return c.json({ error: error.message }, 500);
    }

    // Also get KV user profiles
    const kvUsers = await kv.getByPrefix('user:');
    
    return c.json({ 
      auth_users: users?.map(u => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        email_confirmed: u.email_confirmed_at !== null,
        last_sign_in: u.last_sign_in_at
      })) || [],
      kv_users: kvUsers.map(u => ({
        id: u.id,
        email: u.email,
        name: u.name,
        is_admin: u.is_admin
      }))
    });
  } catch (error) {
    console.error('Debug auth users error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

Deno.serve(app.fetch);
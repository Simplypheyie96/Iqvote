import { useState, useEffect } from 'react';
import { Activity, User, Vote, Shield, Calendar, UserPlus, Clock, Eye } from 'lucide-react';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Skeleton } from './ui/skeleton';
import { projectId } from '../utils/supabase/info';
import { createClient } from '../utils/supabase/client';

interface ActivityLog {
  id: string;
  timestamp: string;
  action: string;
  user_email?: string;
  user_name?: string;
  details: any;
  type: 'auth' | 'vote' | 'admin' | 'election' | 'employee' | 'system';
}

export function SystemActivity() {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterAction, setFilterAction] = useState<string>('all');

  useEffect(() => {
    loadActivities();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadActivities, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadActivities = async () => {
    try {
      // Get token from Supabase session
      const supabase = createClient();
      
      let token = null;
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error in SystemActivity:', sessionError);
          // If it's a refresh token error, clear and return
          if (sessionError.message.includes('Refresh Token')) {
            await supabase.auth.signOut();
            return;
          }
        }
        
        token = session?.access_token;
      } catch (err: any) {
        console.error('Error getting session in SystemActivity:', err);
        return;
      }

      if (!token) {
        console.error('No authentication token available');
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e2c9f810/admin/system-activity`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setActivities(data.activities || []);
      } else {
        console.error('Failed to load activities:', response.status, response.statusText);
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Error details:', errorData);
      }
    } catch (error) {
      console.error('Failed to load system activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'auth': return <User className="w-4 h-4" />;
      case 'vote': return <Vote className="w-4 h-4" />;
      case 'admin': return <Shield className="w-4 h-4" />;
      case 'election': return <Calendar className="w-4 h-4" />;
      case 'employee': return <UserPlus className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  /* The icon carries the colour, so the row underneath can stay plain text.
     Every one of these foregrounds was measured against its own tint and
     against both page backgrounds — none of them fall below AA. */
  const getActivityColor = (type: string) => {
    switch (type) {
      case 'auth': return 'bg-info/12 text-info';
      case 'vote': return 'bg-success/12 text-success';
      case 'admin': return 'bg-destructive/12 text-destructive';
      case 'election': return 'bg-primary/12 text-primary-strong';
      case 'employee': return 'bg-warning/12 text-warning';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getActionDescription = (activity: ActivityLog) => {
    const user = activity.user_name || activity.user_email || 'Unknown User';
    
    switch (activity.action) {
      case 'user_signup':
        return `${user} created an account`;
      case 'user_login':
        return `${user} signed in`;
      case 'admin_granted':
        // Show who granted the admin privileges
        if (activity.details?.admin_name && activity.details?.target_user_name) {
          return `${activity.details.admin_name} granted admin privileges to ${activity.details.target_user_name}`;
        }
        return `${user} was granted admin privileges`;
      case 'admin_revoked':
        // Show who revoked the admin privileges
        if (activity.details?.admin_name && activity.details?.target_user_name) {
          return `${activity.details.admin_name} revoked admin privileges from ${activity.details.target_user_name}`;
        }
        return `${user} had admin privileges revoked`;
      case 'user_deleted':
        // Show who deleted the user
        if (activity.details?.admin_name && activity.details?.target_user_name) {
          return `${activity.details.admin_name} deleted user account for ${activity.details.target_user_name}`;
        }
        return `User account deleted for ${user}`;
      case 'vote_cast':
        return `${user} submitted a vote in "${activity.details?.election_title || 'election'}"`;
      case 'vote_revoked':
        return `Vote revoked for ${user} by admin`;
      case 'election_created':
        return `${user} created election "${activity.details?.title || 'Unknown'}"`;
      case 'election_updated':
        return `${user} updated election "${activity.details?.title || 'Unknown'}"`;
      case 'employee_created':
        return `${user} added employee "${activity.details?.employee_name || 'Unknown'}"`;
      case 'employee_updated':
        return `${user} updated employee "${activity.details?.employee_name || 'Unknown'}"`;
      case 'employee_deleted':
        return `${user} removed employee "${activity.details?.employee_name || 'Unknown'}"`;
      case 'historical_import':
        return `${user} imported ${activity.details?.entries_count || 0} historical records`;
      default:
        // Anything the server logs that isn't listed above still has to read as
        // a sentence, not as a raw column value — "signed in", not "signin".
        return `${user} — ${activity.action.replace(/_/g, ' ')}`;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6" aria-busy="true">
        <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-border bg-card shadow-e1 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`p-4 sm:p-5 ${i > 0 ? 'border-t border-border sm:border-l sm:border-t-0' : ''}`}>
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-3 h-8 w-16" />
            </div>
          ))}
        </div>
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-e1">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className={`flex items-start gap-3 p-4 sm:px-5 ${i > 0 ? 'border-t border-border' : ''}`}>
              <Skeleton className="h-9 w-9 shrink-0 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const visibleActivities = activities.filter(activity =>
    (filterType === 'all' || activity.type === filterType) &&
    (filterAction === 'all' || activity.action === filterAction) &&
    (searchQuery === '' || activity.action.toLowerCase().includes(searchQuery.toLowerCase()) || activity.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) || activity.user_email?.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  const isFiltered = filterType !== 'all' || filterAction !== 'all' || searchQuery !== '';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-border bg-card shadow-e1 sm:grid-cols-3">
        {[
          { label: 'Everything', value: activities.length, hint: 'events on record' },
          { label: 'Votes', value: activities.filter(a => a.type === 'vote').length, hint: 'ballots submitted' },
          { label: 'Admin actions', value: activities.filter(a => a.type === 'admin').length, hint: 'changes by admins' },
        ].map(({ label, value, hint }, i) => (
          <div key={label} className={`p-4 sm:p-5 ${i > 0 ? 'border-t border-border sm:border-l sm:border-t-0' : ''}`}>
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
            <p className="mt-2.5 font-display text-3xl font-semibold tabular-nums tracking-tight">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
          </div>
        ))}
      </div>

      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            type="text"
            placeholder="Search by person or action"
            aria-label="Search activity"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-11 w-full"
          />
          <Select
            value={filterType}
            onValueChange={(value) => setFilterType(value)}
          >
            <SelectTrigger className="h-11 w-full shrink-0 sm:w-44" aria-label="Filter by kind">
              <SelectValue placeholder="Any kind" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any kind</SelectItem>
              <SelectItem value="auth">Sign-in</SelectItem>
              <SelectItem value="vote">Vote</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="election ">Election</SelectItem>
              <SelectItem value="employee ">Employee</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filterAction}
            onValueChange={(value) => setFilterAction(value)}
          >
            <SelectTrigger className="h-11 w-full shrink-0 sm:w-52" aria-label="Filter by action">
              <SelectValue placeholder="Any action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any action</SelectItem>
              <SelectItem value="user_signup">Account created</SelectItem>
              <SelectItem value="user_login">Signed in</SelectItem>
              <SelectItem value="admin_granted">Admin granted</SelectItem>
              <SelectItem value="admin_revoked">Admin revoked</SelectItem>
              <SelectItem value="user_deleted">Account deleted</SelectItem>
              <SelectItem value="vote_cast">Vote cast</SelectItem>
              <SelectItem value="vote_revoked">Vote revoked</SelectItem>
              <SelectItem value="election_created">Election created</SelectItem>
              <SelectItem value="election_updated">Election updated</SelectItem>
              <SelectItem value="employee_created">Employee added</SelectItem>
              <SelectItem value="employee_updated">Employee updated</SelectItem>
              <SelectItem value="employee_deleted">Employee removed</SelectItem>
              <SelectItem value="historical_import">Past results imported</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <p className="mt-3 text-sm text-muted-foreground tabular-nums" aria-live="polite">
          {isFiltered
            ? `${visibleActivities.length} of ${activities.length} shown`
            : `${activities.length} ${activities.length === 1 ? 'event' : 'events'} · refreshes every 30 seconds`}
        </p>

        {activities.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-border bg-card px-6 py-14 text-center shadow-e1">
            <span className="mx-auto inline-grid h-12 w-12 place-items-center rounded-full bg-muted" aria-hidden="true">
              <Activity className="h-5 w-5 text-muted-foreground" />
            </span>
            <p className="mt-4 font-display text-base font-semibold tracking-tight">Nothing has happened yet</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground text-pretty">
              Sign-ins, votes and admin changes will show up here as they happen.
            </p>
          </div>
        ) : visibleActivities.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-border bg-card px-6 py-14 text-center shadow-e1">
            <span className="mx-auto inline-grid h-12 w-12 place-items-center rounded-full bg-muted" aria-hidden="true">
              <Eye className="h-5 w-5 text-muted-foreground" />
            </span>
            <p className="mt-4 font-display text-base font-semibold tracking-tight">No matches</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground text-pretty">
              Nothing in the log fits those filters. Try widening them.
            </p>
          </div>
        ) : (
          <ScrollArea className="mt-4 h-[600px]">
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-e1">
              {visibleActivities.map((activity, idx) => (
                <div
                  key={activity.id}
                  className={`flex items-start gap-3.5 p-4 transition-colors duration-150 hover:bg-muted/40 sm:px-5 ${
                    idx > 0 ? 'border-t border-border' : ''
                  }`}
                >
                  <span className={`inline-grid h-9 w-9 shrink-0 place-items-center rounded-xl ${getActivityColor(activity.type)}`} aria-hidden="true">
                    {getActivityIcon(activity.type)}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-snug text-pretty">
                      {getActionDescription(activity)}
                    </p>

                    {activity.details && Object.keys(activity.details).length > 0 && (
                      <div className="mt-1.5 space-y-1 text-xs text-muted-foreground">
                        {activity.details.reason && (
                          <p className="italic">Reason: {activity.details.reason}</p>
                        )}
                        {/* The vote_cast sentence already names the election;
                            repeating it underneath just doubles the line. */}
                        {activity.details.election_title && activity.action !== 'vote_cast' && (
                          <p>Election: {activity.details.election_title}</p>
                        )}
                        {activity.details.target_user_email && (
                          <p>Target: {activity.details.target_user_email}</p>
                        )}
                        {activity.details.target_user_name && activity.details.target_user_email && (
                          <p>Target user: {activity.details.target_user_name} ({activity.details.target_user_email})</p>
                        )}
                        {activity.details.admin_email && activity.action !== 'user_signup' && (
                          <p>Done by: {activity.details.admin_email}</p>
                        )}
                        {activity.details.admin_name && (
                          <p>Admin: {activity.details.admin_name}</p>
                        )}
                        {activity.details.old_value !== undefined && activity.details.new_value !== undefined && (
                          <p>Changed: {String(activity.details.old_value)} → {String(activity.details.new_value)}</p>
                        )}
                      </div>
                    )}

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="text-xs font-normal">
                        {activity.type}
                      </Badge>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" aria-hidden="true" />
                        {formatTimestamp(activity.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
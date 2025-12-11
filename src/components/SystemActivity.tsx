import { useState, useEffect } from 'react';
import { Activity, Eye, Shield, UserPlus, Vote, Calendar, Trash2, Edit2, Clock, User, Award, Search, Filter } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { api } from '../utils/api';
import { projectId, publicAnonKey } from '../utils/supabase/info';

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
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e2c9f810/admin/system-activity`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('Activity data received:', data);
        console.log('Number of activities:', data.activities?.length || 0);
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

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'auth': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'vote': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'admin': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'election': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'employee': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
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
        return `${user} performed action: ${activity.action}`;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary" />
            System Activity Monitor
          </CardTitle>
          <CardDescription>Loading activity logs...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activities.length}</div>
            <p className="text-xs text-muted-foreground mt-1">All-time events</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Recent Votes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {activities.filter(a => a.type === 'vote').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Votes cast</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Admin Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {activities.filter(a => a.type === 'admin').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Admin operations</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Activity Timeline
          </CardTitle>
          <CardDescription>
            Real-time log of all system activities (updates every 30 seconds)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <Input
              type="text"
              placeholder="Search activities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
            <Select
              value={filterType}
              onValueChange={(value) => setFilterType(value)}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="auth">Auth</SelectItem>
                <SelectItem value="vote">Vote</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="election">Election</SelectItem>
                <SelectItem value="employee">Employee</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filterAction}
              onValueChange={(value) => setFilterAction(value)}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="user_signup">User Signup</SelectItem>
                <SelectItem value="user_login">User Login</SelectItem>
                <SelectItem value="admin_granted">Admin Granted</SelectItem>
                <SelectItem value="admin_revoked">Admin Revoked</SelectItem>
                <SelectItem value="user_deleted">User Deleted</SelectItem>
                <SelectItem value="vote_cast">Vote Cast</SelectItem>
                <SelectItem value="vote_revoked">Vote Revoked</SelectItem>
                <SelectItem value="election_created">Election Created</SelectItem>
                <SelectItem value="election_updated">Election Updated</SelectItem>
                <SelectItem value="employee_created">Employee Created</SelectItem>
                <SelectItem value="employee_updated">Employee Updated</SelectItem>
                <SelectItem value="employee_deleted">Employee Deleted</SelectItem>
                <SelectItem value="historical_import">Historical Import</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <ScrollArea className="h-[600px] pr-4">
            {activities.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Activity className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No activities recorded yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activities
                  .filter(activity => 
                    (filterType === 'all' || activity.type === filterType) &&
                    (filterAction === 'all' || activity.action === filterAction) &&
                    (searchQuery === '' || activity.action.toLowerCase().includes(searchQuery.toLowerCase()) || activity.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) || activity.user_email?.toLowerCase().includes(searchQuery.toLowerCase()))
                  )
                  .map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className={`p-2 rounded-lg border ${getActivityColor(activity.type)}`}>
                        {getActivityIcon(activity.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-tight">
                          {getActionDescription(activity)}
                        </p>
                        
                        {activity.details && Object.keys(activity.details).length > 0 && (
                          <div className="mt-2 text-xs text-muted-foreground space-y-1">
                            {activity.details.reason && (
                              <p className="italic">Reason: {activity.details.reason}</p>
                            )}
                            {activity.details.election_title && (
                              <p>Election: {activity.details.election_title}</p>
                            )}
                            {activity.details.target_user_email && (
                              <p className="font-medium">Target: {activity.details.target_user_email}</p>
                            )}
                            {activity.details.target_user_name && activity.details.target_user_email && (
                              <p className="font-medium">Target User: {activity.details.target_user_name} ({activity.details.target_user_email})</p>
                            )}
                            {activity.details.admin_email && activity.action !== 'user_signup' && (
                              <p className="text-primary font-medium">Action performed by: {activity.details.admin_email}</p>
                            )}
                            {activity.details.admin_name && (
                              <p className="text-primary font-medium">Admin: {activity.details.admin_name}</p>
                            )}
                            {activity.details.old_value !== undefined && activity.details.new_value !== undefined && (
                              <p>Changed: {String(activity.details.old_value)} → {String(activity.details.new_value)}</p>
                            )}
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {activity.type}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTimestamp(activity.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
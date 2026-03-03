import { useState, useEffect, useCallback } from 'react';
import { Plus, Users, Trophy, Edit2, Trash2, Calendar, Eye, Shield, UserCog, TrendingUp, Activity, FileDown, Award, AlertTriangle, Upload, Key, Download, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Employee, Election } from '../types';
import { api } from '../utils/api';
import { createClient } from '../utils/supabase/client';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Checkbox } from './ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { toast } from 'sonner@2.0.3';
import { EmployeeCard } from './EmployeeCard';
import { LoadingSpinner } from './LoadingSpinner';
import { SystemActivity } from './SystemActivity';
import { LeaderboardImport } from './LeaderboardImport';
import { HistoricalDataImport } from './HistoricalDataImport';
import { VoteManagement } from './VoteManagement';
import { ElectionsManagement } from './ElectionsManagement';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface AdminPageProps {
  currentUser: Employee;
  onElectionCreated: () => void;
}

interface Stats {
  totalEmployees: number;
  activeEmployees: number;
  totalVotes: number;
  activeElections: number;
  completedElections: number;
}

interface EmployeeFormData {
  name: string;
  email: string;
  role: string;
  department: string;
  image_url: string;
  is_admin: boolean;
}

export function AdminPage({ currentUser, onElectionCreated }: AdminPageProps) {
  const [stats, setStats] = useState<Stats>({
    totalEmployees: 0,
    activeEmployees: 0,
    totalVotes: 0,
    activeElections: 0,
    completedElections: 0
  });
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [users, setUsers] = useState<any[]>([]); // Voters (people who can vote)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Election form
  const [electionTitle, setElectionTitle] = useState('');
  const [electionStartDate, setElectionStartDate] = useState('');
  const [electionEndDate, setElectionEndDate] = useState('');
  const [eligibleEmployees, setEligibleEmployees] = useState<string[]>([]);
  
  // Employee form
  const [showEmployeeDialog, setShowEmployeeDialog] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [employeeForm, setEmployeeForm] = useState<EmployeeFormData>({
    name: '',
    email: '',
    role: '',
    department: '',
    image_url: '',
    is_admin: false
  });

  // Reset dialog
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');
  
  // Delete user dialog
  const [showDeleteUserDialog, setShowDeleteUserDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any | null>(null);
  const [deleteUserConfirmText, setDeleteUserConfirmText] = useState('');
  const [deletingUser, setDeletingUser] = useState(false);

  // Reset password dialog
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
  const [userToResetPassword, setUserToResetPassword] = useState<any | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);

  // Export state
  const [exporting, setExporting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [employeesRes, electionsRes, usersRes] = await Promise.all([
        api.getEmployees(),
        api.getElections(),
        api.getUsers().catch(() => ({ users: [] })) // Gracefully handle if not admin
      ]);

      const employeesList = employeesRes.employees || [];
      const electionsList = electionsRes.elections || [];
      const usersList = usersRes.users || [];

      setEmployees(employeesList);
      setUsers(usersList);

      // Calculate stats
      const now = new Date();
      const activeElections = electionsList.filter((e: any) => 
        new Date(e.start_time) <= now && new Date(e.end_time) >= now
      ).length;
      
      const completedElections = electionsList.filter((e: any) => 
        new Date(e.end_time) < now
      ).length;

      // Get total votes (this would need an API endpoint)
      let totalVotes = 0;
      for (const election of electionsList) {
        try {
          const { leaderboard } = await api.getLeaderboard(election.id);
          totalVotes += leaderboard.reduce((sum: number, entry: any) => sum + entry.vote_count, 0);
        } catch (err) {
          console.error('Error loading votes for election:', err);
        }
      }

      setStats({
        totalEmployees: employeesList.length,
        activeEmployees: employeesList.filter((e: Employee) => e.active).length,
        totalVotes,
        activeElections,
        completedElections
      });
    } catch (err: any) {
      console.error('Failed to load admin data:', err);
      setError('Failed to load data: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleCreateElection(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await api.createElection({
        title: electionTitle,
        start_time: new Date(electionStartDate).toISOString(),
        end_time: new Date(electionEndDate).toISOString(),
        eligible_employees: eligibleEmployees
      });

      setSuccess('Election created successfully!');
      setElectionTitle('');
      setElectionStartDate('');
      setElectionEndDate('');
      setEligibleEmployees([]);
      onElectionCreated();
      loadData();
    } catch (err: any) {
      console.error('Create election error:', err);
      setError(err.message || 'Failed to create election');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveEmployee(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (editingEmployee) {
        // Update employee
        await api.updateEmployee(editingEmployee.id, employeeForm);
        toast.success('Employee updated successfully!');
        setSuccess('Employee updated successfully!');
      } else {
        // Create new employee
        await api.createEmployee(employeeForm);
        toast.success('Employee created successfully!');
        setSuccess('Employee created successfully!');
      }

      setShowEmployeeDialog(false);
      resetEmployeeForm();
      loadData();
    } catch (err: any) {
      console.error('Save employee error:', err);
      const errorMessage = err.message || 'Failed to save employee';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteEmployee(employeeId: string) {
    if (!confirm('Are you sure you want to delete this employee?')) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await api.deleteEmployee(employeeId);
      setSuccess('Employee deleted successfully!');
      loadData();
    } catch (err: any) {
      console.error('Delete employee error:', err);
      setError(err.message || 'Failed to delete employee');
    } finally {
      setLoading(false);
    }
  }

  function openEmployeeDialog(employee?: Employee) {
    if (employee) {
      setEditingEmployee(employee);
      setEmployeeForm({
        name: employee.name,
        email: employee.email,
        role: employee.role,
        department: employee.department || '',
        image_url: employee.image_url || '',
        is_admin: employee.is_admin
      });
    } else {
      resetEmployeeForm();
    }
    setShowEmployeeDialog(true);
  }

  function resetEmployeeForm() {
    setEditingEmployee(null);
    setEmployeeForm({
      name: '',
      email: '',
      role: '',
      department: '',
      image_url: '',
      is_admin: false
    });
  }

  async function handleResetDatabase() {
    if (resetConfirmText !== 'RESET') {
      setError('Please type RESET to confirm');
      return;
    }

    setResetting(true);
    setError(null);
    setSuccess(null);

    try {
      // Get the current user's access token
      const supabase = createClient();
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.access_token) {
        throw new Error('Authentication required. Please sign in again.');
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e2c9f810/admin/reset-database`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset database');
      }

      // Clear local storage and reload
      localStorage.clear();
      sessionStorage.clear();
      
      // Show success and reload
      const deletedCount = data.deleted || {};
      alert(`Database reset complete!\n\nDeleted:\n- ${deletedCount.users || 0} users\n- ${deletedCount.employees || 0} employees\n- ${deletedCount.elections || 0} elections\n- ${deletedCount.ballots || 0} ballots\n- ${deletedCount.auth_users || 0} auth users\n\nReloading...`);
      window.location.reload();
    } catch (err: any) {
      console.error('Reset error:', err);
      setError(`Reset failed: ${err.message}`);
    } finally {
      setResetting(false);
      setShowResetDialog(false);
      setResetConfirmText('');
    }
  }

  async function handleToggleUserAdmin(userId: string, currentStatus: boolean) {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await api.updateUserAdmin(userId, !currentStatus);
      setSuccess(`User admin status updated successfully!`);
      
      // Reload users
      const usersRes = await api.getUsers();
      setUsers(usersRes.users || []);
    } catch (err: any) {
      console.error('Update user admin status error:', err);
      setError(err.message || 'Failed to update user admin status');
    } finally {
      setLoading(false);
    }
  }

  async function handleConvertToEmployee(userId: string) {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await api.convertUserToEmployee(userId);
      setSuccess(`User converted to employee successfully!`);
      
      // Reload both users and employees
      const [usersRes, employeesRes] = await Promise.all([
        api.getUsers(),
        api.getEmployees()
      ]);
      setUsers(usersRes.users || []);
      setEmployees(employeesRes.employees || []);
    } catch (err: any) {
      console.error('Convert user to employee error:', err);
      setError(err.message || 'Failed to convert user to employee');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteUser(userId: string) {
    if (deleteUserConfirmText !== 'DELETE') {
      setError('Please type DELETE to confirm');
      return;
    }

    setDeletingUser(true);
    setError(null);
    setSuccess(null);

    try {
      await api.deleteUser(userId);
      setSuccess(`User deleted successfully!`);
      
      // Reload users
      const usersRes = await api.getUsers();
      setUsers(usersRes.users || []);
    } catch (err: any) {
      console.error('Delete user error:', err);
      setError(err.message || 'Failed to delete user');
    } finally {
      setDeletingUser(false);
      setShowDeleteUserDialog(false);
      setDeleteUserConfirmText('');
    }
  }

  async function handleResetPassword(userId: string) {
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setResettingPassword(true);
    setError(null);
    setSuccess(null);

    try {
      await api.resetUserPassword(userId, newPassword);
      setSuccess(`Password reset successfully!`);
      
      // Reload users
      const usersRes = await api.getUsers();
      setUsers(usersRes.users || []);
    } catch (err: any) {
      console.error('Reset user password error:', err);
      setError(err.message || 'Failed to reset user password');
    } finally {
      setResettingPassword(false);
      setShowResetPasswordDialog(false);
      setNewPassword('');
      setUserToResetPassword(null);
    }
  }

  function isUserAnEmployee(userId: string): boolean {
    return employees.some(emp => emp.id === userId);
  }

  async function handleExportAllData() {
    setExporting(true);
    setError(null);
    setSuccess(null);

    try {
      const data = await api.exportAllData();
      const wb = XLSX.utils.book_new();

      // --- Sheet 1: Summary Overview ---
      const summaryRows: any[][] = [
        ['IQ Vote - Complete System Data Export'],
        [`Exported on: ${new Date(data.exported_at).toLocaleString()}`],
        [],
        ['System Summary'],
        ['Metric', 'Value'],
        ['Total Elections', data.summary.total_elections],
        ['Total Employees (Candidates)', data.summary.total_employees],
        ['Total Users (Voters)', data.summary.total_users],
        ['Total Ballots Cast', data.summary.total_ballots],
        ['Revoked Ballots', data.summary.total_revoked],
        [],
        ['All Elections'],
        ['Title', 'Status', 'Start Date', 'End Date', 'Candidates', 'Ballots Cast', 'Revoked', 'Historical'],
      ];
      for (const el of data.elections) {
        summaryRows.push([
          el.title,
          el.status.charAt(0).toUpperCase() + el.status.slice(1),
          new Date(el.start_time).toLocaleDateString(),
          new Date(el.end_time).toLocaleDateString(),
          el.candidate_count,
          el.total_ballots,
          el.revoked_ballots,
          el.is_historical ? 'Yes' : 'No',
        ]);
      }
      const summaryWs = XLSX.utils.aoa_to_sheet(summaryRows);
      summaryWs['!cols'] = [
        { wch: 42 }, { wch: 12 }, { wch: 14 }, { wch: 14 },
        { wch: 12 }, { wch: 14 }, { wch: 10 }, { wch: 12 },
      ];
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

      // --- Sheet 2: Election Results ---
      const resultsRows: any[][] = [
        ['IQ Vote - Election Results (All Elections)'],
        [`Exported on: ${new Date(data.exported_at).toLocaleString()}`],
        [],
      ];
      for (const el of data.elections) {
        resultsRows.push([`Election: ${el.title}`]);
        resultsRows.push([
          `Period: ${new Date(el.start_time).toLocaleDateString()} - ${new Date(el.end_time).toLocaleDateString()}`,
          '', '', '', '', '', '', '',
          `Status: ${el.status}`,
          `Ballots: ${el.total_ballots}`,
        ]);
        if (el.leaderboard.length > 0) {
          resultsRows.push([
            'Rank', 'Name', 'Email', 'Role', 'Department',
            'Total Points', '1st Place (5pts)', '2nd Place (3pts)', '3rd Place (2pts)', 'Total Votes',
          ]);
          el.leaderboard.forEach((entry: any, idx: number) => {
            resultsRows.push([
              idx + 1,
              entry.employee_name,
              entry.employee_email,
              entry.employee_role,
              entry.employee_department,
              entry.total_points,
              entry.count_first,
              entry.count_second,
              entry.count_third,
              entry.total_votes,
            ]);
          });
        } else {
          resultsRows.push(['No results for this election']);
        }
        resultsRows.push([]);
      }
      const resultsWs = XLSX.utils.aoa_to_sheet(resultsRows);
      resultsWs['!cols'] = [
        { wch: 8 }, { wch: 22 }, { wch: 26 }, { wch: 20 }, { wch: 18 },
        { wch: 14 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 12 },
      ];
      XLSX.utils.book_append_sheet(wb, resultsWs, 'Election Results');

      // --- Sheet 3: Voter Participation ---
      const participationRows: any[][] = [
        ['IQ Vote - Voter Participation (Who Voted, Not What They Voted)'],
        [`Exported on: ${new Date(data.exported_at).toLocaleString()}`],
        [],
      ];
      for (const el of data.elections) {
        participationRows.push([`Election: ${el.title}`]);
        participationRows.push([
          `Period: ${new Date(el.start_time).toLocaleDateString()} - ${new Date(el.end_time).toLocaleDateString()}`,
        ]);
        if (el.voters.length > 0) {
          participationRows.push(['Voter Name', 'Voter Email', 'Voted At']);
          for (const voter of el.voters) {
            participationRows.push([
              voter.voter_name,
              voter.voter_email,
              new Date(voter.voted_at).toLocaleString(),
            ]);
          }
          participationRows.push([`Total voters: ${el.voters.length}`]);
        } else {
          participationRows.push(['No votes recorded']);
        }
        participationRows.push([]);
      }
      const participationWs = XLSX.utils.aoa_to_sheet(participationRows);
      participationWs['!cols'] = [{ wch: 24 }, { wch: 30 }, { wch: 24 }];
      XLSX.utils.book_append_sheet(wb, participationWs, 'Voter Participation');

      // --- Sheet 4: Employees (Candidates) ---
      const empRows: any[][] = [
        ['IQ Vote - Employee Directory (Candidates)'],
        [`Exported on: ${new Date(data.exported_at).toLocaleString()}`],
        [`Total Active Employees: ${data.employees.length}`],
        [],
        ['Name', 'Email', 'Role', 'Department', 'Added On'],
      ];
      for (const emp of data.employees) {
        empRows.push([
          emp.name,
          emp.email,
          emp.role,
          emp.department,
          emp.created_at ? new Date(emp.created_at).toLocaleDateString() : '',
        ]);
      }
      const empWs = XLSX.utils.aoa_to_sheet(empRows);
      empWs['!cols'] = [{ wch: 22 }, { wch: 28 }, { wch: 22 }, { wch: 18 }, { wch: 14 }];
      XLSX.utils.book_append_sheet(wb, empWs, 'Employees');

      // --- Sheet 5: Users (Voters) ---
      const userRows: any[][] = [
        ['IQ Vote - Registered Users (Voters)'],
        [`Exported on: ${new Date(data.exported_at).toLocaleString()}`],
        [`Total Users: ${data.users.length}`],
        [],
        ['Name', 'Email', 'Role', 'Admin', 'Registered On'],
      ];
      for (const u of data.users) {
        userRows.push([
          u.name,
          u.email,
          u.role,
          u.is_admin ? 'Yes' : 'No',
          u.created_at ? new Date(u.created_at).toLocaleDateString() : '',
        ]);
      }
      const userWs = XLSX.utils.aoa_to_sheet(userRows);
      userWs['!cols'] = [{ wch: 22 }, { wch: 28 }, { wch: 22 }, { wch: 8 }, { wch: 14 }];
      XLSX.utils.book_append_sheet(wb, userWs, 'Users');

      // Generate and download
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `IQ_Vote_Complete_Export_${dateStr}.xlsx`;
      XLSX.writeFile(wb, filename);

      setSuccess(`Export complete! Downloaded ${filename} with ${data.summary.total_elections} elections, ${data.summary.total_employees} employees, ${data.summary.total_users} users, and ${data.summary.total_ballots} ballots.`);
    } catch (err: any) {
      console.error('Export all data error:', err);
      setError('Failed to export data: ' + err.message);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent mb-2">
            Admin Dashboard
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage elections, employees, and view analytics
          </p>
        </div>
        <Button
          onClick={handleExportAllData}
          disabled={exporting}
          variant="outline"
          className="gap-2 shrink-0 w-full sm:w-auto hover:border-primary/50 hover:text-primary transition-colors"
        >
          {exporting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Export All Data
            </>
          )}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6 shadow-lg">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 border-green-500/50 bg-green-500/10 shadow-lg">
          <AlertDescription className="text-green-600 dark:text-green-400">{success}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Employees</CardTitle>
              <Users className="w-4 h-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalEmployees || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.activeEmployees || 0} active
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Votes</CardTitle>
              <Trophy className="w-4 h-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalVotes || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all elections
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Elections</CardTitle>
              <Activity className="w-4 h-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.activeElections || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Currently running
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
              <Award className="w-4 h-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.completedElections || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Past elections
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="elections" className="w-full">
        <div className="w-full overflow-x-auto">
          <TabsList className="w-full sm:w-auto inline-flex">
            <TabsTrigger value="elections" className="flex-1 sm:flex-none text-xs sm:text-sm px-3 sm:px-5">
              Create Election
            </TabsTrigger>
            <TabsTrigger value="manage-elections" className="flex-1 sm:flex-none text-xs sm:text-sm px-3 sm:px-5">
              Manage Elections
            </TabsTrigger>
            <TabsTrigger value="employees" className="flex-1 sm:flex-none text-xs sm:text-sm px-3 sm:px-5">
              Employees
            </TabsTrigger>
            <TabsTrigger value="users" className="flex-1 sm:flex-none text-xs sm:text-sm px-3 sm:px-5">
              Users
            </TabsTrigger>
            <TabsTrigger value="votes" className="flex-1 sm:flex-none text-xs sm:text-sm px-3 sm:px-5">
              Votes
            </TabsTrigger>
            <TabsTrigger value="historical" className="flex-1 sm:flex-none text-xs sm:text-sm px-3 sm:px-5">
              Historical
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex-1 sm:flex-none text-xs sm:text-sm px-3 sm:px-5">
              Activity
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Elections Tab */}
        <TabsContent value="elections" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Calendar className="w-5 h-5 text-primary" />
                Create New Election
              </CardTitle>
              <CardDescription>
                Set up a new voting period for IQ Vote
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateElection} className="space-y-4">
                <div>
                  <Label htmlFor="title">Election Title</Label>
                  <Input
                    id="title"
                    value={electionTitle}
                    onChange={(e) => setElectionTitle(e.target.value)}
                    placeholder="e.g., December 2024 IQ Vote"
                    required
                    className="mt-1.5"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start-date">Start Date & Time</Label>
                    <Input
                      id="start-date"
                      type="datetime-local"
                      value={electionStartDate}
                      onChange={(e) => setElectionStartDate(e.target.value)}
                      required
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="end-date">End Date & Time</Label>
                    <Input
                      id="end-date"
                      type="datetime-local"
                      value={electionEndDate}
                      onChange={(e) => setElectionEndDate(e.target.value)}
                      required
                      className="mt-1.5"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                    <Label>Eligible Employees ({eligibleEmployees.length} selected)</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setEligibleEmployees(employees.filter(e => e.active).map(e => e.id))}
                        className="text-xs sm:text-sm"
                      >
                        Select All
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setEligibleEmployees([])}
                        className="text-xs sm:text-sm"
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto p-4 bg-muted/30 border border-border rounded-lg">
                    {employees.filter(e => e.active).map(employee => (
                      <div key={employee.id} className="flex items-start gap-2">
                        <Checkbox
                          id={`eligible-${employee.id}`}
                          checked={eligibleEmployees.includes(employee.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setEligibleEmployees([...eligibleEmployees, employee.id]);
                            } else {
                              setEligibleEmployees(eligibleEmployees.filter(id => id !== employee.id));
                            }
                          }}
                        />
                        <label
                          htmlFor={`eligible-${employee.id}`}
                          className="text-sm font-medium cursor-pointer flex-1"
                        >
                          {employee.name}
                          <span className="block text-xs text-muted-foreground">{employee.role}</span>
                        </label>
                      </div>
                    ))}
                    {employees.filter(e => e.active).length === 0 && (
                      <p className="text-sm text-muted-foreground col-span-full text-center py-4">
                        No active employees found. Add employees in the Employees tab first.
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Only selected employees will be eligible to receive votes in this election
                  </p>
                </div>

                <Alert className="border-blue-500/50 bg-blue-500/10">
                  <Users className="h-4 w-4 text-blue-500" />
                  <AlertDescription className="text-blue-600 dark:text-blue-400 text-xs">
                    <strong>Important:</strong> ALL registered users (including admins) can vote in this election. The employees selected above are candidates who can RECEIVE votes. This separation allows executives and managers to participate in voting without being candidates themselves.
                  </AlertDescription>
                </Alert>

                <Button type="submit" disabled={loading || eligibleEmployees.length === 0} className="gap-2">
                  {loading ? (
                    <>
                      <LoadingSpinner size="sm" inline />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Create Election
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Manage Elections Tab */}
        <TabsContent value="manage-elections" className="space-y-6">
          <div className="mb-6">
            <h3 className="text-xl font-bold mb-1">Manage Elections</h3>
            <p className="text-sm text-muted-foreground">
              View, search, and delete elections across all time periods
            </p>
          </div>
          <ElectionsManagement />
        </TabsContent>

        {/* Employees Tab */}
        <TabsContent value="employees" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    Employee Management
                  </CardTitle>
                  <CardDescription>
                    Add, edit, or remove employees from the system
                  </CardDescription>
                </div>
                <Dialog open={showEmployeeDialog} onOpenChange={setShowEmployeeDialog}>
                  <DialogTrigger asChild>
                    <Button onClick={() => openEmployeeDialog()} className="gap-2 w-full sm:w-auto">
                      <Plus className="w-4 h-4" />
                      Add Employee
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>
                        {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
                      </DialogTitle>
                      <DialogDescription>
                        {editingEmployee 
                          ? 'Update employee information below'
                          : 'Enter the details for the new employee'
                        }
                      </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSaveEmployee} className="space-y-4">
                      <div>
                        <Label htmlFor="emp-name">Full Name</Label>
                        <Input
                          id="emp-name"
                          value={employeeForm.name}
                          onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })}
                          placeholder="John Doe"
                          required
                          className="mt-1.5"
                        />
                      </div>

                      <div>
                        <Label htmlFor="emp-email">Email</Label>
                        <Input
                          id="emp-email"
                          type="email"
                          value={employeeForm.email}
                          onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })}
                          placeholder="john.doe@company.com"
                          required
                          className="mt-1.5"
                        />
                      </div>

                      <div>
                        <Label htmlFor="emp-role">Role</Label>
                        <Input
                          id="emp-role"
                          value={employeeForm.role}
                          onChange={(e) => setEmployeeForm({ ...employeeForm, role: e.target.value })}
                          placeholder="Software Engineer"
                          required
                          className="mt-1.5"
                        />
                      </div>

                      <div>
                        <Label htmlFor="emp-department">Department</Label>
                        <Input
                          id="emp-department"
                          value={employeeForm.department}
                          onChange={(e) => setEmployeeForm({ ...employeeForm, department: e.target.value })}
                          placeholder="Engineering"
                          className="mt-1.5"
                        />
                      </div>

                      <div>
                        <Label htmlFor="emp-image">Profile Image URL</Label>
                        <div className="flex gap-2 mt-1.5">
                          <Input
                            id="emp-image"
                            value={employeeForm.image_url}
                            onChange={(e) => setEmployeeForm({ ...employeeForm, image_url: e.target.value })}
                            placeholder="https://example.com/image.jpg"
                          />
                          <input
                            type="file"
                            id="image-upload"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                // Show loading toast
                                const loadingToast = toast.loading('Processing image...');
                                
                                // Convert to data URL for preview
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setEmployeeForm({ ...employeeForm, image_url: reader.result as string });
                                  toast.success('Image uploaded successfully!', { id: loadingToast });
                                };
                                reader.onerror = () => {
                                  toast.error('Failed to process image', { id: loadingToast });
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="icon"
                            onClick={() => document.getElementById('image-upload')?.click()}
                          >
                            <Upload className="w-4 h-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Enter a URL or click upload to select an image
                        </p>
                      </div>

                      {editingEmployee && (
                        <div className="flex items-center justify-between py-3 px-4 bg-muted/50 rounded-lg border border-border">
                          <div className="flex items-center gap-3">
                            <Shield className="w-5 h-5 text-primary" />
                            <div>
                              <Label htmlFor="emp-admin" className="cursor-pointer">
                                Admin Access
                              </Label>
                              <p className="text-xs text-muted-foreground">
                                Grants permission to create elections and manage employees
                              </p>
                            </div>
                          </div>
                          <Switch
                            id="emp-admin"
                            checked={employeeForm.is_admin}
                            onCheckedChange={(checked) => setEmployeeForm({ ...employeeForm, is_admin: checked })}
                          />
                        </div>
                      )}

                      <div className="flex gap-2 pt-4">
                        <Button type="submit" disabled={loading} className="flex-1">
                          {loading ? 'Saving...' : editingEmployee ? 'Update' : 'Create'}
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setShowEmployeeDialog(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {employees.map(employee => (
                  <div
                    key={employee.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-card border border-border rounded-lg hover:border-primary/30 transition-all"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 flex-shrink-0 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-primary/20">
                        {employee.image_url ? (
                          <img 
                            src={employee.image_url} 
                            alt={employee.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <Users className="w-6 h-6 text-primary" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold flex flex-wrap items-center gap-2 mb-1">
                          <span className="truncate">{employee.name}</span>
                          {employee.is_admin && employee.email !== 'ajayifey@gmail.com' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 text-xs flex-shrink-0">
                              <Shield className="w-3 h-3" />
                              Admin
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-2">
                          <span className="truncate">{employee.role}</span>
                          {employee.department && (
                            <>
                              <span className="hidden sm:inline">•</span>
                              <span className="truncate">{employee.department}</span>
                            </>
                          )}
                          {!employee.active && (
                            <>
                              <span className="hidden sm:inline">•</span>
                              <span className="text-destructive flex-shrink-0">Inactive</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 self-end sm:self-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEmployeeDialog(employee)}
                        className="gap-2 flex-1 sm:flex-none"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span className="sm:inline">Edit</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteEmployee(employee.id)}
                        className="gap-2 hover:border-destructive/50 hover:text-destructive flex-1 sm:flex-none"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span className="sm:inline">Delete</span>
                      </Button>
                    </div>
                  </div>
                ))}

                {employees.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <p className="mb-2">No employees found. Add your first employee to get started.</p>
                    <p className="text-xs">Note: To make a user an admin, they need to sign up first, then you can update their profile in the database.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive/50 bg-destructive/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Irreversible actions that will permanently delete data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-card border border-destructive/30 rounded-lg">
                <div>
                  <h4 className="font-semibold text-sm mb-1">Reset All Database Data</h4>
                  <p className="text-xs text-muted-foreground">
                    Permanently delete all users, employees, elections, and votes
                  </p>
                </div>
                <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => {
                        setResetConfirmText('');
                        setShowResetDialog(true);
                      }}
                    >
                      Reset Database
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <div className="flex items-center justify-center mb-4">
                        <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center">
                          <AlertTriangle className="w-6 h-6 text-destructive" />
                        </div>
                      </div>
                      <DialogTitle className="text-center">Reset All Data?</DialogTitle>
                      <DialogDescription className="text-center">
                        This action cannot be undone and will permanently delete:
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                      <Alert variant="destructive">
                        <AlertDescription>
                          <ul className="list-disc list-inside space-y-1 text-sm">
                            <li>All registered users and auth accounts</li>
                            <li>All employees and candidates</li>
                            <li>All elections and voting periods</li>
                            <li>All ballots and votes</li>
                            <li>All voting reasons and messages</li>
                          </ul>
                        </AlertDescription>
                      </Alert>

                      <div>
                        <Label htmlFor="reset-confirm" className="text-sm">
                          Type <span className="font-mono bg-muted px-1.5 py-0.5 rounded">RESET</span> to confirm:
                        </Label>
                        <Input
                          id="reset-confirm"
                          value={resetConfirmText}
                          onChange={(e) => setResetConfirmText(e.target.value)}
                          placeholder="Type RESET here"
                          className="mt-2"
                          autoComplete="off"
                        />
                      </div>

                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowResetDialog(false);
                            setResetConfirmText('');
                          }}
                          disabled={resetting}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={handleResetDatabase}
                          disabled={resetConfirmText !== 'RESET' || resetting}
                          className="flex-1"
                        >
                          {resetting ? 'Resetting...' : 'Reset Everything'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                User Management
              </CardTitle>
              <CardDescription>
                View all registered users (voters) and manage their admin permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-6 border-blue-500/50 bg-blue-500/10">
                <Users className="h-4 w-4 text-blue-500" />
                <AlertDescription className="text-blue-600 dark:text-blue-400 text-sm">
                  <strong>Note:</strong> Users are people who can vote. Employees (in the Employees tab) are candidates who can receive votes. These are two separate groups - executives can vote without being votable. Click "Make Employee" to convert a user into a votable employee.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                {users.map(user => {
                  const isEmployee = isUserAnEmployee(user.id);
                  return (
                    <div
                      key={user.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-card border border-border rounded-lg hover:border-primary/30 transition-all"
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-12 h-12 flex-shrink-0 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-primary/20">
                          <Users className="w-6 h-6 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold flex flex-wrap items-center gap-2 mb-1">
                            <span className="truncate">{user.name}</span>
                            {user.is_admin && user.email !== 'ajayifey@gmail.com' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 text-xs flex-shrink-0">
                                <Shield className="w-3 h-3" />
                                Admin
                              </span>
                            )}
                            {isEmployee && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 text-xs flex-shrink-0">
                                <Users className="w-3 h-3" />
                                Employee
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <div className="truncate">{user.email}</div>
                            {user.role && (
                              <div className="text-xs mt-0.5 truncate">{user.role}</div>
                            )}
                            <div className="text-xs mt-1">
                              Signed up: {new Date(user.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-3">
                        {!isEmployee && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleConvertToEmployee(user.id)}
                            disabled={loading}
                            className="gap-2 whitespace-nowrap"
                          >
                            <Plus className="w-3 h-3" />
                            Make Employee
                          </Button>
                        )}
                        <div className="flex items-center justify-between sm:justify-start gap-2 px-3 py-2 sm:p-0 bg-muted/30 sm:bg-transparent rounded-lg sm:rounded-none border sm:border-0">
                          <Label htmlFor={`admin-${user.id}`} className="text-sm cursor-pointer">
                            Admin
                          </Label>
                          <Switch
                            id={`admin-${user.id}`}
                            checked={user.is_admin}
                            onCheckedChange={() => handleToggleUserAdmin(user.id, user.is_admin)}
                            disabled={loading || user.id === currentUser.id}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 self-end sm:self-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setUserToResetPassword(user);
                            setNewPassword('');
                            setShowResetPasswordDialog(true);
                          }}
                          className="gap-2 flex-1 sm:flex-none"
                        >
                          <Key className="w-3 h-3" />
                          <span className="sm:inline">Reset Pwd</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setUserToDelete(user);
                            setDeleteUserConfirmText('');
                            setShowDeleteUserDialog(true);
                          }}
                          className="gap-2 flex-1 sm:flex-none"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span className="sm:inline">Delete</span>
                        </Button>
                      </div>
                    </div>
                  );
                })}

                {users.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="mb-2">No users found.</p>
                    <p className="text-xs">Users appear here when they sign up to the system.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Delete User Dialog */}
          <Dialog open={showDeleteUserDialog} onOpenChange={setShowDeleteUserDialog}>
            <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
              <DialogHeader className="flex-shrink-0">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-destructive" />
                  </div>
                </div>
                <DialogTitle className="text-center">Delete User Account?</DialogTitle>
                <DialogDescription className="text-center">
                  This will permanently delete the user account for{' '}
                  <span className="font-semibold">{userToDelete?.name}</span>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 overflow-y-auto flex-1 pr-2">
                <Alert variant="destructive">
                  <AlertDescription>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>User will be signed out immediately</li>
                      <li>All their authentication data will be deleted</li>
                      <li>Their votes and voting history will be preserved</li>
                      <li>If they are an employee, their employee record will remain</li>
                      <li>They can sign up again with the same email</li>
                    </ul>
                  </AlertDescription>
                </Alert>

                {userToDelete?.email === 'ajayifey@gmail.com' && (
                  <Alert variant="destructive">
                    <AlertDescription className="font-semibold">
                      ⚠️ This is the system owner account. Deleting it is not recommended!
                    </AlertDescription>
                  </Alert>
                )}

                <div>
                  <Label htmlFor="delete-confirm" className="text-sm">
                    Type <span className="font-mono bg-muted px-1.5 py-0.5 rounded">DELETE</span> to confirm:
                  </Label>
                  <Input
                    id="delete-confirm"
                    value={deleteUserConfirmText}
                    onChange={(e) => setDeleteUserConfirmText(e.target.value)}
                    placeholder="Type DELETE here"
                    className="mt-2"
                    autoComplete="off"
                  />
                </div>
              </div>

              <div className="flex gap-3 flex-shrink-0 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteUserDialog(false);
                    setDeleteUserConfirmText('');
                    setUserToDelete(null);
                  }}
                  disabled={deletingUser}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => userToDelete && handleDeleteUser(userToDelete.id)}
                  disabled={deleteUserConfirmText !== 'DELETE' || deletingUser}
                  className="flex-1"
                >
                  {deletingUser ? 'Deleting...' : 'Delete User'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Reset Password Dialog */}
          <Dialog open={showResetPasswordDialog} onOpenChange={setShowResetPasswordDialog}>
            <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
              <DialogHeader className="flex-shrink-0">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-destructive" />
                  </div>
                </div>
                <DialogTitle className="text-center">Reset User Password?</DialogTitle>
                <DialogDescription className="text-center">
                  This will reset the password for{' '}
                  <span className="font-semibold">{userToResetPassword?.name}</span>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 overflow-y-auto flex-1 pr-2">
                <Alert variant="destructive">
                  <AlertDescription>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>User will be signed out immediately</li>
                      <li>Their current password will be invalidated</li>
                      <li>They will receive a password reset email</li>
                    </ul>
                  </AlertDescription>
                </Alert>

                {userToResetPassword?.email === 'ajayifey@gmail.com' && (
                  <Alert variant="destructive">
                    <AlertDescription className="font-semibold">
                      ⚠️ This is the system owner account. Resetting the password is not recommended!
                    </AlertDescription>
                  </Alert>
                )}

                <div>
                  <Label htmlFor="new-password" className="text-sm">
                    Enter New Password:
                  </Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="mt-2"
                    autoComplete="off"
                  />
                </div>
              </div>

              <div className="flex gap-3 flex-shrink-0 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowResetPasswordDialog(false);
                    setNewPassword('');
                    setUserToResetPassword(null);
                  }}
                  disabled={resettingPassword}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => userToResetPassword && handleResetPassword(userToResetPassword.id)}
                  disabled={newPassword.length < 6 || resettingPassword}
                  className="flex-1"
                >
                  {resettingPassword ? 'Resetting...' : 'Reset Password'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Votes Tab */}
        <TabsContent value="votes" className="space-y-6">
          <div className="mb-6">
            <h3 className="text-xl font-bold mb-1">Vote Management</h3>
            <p className="text-sm text-muted-foreground">
              View who has voted and manage votes while protecting voter privacy
            </p>
          </div>
          <VoteManagement />
        </TabsContent>

        {/* Historical Data Tab */}
        <TabsContent value="historical" className="space-y-6">
          <div className="mb-6">
            <h3 className="text-xl font-bold mb-1">Import Historical Elections</h3>
            <p className="text-sm text-muted-foreground">
              Import past voting data into the system from various sources
            </p>
          </div>

          <Tabs defaultValue="leaderboard" className="w-full">
            <div className="w-full overflow-x-auto">
              <TabsList className="w-full sm:w-auto inline-flex">
                <TabsTrigger value="leaderboard" className="flex-1 sm:flex-none">Google Sheets Leaderboard</TabsTrigger>
                <TabsTrigger value="single" className="flex-1 sm:flex-none">Single Election</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="leaderboard" className="mt-6">
              <LeaderboardImport />
            </TabsContent>

            <TabsContent value="single" className="mt-6">
              <HistoricalDataImport />
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <SystemActivity />
        </TabsContent>
      </Tabs>
    </div>
  );
}
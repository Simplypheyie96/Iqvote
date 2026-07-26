import { useState, useEffect, useCallback, type ComponentType, type ReactNode } from 'react';
import { Plus, Users, Trophy, Edit2, Trash2, Calendar, Shield, UserCog, TrendingUp, Activity, FileDown, Award, AlertTriangle, Upload, Key, Download, Loader2, Copy, Search, Check as CheckIcon } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Employee, Election } from '../types';
import { api } from '../utils/api';
import { createClient } from '../utils/supabase/client';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Checkbox } from './ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { TAB_LIST_CLASS, TAB_TRIGGER_CLASS, SUBTAB_LIST_CLASS, SUBTAB_TRIGGER_CLASS } from './ui/tab-pills';
import { toast } from 'sonner@2.0.3';
import { EmployeeCard } from './EmployeeCard';
import { LoadingSpinner } from './LoadingSpinner';
import { SystemActivity } from './SystemActivity';
import { LeaderboardImport } from './LeaderboardImport';
import { HistoricalDataImport } from './HistoricalDataImport';
import { VoteManagement } from './VoteManagement';
import { ElectionsManagement } from './ElectionsManagement';

interface AdminPageProps {
  currentUser: Employee;
  onElectionCreated: () => void;
}

/**
 * The four headline numbers, in one enclosure rather than four floating cards.
 * Four separate cards for four single integers gave each number its own border,
 * its own shadow and its own inner padding — a lot of furniture around very
 * little content. One card with hairline dividers reads as a single instrument.
 */
function StatStrip({ stats }: { stats: Stats }) {
  /* Each number carries its own tinted icon tile. Four identical grey cells
     read as one undifferentiated block; the tints let you find "running now"
     without reading all four labels. The colours are the existing semantic
     tokens — no new palette. */
  const items = [
    { label: 'Employees', value: stats.totalEmployees || 0, hint: `${stats.activeEmployees || 0} active`, icon: Users, tint: 'bg-info/12 text-info' },
    { label: 'Votes cast', value: stats.totalVotes || 0, hint: 'across all elections', icon: Trophy, tint: 'bg-primary/12 text-primary-strong' },
    { label: 'Running now', value: stats.activeElections || 0, hint: 'open for voting', icon: Activity, tint: 'bg-success/12 text-success' },
    { label: 'Completed', value: stats.completedElections || 0, hint: 'past elections', icon: Award, tint: 'bg-warning/12 text-warning' },
  ];

  return (
    <div className="mb-8 grid grid-cols-2 overflow-hidden rounded-2xl border border-border bg-card shadow-e1 lg:grid-cols-4">
      {items.map(({ label, value, hint, icon: Icon, tint }, i) => (
        <div
          key={label}
          className={`animate-fade-in-up p-4 sm:p-5 ${i % 2 === 1 ? 'border-l border-border' : ''} ${
            i > 1 ? 'border-t border-border lg:border-t-0' : ''
          } ${i === 2 ? 'lg:border-l' : ''}`}
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <div className="flex items-center gap-2.5">
            <span className={`inline-grid h-8 w-8 shrink-0 place-items-center rounded-xl ${tint}`} aria-hidden="true">
              <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0 truncate text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
              {label}
            </span>
          </div>
          <div className="mt-3 font-display text-3xl font-semibold tabular-nums tracking-tight sm:text-4xl">
            {value}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        </div>
      ))}
    </div>
  );
}

/**
 * The heading every tab opens with. Before this, three of the seven tabs led
 * with a Card header, two with a bare h3 and two with nothing at all — so
 * switching tabs moved the first line of content around the screen.
 */
function TabHeader({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h3 className="font-display text-xl font-semibold tracking-tight">{title}</h3>
        <p className="mt-1 max-w-prose text-sm text-muted-foreground text-pretty">{description}</p>
      </div>
      {children}
    </div>
  );
}

/**
 * One numbered step of a long form. The number is the point: creating an
 * election is three decisions, and a form that shows them as three named steps
 * is far less daunting than the same fields stacked in one undifferentiated card.
 */
function FormSection({
  step,
  icon: Icon,
  title,
  description,
  children,
}: {
  step: number;
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-e1 sm:p-6">
      <div className="flex items-start gap-3.5">
        <span
          className="mt-0.5 inline-grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/12 text-primary-strong"
          aria-hidden="true"
        >
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h3 className="font-display text-base font-semibold tracking-tight">
            <span className="mr-2 text-sm font-medium tabular-nums text-muted-foreground">
              Step {step}
            </span>
            {title}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground text-pretty">{description}</p>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
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
  /* Display-only filter over the candidate list. It never touches what gets
     submitted — eligibleEmployees is the only thing the API sees. */
  const [eligibilitySearch, setEligibilitySearch] = useState('');

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
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);

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
    setError(null);
    setSuccess(null);

    if (new Date(electionStartDate) >= new Date(electionEndDate)) {
      setError('Start time must be before end time');
      return;
    }
    if (eligibleEmployees.length === 0) {
      setError('Select at least one eligible employee');
      return;
    }

    setLoading(true);
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
      setShowNewPassword(false);
      setCopiedPassword(false);
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

  /* Derived for display only. The submit handler re-checks these itself — this
     just says out loud, before you press the button, what it would have told
     you after. */
  const activeEmployees = employees.filter(e => e.active);
  const eligibilityQuery = eligibilitySearch.trim().toLowerCase();
  const visibleCandidates = eligibilityQuery
    ? activeEmployees.filter(e =>
        `${e.name} ${e.role ?? ''} ${e.department ?? ''}`.toLowerCase().includes(eligibilityQuery)
      )
    : activeEmployees;
  const datesOutOfOrder =
    Boolean(electionStartDate && electionEndDate) &&
    new Date(electionStartDate) >= new Date(electionEndDate);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 sm:mb-8">
        <div className="min-w-0">
          <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">
            Admin
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground text-pretty">
            Run elections, keep the roster current, and see what the team has been doing.
          </p>
        </div>
        <Button
          onClick={handleExportAllData}
          disabled={exporting}
          variant="outline"
          className="h-10 gap-2 shrink-0 w-full sm:w-auto"
        >
          {exporting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Export all data
            </>
          )}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 border-success/50 bg-success/10">
          <AlertDescription className="text-success">{success}</AlertDescription>
        </Alert>
      )}

      <StatStrip stats={stats} />

      {/* Tabs */}
      <Tabs defaultValue="elections" className="w-full">
        <div className="-mx-4 mb-6 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <TabsList className={TAB_LIST_CLASS}>
            <TabsTrigger value="elections" className={TAB_TRIGGER_CLASS}>
              Create Election
            </TabsTrigger>
            <TabsTrigger value="manage-elections" className={TAB_TRIGGER_CLASS}>
              Manage Elections
            </TabsTrigger>
            <TabsTrigger value="employees" className={TAB_TRIGGER_CLASS}>
              Employees
            </TabsTrigger>
            <TabsTrigger value="users" className={TAB_TRIGGER_CLASS}>
              Users
            </TabsTrigger>
            <TabsTrigger value="votes" className={TAB_TRIGGER_CLASS}>
              Votes
            </TabsTrigger>
            <TabsTrigger value="historical" className={TAB_TRIGGER_CLASS}>
              Historical
            </TabsTrigger>
            <TabsTrigger value="activity" className={TAB_TRIGGER_CLASS}>
              Activity
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Elections Tab */}
        <TabsContent value="elections" className="mt-0">
          {/* Three questions, in the order you'd ask them out loud: what is it,
              when does it run, who can win. Each numbered so the form reads as
              a sequence rather than a wall of fields. */}
          {/* Capped for readability, but CENTRED rather than pinned left: at a
              desktop width a left-pinned column leaves one wide empty gutter on
              the right that reads as a layout bug rather than as breathing room. */}
          <form onSubmit={handleCreateElection} className="mx-auto max-w-4xl space-y-6">
            <FormSection
              step={1}
              icon={Calendar}
              title="Name the election"
              description="Voters see this at the top of the ballot, so use the month it covers."
            >
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={electionTitle}
                onChange={(e) => setElectionTitle(e.target.value)}
                placeholder="December 2026 — Employee of the Month"
                required
                className="mt-1.5 h-11"
              />
            </FormSection>

            <FormSection
              step={2}
              icon={Activity}
              title="Set the voting window"
              description="Voting opens and closes automatically at these times, in your local timezone."
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="start-date">Opens</Label>
                  <Input
                    id="start-date"
                    type="datetime-local"
                    value={electionStartDate}
                    onChange={(e) => setElectionStartDate(e.target.value)}
                    required
                    className="mt-1.5 h-11"
                  />
                </div>

                <div>
                  <Label htmlFor="end-date">Closes</Label>
                  <Input
                    id="end-date"
                    type="datetime-local"
                    value={electionEndDate}
                    onChange={(e) => setElectionEndDate(e.target.value)}
                    required
                    aria-invalid={datesOutOfOrder}
                    aria-describedby={datesOutOfOrder ? 'date-order-error' : undefined}
                    className="mt-1.5 h-11"
                  />
                </div>
              </div>

              {/* Says it here, next to the field that's wrong, instead of after
                  the submit that would have failed. Same rule, same wording. */}
              {datesOutOfOrder && (
                <p
                  id="date-order-error"
                  role="alert"
                  className="mt-3 flex items-center gap-2 text-sm font-medium text-destructive"
                >
                  <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
                  Start time must be before end time
                </p>
              )}
            </FormSection>

            <FormSection
              step={3}
              icon={Users}
              title="Choose who can be voted for"
              description="Everyone with an account votes. These are the people they can vote for."
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Input
                    type="search"
                    value={eligibilitySearch}
                    onChange={(e) => setEligibilitySearch(e.target.value)}
                    placeholder="Search by name, role or team"
                    aria-label="Filter the candidate list"
                    className="h-11 pl-9"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEligibleEmployees(employees.filter(e => e.active).map(e => e.id))}
                    className="h-11 flex-1 sm:flex-none"
                  >
                    Select all
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEligibleEmployees([])}
                    disabled={eligibleEmployees.length === 0}
                    className="h-11 flex-1 sm:flex-none"
                  >
                    Clear
                  </Button>
                </div>
              </div>

              {/* A name and a role are a narrow thing; one per full-width row
                  left most of the panel empty. Two per row from `sm` up, as
                  discrete tiles, so the panel is actually filled and a partial
                  last row reads as a grid rather than as missing content.
                  20rem still clears six rows outright, and past that the list
                  scrolls with a row cut in half to say there's more. */}
              <div className="mt-4 max-h-80 overflow-y-auto rounded-xl border border-border p-2">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {visibleCandidates.map((employee) => {
                  const checked = eligibleEmployees.includes(employee.id);
                  return (
                    <label
                      key={employee.id}
                      htmlFor={`eligible-${employee.id}`}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-colors duration-150 ${
                        checked
                          ? 'bg-primary/10 inset-ring-1 inset-ring-primary/35'
                          : 'inset-ring-1 inset-ring-border hover:bg-muted/60'
                      }`}
                    >
                      <Checkbox
                        id={`eligible-${employee.id}`}
                        checked={checked}
                        onCheckedChange={(isChecked) => {
                          if (isChecked) {
                            setEligibleEmployees([...eligibleEmployees, employee.id]);
                          } else {
                            setEligibleEmployees(eligibleEmployees.filter(id => id !== employee.id));
                          }
                        }}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{employee.name}</span>
                        {employee.role && (
                          <span className="block truncate text-xs text-muted-foreground">
                            {employee.role}
                            {employee.department ? ` · ${employee.department}` : ''}
                          </span>
                        )}
                      </span>
                    </label>
                  );
                })}
                </div>

                {activeEmployees.length === 0 && (
                  <p className="px-4 py-10 text-center text-sm text-muted-foreground text-pretty">
                    No active employees yet. Add people in the Employees tab first.
                  </p>
                )}

                {activeEmployees.length > 0 && visibleCandidates.length === 0 && (
                  <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                    Nobody matches “{eligibilitySearch.trim()}”.
                  </p>
                )}
              </div>

              <p className="mt-3 text-sm text-muted-foreground tabular-nums" aria-live="polite">
                {eligibleEmployees.length === 0
                  ? 'Nobody selected yet — pick at least one candidate.'
                  : `${eligibleEmployees.length} of ${activeEmployees.length} selected`}
              </p>
            </FormSection>

            {/* Demoted from a coloured Alert. Nothing is wrong and nothing needs
                doing — it's a note about how the app works, so it reads like one. */}
            <p className="flex items-start gap-2.5 rounded-xl bg-muted/50 px-4 py-3 text-sm text-muted-foreground text-pretty inset-ring-1 inset-ring-border">
              <Users className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                <span className="font-medium text-foreground">Voters and candidates are separate.</span>{' '}
                Everyone with an account can vote, including admins. Only the people you selected
                above can receive votes — so managers can take part without competing.
              </span>
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                type="submit"
                disabled={loading || eligibleEmployees.length === 0 || datesOutOfOrder}
                className="h-11 gap-2 sm:w-auto"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" inline />
                    Creating…
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Create election
                  </>
                )}
              </Button>
              {eligibleEmployees.length === 0 && (
                <p className="text-sm text-muted-foreground">Select at least one candidate to continue.</p>
              )}
            </div>
          </form>
        </TabsContent>

        {/* Manage Elections Tab */}
        <TabsContent value="manage-elections" className="mt-0">
          <TabHeader
            title="Elections"
            description="Every election ever run — search them, open them, or remove one that was created by mistake."
          />
          <ElectionsManagement />
        </TabsContent>

        {/* Employees Tab */}
        <TabsContent value="employees" className="mt-0">
          <TabHeader
            title="Employees"
            description="The people who can receive votes. Everyone here is a candidate; voting accounts live under Users."
          >
                <Dialog open={showEmployeeDialog} onOpenChange={setShowEmployeeDialog}>
                  <DialogTrigger asChild>
                    <Button onClick={() => openEmployeeDialog()} className="h-11 gap-2 w-full shrink-0 sm:w-auto">
                      <Plus className="w-4 h-4" />
                      Add employee
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>
                        {editingEmployee ? 'Edit employee' : 'Add an employee'}
                      </DialogTitle>
                      <DialogDescription>
                        {editingEmployee
                          ? `Update ${editingEmployee.name}'s details.`
                          : 'They become a candidate as soon as you add them to an election.'
                        }
                      </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSaveEmployee} className="space-y-4">
                      <div>
                        <Label htmlFor="emp-name">Full name</Label>
                        <Input
                          id="emp-name"
                          value={employeeForm.name}
                          onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })}
                          placeholder="Ngozi Okonkwo"
                          required
                          className="mt-1.5 h-11"
                        />
                      </div>

                      <div>
                        <Label htmlFor="emp-email">Email</Label>
                        <Input
                          id="emp-email"
                          type="email"
                          value={employeeForm.email}
                          onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })}
                          placeholder="n.okonkwo@braindao.org"
                          required
                          className="mt-1.5 h-11"
                        />
                      </div>

                      <div>
                        <Label htmlFor="emp-role">Role</Label>
                        <Input
                          id="emp-role"
                          value={employeeForm.role}
                          onChange={(e) => setEmployeeForm({ ...employeeForm, role: e.target.value })}
                          placeholder="Protocol Engineer"
                          required
                          className="mt-1.5 h-11"
                        />
                      </div>

                      <div>
                        <Label htmlFor="emp-department">
                          Department <span className="font-normal text-muted-foreground">(optional)</span>
                        </Label>
                        <Input
                          id="emp-department"
                          value={employeeForm.department}
                          onChange={(e) => setEmployeeForm({ ...employeeForm, department: e.target.value })}
                          placeholder="Engineering"
                          className="mt-1.5 h-11"
                        />
                      </div>

                      <div>
                        <Label htmlFor="emp-image">
                          Photo <span className="font-normal text-muted-foreground">(optional)</span>
                        </Label>
                        <div className="flex gap-2 mt-1.5">
                          <Input
                            id="emp-image"
                            value={employeeForm.image_url}
                            onChange={(e) => setEmployeeForm({ ...employeeForm, image_url: e.target.value })}
                            placeholder="Paste an image URL"
                            className="h-11"
                          />
                          <input
                            type="file"
                            id="image-upload"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              if (file.size > 5 * 1024 * 1024) {
                                toast.error('Image must be under 5MB');
                                return;
                              }
                              const loadingToast = toast.loading('Uploading image...');
                              try {
                                const supabase = createClient();
                                const ext = file.name.split('.').pop() || 'jpg';
                                const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
                                const { error: uploadError } = await supabase.storage
                                  .from('make-e2c9f810-images')
                                  .upload(filename, file, { contentType: file.type, upsert: false });
                                if (uploadError) throw new Error(uploadError.message);
                                const { data: { publicUrl } } = supabase.storage
                                  .from('make-e2c9f810-images')
                                  .getPublicUrl(filename);
                                setEmployeeForm({ ...employeeForm, image_url: publicUrl });
                                toast.success('Image uploaded!', { id: loadingToast });
                              } catch (err: any) {
                                toast.error('Upload failed: ' + err.message, { id: loadingToast });
                              }
                              e.target.value = '';
                            }}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            aria-label="Upload a photo from your computer"
                            onClick={() => document.getElementById('image-upload')?.click()}
                            className="h-11 w-11 shrink-0"
                          >
                            <Upload className="w-4 h-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1.5">
                          Paste a link, or upload a file under 5&nbsp;MB.
                        </p>
                      </div>

                      {editingEmployee && (
                        <div className="flex items-center justify-between gap-4 rounded-xl bg-muted/50 px-4 py-3.5 inset-ring-1 inset-ring-border">
                          <div className="flex items-start gap-3">
                            <Shield className="mt-0.5 h-5 w-5 shrink-0 text-primary-strong" aria-hidden="true" />
                            <div>
                              <Label htmlFor="emp-admin" className="cursor-pointer">
                                Admin access
                              </Label>
                              <p className="mt-0.5 text-xs text-muted-foreground text-pretty">
                                Can create elections and manage everyone here.
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

                      <div className="flex gap-2 pt-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowEmployeeDialog(false)}
                          className="h-11 flex-1"
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="h-11 flex-1">
                          {loading ? 'Saving…' : editingEmployee ? 'Save changes' : 'Add employee'}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
          </TabHeader>

          {/* One enclosure, hairline-separated rows. Each employee used to be
              its own bordered card, which made a roster of twenty read as
              twenty unrelated objects instead of one list. */}
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-e1">
            {employees.map((employee, i) => (
              <div
                key={employee.id}
                className={`flex flex-col gap-4 p-4 transition-colors duration-150 hover:bg-muted/40 sm:flex-row sm:items-center sm:px-5 ${
                  i > 0 ? 'border-t border-border' : ''
                }`}
              >
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-primary/12 inset-ring-1 inset-ring-border">
                    {employee.image_url ? (
                      <img
                        src={employee.image_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-semibold text-primary-strong">
                        {employee.name.slice(0, 1).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate font-medium">{employee.name}</span>
                      {employee.is_admin && employee.email !== 'ajayifey@gmail.com' && (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/12 px-2 py-0.5 text-xs font-medium text-primary-strong">
                          <Shield className="h-3 w-3" aria-hidden="true" />
                          Admin
                        </span>
                      )}
                      {!employee.active && (
                        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">
                      {[employee.role, employee.department].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => openEmployeeDialog(employee)}
                    className="h-10 flex-1 gap-2 sm:flex-none"
                  >
                    <Edit2 className="w-3.5 h-3.5" aria-hidden="true" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleDeleteEmployee(employee.id)}
                    className="h-10 flex-1 gap-2 hover:border-destructive/50 hover:text-destructive sm:flex-none"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}

            {employees.length === 0 && (
              <div className="px-6 py-16 text-center">
                <div
                  className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-muted"
                  aria-hidden="true"
                >
                  <Users className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="mt-4 font-medium">No employees yet</p>
                <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground text-pretty">
                  Add the first one and they can be put forward as a candidate in your next election.
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="mt-0">
          <TabHeader
            title="Users"
            description="Everyone with an account. They can all vote — being a candidate is separate, and set under Employees."
          />

          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-e1">
            {users.map((user, i) => {
              const isEmployee = isUserAnEmployee(user.id);
              return (
                <div
                  key={user.id}
                  className={`p-4 transition-colors duration-150 hover:bg-muted/40 sm:px-5 ${
                    i > 0 ? 'border-t border-border' : ''
                  }`}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                    <div className="flex min-w-0 flex-1 items-center gap-4">
                      <div
                        className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary/12 inset-ring-1 inset-ring-border"
                        aria-hidden="true"
                      >
                        <span className="text-sm font-semibold text-primary-strong">
                          {(user.name || user.email).slice(0, 1).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="truncate font-medium">{user.name}</span>
                          {user.is_admin && user.email !== 'ajayifey@gmail.com' && (
                            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/12 px-2 py-0.5 text-xs font-medium text-primary-strong">
                              <Shield className="h-3 w-3" aria-hidden="true" />
                              Admin
                            </span>
                          )}
                          {isEmployee && (
                            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-success/12 px-2 py-0.5 text-xs font-medium text-success">
                              <Users className="h-3 w-3" aria-hidden="true" />
                              Candidate
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 truncate text-sm text-muted-foreground">{user.email}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {user.role ? `${user.role} · ` : ''}
                          Joined {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 lg:shrink-0">
                      {!isEmployee && (
                        <Button
                          variant="outline"
                          onClick={() => handleConvertToEmployee(user.id)}
                          disabled={loading}
                          className="h-10 gap-2 whitespace-nowrap"
                        >
                          <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                          Make candidate
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        onClick={() => {
                          setUserToResetPassword(user);
                          setNewPassword('');
                          setShowResetPasswordDialog(true);
                        }}
                        className="h-10 gap-2"
                      >
                        <Key className="w-3.5 h-3.5" aria-hidden="true" />
                        Reset password
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setUserToDelete(user);
                          setDeleteUserConfirmText('');
                          setShowDeleteUserDialog(true);
                        }}
                        className="h-10 gap-2 hover:border-destructive/50 hover:text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                        Delete
                      </Button>
                      {/* The one switch on the row, held apart from the buttons
                          by a divider — it changes what someone can do, the
                          buttons only open a dialog. */}
                      <div className="ml-auto flex items-center gap-2.5 lg:ml-0 lg:border-l lg:border-border lg:pl-4">
                        <Label htmlFor={`admin-${user.id}`} className="cursor-pointer text-sm">
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
                  </div>
                </div>
              );
            })}

            {users.length === 0 && (
              <div className="px-6 py-16 text-center">
                <div
                  className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-muted"
                  aria-hidden="true"
                >
                  <Shield className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="mt-4 font-medium">No users yet</p>
                <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground text-pretty">
                  People appear here the moment they sign up.
                </p>
              </div>
            )}
          </div>

          {/* Delete User Dialog */}
          <Dialog open={showDeleteUserDialog} onOpenChange={setShowDeleteUserDialog}>
            <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
              <DialogHeader className="flex-shrink-0">
                <div
                  className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-destructive/12"
                  aria-hidden="true"
                >
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <DialogTitle className="mt-4 text-center">
                  Delete {userToDelete?.name}&apos;s account?
                </DialogTitle>
                <DialogDescription className="text-center text-pretty">
                  They are signed out straight away and can sign up again with the same email.
                </DialogDescription>
              </DialogHeader>

              <div className="flex-1 space-y-4 overflow-y-auto">
                {/* Split by outcome, because "their votes are preserved" is
                    reassurance and sat oddly inside a red danger box with the
                    things that actually disappear. */}
                <div className="rounded-xl bg-muted/50 p-4 inset-ring-1 inset-ring-border">
                  <p className="text-sm font-medium">What gets deleted</p>
                  <p className="mt-1 text-sm text-muted-foreground text-pretty">
                    Their sign-in account and password.
                  </p>
                  <p className="mt-3 text-sm font-medium">What stays</p>
                  <p className="mt-1 text-sm text-muted-foreground text-pretty">
                    Every vote they cast, and their employee record if they have one.
                  </p>
                </div>

                {userToDelete?.email === 'ajayifey@gmail.com' && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="font-medium">
                      This is the system owner account. Deleting it is not recommended.
                    </AlertDescription>
                  </Alert>
                )}

                <div>
                  <Label htmlFor="delete-confirm" className="text-sm">
                    Type <span className="rounded bg-muted px-1.5 py-0.5 font-mono">DELETE</span> to
                    confirm
                  </Label>
                  <Input
                    id="delete-confirm"
                    value={deleteUserConfirmText}
                    onChange={(e) => setDeleteUserConfirmText(e.target.value)}
                    placeholder="DELETE"
                    className="mt-2 h-11"
                    autoComplete="off"
                  />
                </div>
              </div>

              <div className="flex flex-shrink-0 gap-3 border-t border-border pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteUserDialog(false);
                    setDeleteUserConfirmText('');
                    setUserToDelete(null);
                  }}
                  disabled={deletingUser}
                  className="h-11 flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => userToDelete && handleDeleteUser(userToDelete.id)}
                  disabled={deleteUserConfirmText !== 'DELETE' || deletingUser}
                  className="h-11 flex-1"
                >
                  {deletingUser ? 'Deleting…' : 'Delete account'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Reset Password Dialog */}
          <Dialog open={showResetPasswordDialog} onOpenChange={setShowResetPasswordDialog}>
            <DialogContent className="max-w-md flex flex-col">
              <DialogHeader className="flex-shrink-0">
                <div
                  className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/12"
                  aria-hidden="true"
                >
                  <Key className="h-6 w-6 text-primary-strong" />
                </div>
                <DialogTitle className="mt-4 text-center">Set a temporary password</DialogTitle>
                <DialogDescription className="text-center text-pretty">
                  This replaces {userToResetPassword?.name}&apos;s current password immediately.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="new-password">New password</Label>
                  <div className="mt-1.5 flex h-11 overflow-hidden rounded-xl border border-border transition-shadow focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/40">
                    <input
                      id="new-password"
                      type="text"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="min-w-0 flex-1 bg-transparent px-3.5 text-sm outline-none placeholder:text-muted-foreground"
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!newPassword) return;
                        navigator.clipboard.writeText(newPassword);
                        setCopiedPassword(true);
                        setTimeout(() => setCopiedPassword(false), 2000);
                      }}
                      disabled={!newPassword}
                      className="flex shrink-0 items-center gap-1.5 border-l border-border px-3.5 text-xs font-medium transition-colors duration-150 hover:bg-muted disabled:opacity-50"
                    >
                      {copiedPassword ? (
                        <>
                          <CheckIcon className="h-3.5 w-3.5 text-success" aria-hidden="true" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" aria-hidden="true" /> Copy
                        </>
                      )}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground text-pretty">
                    Send it to them yourself — they can change it from their profile once they&apos;re in.
                  </p>
                </div>

                {userToResetPassword?.email === 'ajayifey@gmail.com' && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="font-medium">
                      This is the system owner account. Resetting the password is not recommended.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="mt-2 flex flex-shrink-0 gap-3 border-t border-border pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowResetPasswordDialog(false);
                    setNewPassword('');
                    setShowNewPassword(false);
                    setCopiedPassword(false);
                    setUserToResetPassword(null);
                  }}
                  disabled={resettingPassword}
                  className="h-11 flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => userToResetPassword && handleResetPassword(userToResetPassword.id)}
                  disabled={newPassword.length < 6 || resettingPassword}
                  className="h-11 flex-1"
                >
                  {resettingPassword ? 'Resetting…' : 'Reset password'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Votes Tab */}
        <TabsContent value="votes" className="mt-0">
          <TabHeader
            title="Votes"
            description="Check turnout for any election."
          />
          <VoteManagement />
        </TabsContent>

        {/* Historical Data Tab */}
        <TabsContent value="historical" className="mt-0">
          <TabHeader
            title="Import past results"
            description="Bring elections that ran before IQ Vote into the leaderboard."
          />

          <Tabs defaultValue="leaderboard" className="w-full">
            <div className="-mx-4 mb-6 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <TabsList className={SUBTAB_LIST_CLASS}>
                <TabsTrigger value="leaderboard" className={SUBTAB_TRIGGER_CLASS}>
                  Google Sheets Leaderboard
                </TabsTrigger>
                <TabsTrigger value="single" className={SUBTAB_TRIGGER_CLASS}>
                  Single Election
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="leaderboard" className="mt-0">
              <LeaderboardImport />
            </TabsContent>

            <TabsContent value="single" className="mt-0">
              <HistoricalDataImport />
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="mt-0">
          <TabHeader
            title="Activity"
            description="A running log of what admins have changed and when."
          />
          <SystemActivity />
        </TabsContent>
      </Tabs>
    </div>
  );
}

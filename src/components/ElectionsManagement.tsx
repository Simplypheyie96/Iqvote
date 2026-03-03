import { useState, useEffect } from 'react';
import { Trash2, AlertCircle, CheckCircle2, Calendar, Clock, Search, Users, Vote, Play, X, Bell } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Badge } from './ui/badge';
import { api } from '../utils/api';

interface Election {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  created_at: string;
  created_by: string;
  eligible_employees: string[];
}

interface Employee {
  id: string;
  name: string;
}

interface ElectionWithVotes extends Election {
  voteCount?: number;
}

export function ElectionsManagement() {
  const [elections, setElections] = useState<ElectionWithVotes[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Delete dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [electionToDelete, setElectionToDelete] = useState<ElectionWithVotes | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Notify
  const [notifyingId, setNotifyingId] = useState<string | null>(null);

  // Close/Reopen dialog
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [statusAction, setStatusAction] = useState<'close' | 'reopen'>('close');
  const [electionToUpdate, setElectionToUpdate] = useState<ElectionWithVotes | null>(null);
  const [reopenEndDate, setReopenEndDate] = useState('');
  const [reopenEndTime, setReopenEndTime] = useState('23:59');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [electionsRes, employeesRes, voteCountsRes] = await Promise.all([
        api.getElections(),
        api.getEmployees(),
        api.getElectionVoteCounts().catch(() => ({ counts: {} }))
      ]);
      
      const electionsData = electionsRes.elections || [];
      const voteCounts: Record<string, number> = voteCountsRes.counts || {};
      
      const electionsWithVotes = electionsData.map((election: Election) => ({
        ...election,
        voteCount: voteCounts[election.id] || 0
      }));
      
      setElections(electionsWithVotes);
      setEmployees(employeesRes.employees || []);
    } catch (err: any) {
      console.error('Failed to load data:', err);
      setError('Failed to load data: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleNotify(election: ElectionWithVotes) {
    setNotifyingId(election.id);
    setError(null);
    setSuccess(null);
    try {
      const result = await api.notifyElection(election.id);
      if (result.skipped) {
        setError('Email not configured. Add BREVO_API_KEY to your Supabase environment variables.');
      } else {
        const failCount = result.errors?.length || 0;
        if (failCount === 0) {
          setSuccess(`Reminder sent to all ${result.sent} user${result.sent !== 1 ? 's' : ''}!`);
        } else {
          setSuccess(`Sent ${result.sent}/${result.total} emails.`);
          setError(`${failCount} failed — check that both sender emails are verified in Brevo. Failures: ${result.errors.slice(0, 3).join(' | ')}${result.errors.length > 3 ? ' …' : ''}`);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send notifications');
    } finally {
      setNotifyingId(null);
    }
  }

  function openDeleteDialog(election: ElectionWithVotes) {
    setElectionToDelete(election);
    setDeleteConfirmText('');
    setShowDeleteDialog(true);
  }

  async function handleDeleteElection() {
    if (!electionToDelete) return;
    
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await api.deleteElection(electionToDelete.id);
      setSuccess(`Election "${electionToDelete.title}" deleted successfully!`);
      setShowDeleteDialog(false);
      setElectionToDelete(null);
      setDeleteConfirmText('');
      loadData();
    } catch (err: any) {
      console.error('Failed to delete election:', err);
      setError('Failed to delete election: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  function openStatusDialog(election: ElectionWithVotes, action: 'close' | 'reopen') {
    setElectionToUpdate(election);
    setStatusAction(action);
    if (action === 'reopen') {
      const defaultEnd = new Date();
      defaultEnd.setDate(defaultEnd.getDate() + 7);
      setReopenEndDate(defaultEnd.toISOString().split('T')[0]);
      setReopenEndTime('23:59');
    }
    setShowStatusDialog(true);
  }

  async function handleUpdateElectionStatus() {
    if (!electionToUpdate) return;
    
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      let newEndTime: string | undefined;
      if (statusAction === 'reopen') {
        if (!reopenEndDate) {
          setError('Please select a new end date');
          setLoading(false);
          return;
        }
        newEndTime = new Date(`${reopenEndDate}T${reopenEndTime}:00`).toISOString();
      }

      await api.updateElectionStatus(electionToUpdate.id, statusAction, newEndTime);
      
      const actionLabel = statusAction === 'close' ? 'closed' : 'reopened';
      setSuccess(`Election "${electionToUpdate.title}" ${actionLabel} successfully!`);
      setShowStatusDialog(false);
      setElectionToUpdate(null);
      loadData();
    } catch (err: any) {
      console.error(`Failed to ${statusAction} election:`, err);
      setError(`Failed to ${statusAction} election: ` + err.message);
    } finally {
      setLoading(false);
    }
  }

  function getElectionStatus(election: Election): 'active' | 'upcoming' | 'past' {
    const now = new Date();
    const start = new Date(election.start_time);
    const end = new Date(election.end_time);

    if (now >= start && now <= end) return 'active';
    if (now < start) return 'upcoming';
    return 'past';
  }

  function getStatusBadge(status: 'active' | 'upcoming' | 'past') {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 hover:bg-green-500/20">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
            Active
          </Badge>
        );
      case 'upcoming':
        return (
          <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/20">
            Upcoming
          </Badge>
        );
      case 'past':
        return (
          <Badge variant="secondary">
            Completed
          </Badge>
        );
    }
  }

  // Filter elections based on search
  const filteredElections = elections.filter(election =>
    election.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    new Date(election.start_time).toLocaleDateString().includes(searchQuery) ||
    new Date(election.created_at).toLocaleDateString().includes(searchQuery)
  );

  // Group elections by status
  const now = new Date();
  const activeElections = filteredElections.filter(e => {
    const start = new Date(e.start_time);
    const end = new Date(e.end_time);
    return now >= start && now <= end;
  });
  
  const upcomingElections = filteredElections.filter(e => {
    const start = new Date(e.start_time);
    return now < start;
  });
  
  const pastElections = filteredElections.filter(e => {
    const end = new Date(e.end_time);
    return now > end;
  });

  function ElectionTable({ elections, emptyMessage }: { elections: ElectionWithVotes[], emptyMessage: string }) {
    if (elections.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          {emptyMessage}
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 font-semibold text-sm">Election Title</th>
              <th className="text-left py-3 px-4 font-semibold text-sm">Status</th>
              <th className="text-left py-3 px-4 font-semibold text-sm">Start Date</th>
              <th className="text-left py-3 px-4 font-semibold text-sm">End Date</th>
              <th className="text-left py-3 px-4 font-semibold text-sm">Created</th>
              <th className="text-left py-3 px-4 font-semibold text-sm">Candidates</th>
              <th className="text-left py-3 px-4 font-semibold text-sm">Votes</th>
              <th className="text-right py-3 px-4 font-semibold text-sm">Actions</th>
            </tr>
          </thead>
          <tbody>
            {elections.map((election) => {
              const status = getElectionStatus(election);
              return (
                <tr 
                  key={election.id}
                  className="border-b border-border hover:bg-muted/30 transition-colors"
                >
                  <td className="py-4 px-4">
                    <div className="font-medium">{election.title}</div>
                  </td>
                  <td className="py-4 px-4">
                    {getStatusBadge(status)}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(election.start_time).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(election.end_time).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(election.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="w-3.5 h-3.5" />
                      {election.eligible_employees?.length || 0}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Vote className="w-3.5 h-3.5" />
                      {election.voteCount || 0}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {(status === 'active' || status === 'upcoming') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openStatusDialog(election, 'close')}
                          className="gap-1.5 hover:border-amber-500/50 hover:text-amber-600 dark:hover:text-amber-400"
                        >
                        <X className="w-3 h-3" />
                          Close
                        </Button>
                      )}
                      {status === 'past' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openStatusDialog(election, 'reopen')}
                          className="gap-1.5 hover:border-green-500/50 hover:text-green-600 dark:hover:text-green-400"
                        >
                          <Play className="w-3 h-3" />
                          Reopen
                        </Button>
                      )}
                      {status === 'active' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleNotify(election)}
                          disabled={notifyingId === election.id}
                          className="gap-1.5 hover:border-primary/50 hover:text-primary"
                          title="Send reminder email to all users"
                        >
                          <Bell className="w-3 h-3" />
                          {notifyingId === election.id ? 'Sending…' : 'Notify All'}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDeleteDialog(election)}
                        className="gap-1.5 hover:border-destructive/50 hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-500/50 bg-green-500/10">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-600 dark:text-green-400">{success}</AlertDescription>
        </Alert>
      )}

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search elections by title or date..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Elections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">{activeElections.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming Elections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{upcomingElections.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Past Elections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pastElections.length}</div>
          </CardContent>
        </Card>
      </div>

      {loading && elections.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">Loading elections...</div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Active Elections */}
          {activeElections.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Active Elections
                </CardTitle>
                <CardDescription>
                  Currently running elections
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ElectionTable 
                  elections={activeElections} 
                  emptyMessage="No active elections"
                />
              </CardContent>
            </Card>
          )}

          {/* Upcoming Elections */}
          {upcomingElections.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-blue-600 dark:text-blue-400">Upcoming Elections</CardTitle>
                <CardDescription>
                  Elections that haven't started yet
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ElectionTable 
                  elections={upcomingElections} 
                  emptyMessage="No upcoming elections"
                />
              </CardContent>
            </Card>
          )}

          {/* Past Elections */}
          {pastElections.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Past Elections</CardTitle>
                <CardDescription>
                  Completed elections
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ElectionTable 
                  elections={pastElections} 
                  emptyMessage="No past elections"
                />
              </CardContent>
            </Card>
          )}

          {filteredElections.length === 0 && !loading && (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  {searchQuery ? `No elections match "${searchQuery}"` : 'No elections found'}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Election</DialogTitle>
            <DialogDescription>
              This action is permanent and will delete all associated data including votes, tallies, and results.
            </DialogDescription>
          </DialogHeader>

          {electionToDelete && (
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="font-semibold mb-2">{electionToDelete.title}</div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>Start: {new Date(electionToDelete.start_time).toLocaleDateString()}</div>
                  <div>End: {new Date(electionToDelete.end_time).toLocaleDateString()}</div>
                  <div>Status: {getElectionStatus(electionToDelete)}</div>
                </div>
              </div>

              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Warning:</strong> This will permanently delete:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>All votes cast in this election</li>
                    <li>All vote tallies and results</li>
                    <li>All audit logs for this election</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Type <span className="font-mono bg-muted px-1.5 py-0.5 rounded">DELETE</span> to confirm:
                </label>
                <Input
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE"
                  className="font-mono"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setDeleteConfirmText('');
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteElection}
              disabled={loading || deleteConfirmText !== 'DELETE'}
            >
              {loading ? 'Deleting...' : 'Delete Election'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close/Reopen Election Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={(open) => {
        setShowStatusDialog(open);
        if (!open) setElectionToUpdate(null);
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {statusAction === 'close' ? 'Close Election' : 'Reopen Election'}
            </DialogTitle>
            <DialogDescription>
              {statusAction === 'close'
                ? 'This will immediately end the election. No more votes will be accepted.'
                : 'This will reopen the election for voting until the new end date you specify.'}
            </DialogDescription>
          </DialogHeader>

          {electionToUpdate && (
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="font-semibold mb-2">{electionToUpdate.title}</div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>Start: {new Date(electionToUpdate.start_time).toLocaleDateString()}</div>
                  <div>End: {new Date(electionToUpdate.end_time).toLocaleDateString()}</div>
                  <div>Votes cast: {electionToUpdate.voteCount || 0}</div>
                </div>
              </div>

              {statusAction === 'close' ? (
                <Alert className="border-amber-500/50 bg-amber-500/10">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  <AlertDescription className="text-amber-700 dark:text-amber-300">
                    <strong>Note:</strong> Closing this election will:
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Immediately stop accepting new votes</li>
                      <li>Set the end time to right now</li>
                      <li>Existing votes and results will be preserved</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-3">
                  <Alert className="border-green-500/50 bg-green-500/10">
                    <AlertCircle className="h-4 w-4 text-green-500" />
                    <AlertDescription className="text-green-700 dark:text-green-300">
                      Reopening will allow voters to cast new votes. Previously cast votes remain intact.
                    </AlertDescription>
                  </Alert>

                  <div>
                    <label className="text-sm font-medium mb-2 block">New End Date</label>
                    <Input
                      type="date"
                      value={reopenEndDate}
                      onChange={(e) => setReopenEndDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">New End Time</label>
                    <Input
                      type="time"
                      value={reopenEndTime}
                      onChange={(e) => setReopenEndTime(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowStatusDialog(false);
                setElectionToUpdate(null);
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateElectionStatus}
              disabled={loading || (statusAction === 'reopen' && !reopenEndDate)}
              className={statusAction === 'close'
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'}
            >
              {loading
                ? (statusAction === 'close' ? 'Closing...' : 'Reopening...')
                : (statusAction === 'close' ? 'Close Election' : 'Reopen Election')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

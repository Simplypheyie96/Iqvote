import { useState, useEffect } from 'react';
import { Trash2, AlertCircle, CheckCircle2, Calendar, Clock, Search, Users, Vote, Play, X, Bell } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Alert, AlertDescription } from './ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Badge } from './ui/badge';
import { EmailSendResult } from './EmailSendResult';
import { api } from '../utils/api';
import { describeSendResult, type SendOutcome } from '../utils/emailSend';

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
  const [notifyResult, setNotifyResult] = useState<SendOutcome | null>(null);

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
    setNotifyResult(null);
    try {
      const result = await api.notifyElection(election.id);
      setNotifyResult(describeSendResult(result, { audience: 'with an account' }));
    } catch (err: any) {
      setNotifyResult({
        tone: 'error',
        title: err.message || 'The reminder request never reached the server.',
      });
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
    setNotifyResult(null);

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
    setNotifyResult(null);

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
          <Badge variant="success">
            <span className="w-1.5 h-1.5 bg-success rounded-full mr-0.5 animate-pulse"></span>
            Active
          </Badge>
        );
      case 'upcoming':
        return <Badge variant="info">Upcoming</Badge>;
      case 'past':
        return <Badge variant="secondary">Completed</Badge>;
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
        <div className="rounded-2xl border border-border bg-card px-6 py-12 text-center text-sm text-muted-foreground">
          {emptyMessage}
        </div>
      );
    }

    return (
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-e1">
        {elections.map((election, idx) => {
          const status = getElectionStatus(election);
          return (
            <div
              key={election.id}
              className={`animate-fade-in-up p-4 transition-colors duration-150 hover:bg-muted/40 sm:px-5 ${
                idx > 0 ? 'border-t border-border' : ''
              }`}
              style={{ animationDelay: `${Math.min(idx, 10) * 40}ms` }}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h4 className="font-semibold truncate">{election.title}</h4>
                    {getStatusBadge(status)}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" /> Start {new Date(election.start_time).toLocaleDateString()}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" /> End {new Date(election.end_time).toLocaleDateString()}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> Created {new Date(election.created_at).toLocaleDateString()}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" /> {election.eligible_employees?.length || 0} candidates
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Vote className="w-3.5 h-3.5" /> {election.voteCount || 0} votes
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap lg:justify-end">
                  {(status === 'active' || status === 'upcoming') && (
                    <Button
                      variant="outline"
                      onClick={() => openStatusDialog(election, 'close')}
                      className="h-10 gap-2 hover:border-warning/50 hover:text-warning"
                    >
                      <X className="w-3.5 h-3.5" aria-hidden="true" />
                      Close
                    </Button>
                  )}
                  {status === 'past' && (
                    <Button
                      variant="outline"
                      onClick={() => openStatusDialog(election, 'reopen')}
                      className="h-10 gap-2 hover:border-success/50 hover:text-success"
                    >
                      <Play className="w-3.5 h-3.5" aria-hidden="true" />
                      Reopen
                    </Button>
                  )}
                  {status === 'active' && (
                    <Button
                      variant="outline"
                      onClick={() => handleNotify(election)}
                      disabled={notifyingId === election.id}
                      className="h-10 gap-2 hover:border-primary/50 hover:text-primary-strong"
                      title="Send a reminder email to everyone"
                    >
                      <Bell className="w-3.5 h-3.5" aria-hidden="true" />
                      {notifyingId === election.id ? 'Sending…' : 'Remind everyone'}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => openDeleteDialog(election)}
                    className="h-10 gap-2 hover:border-destructive/50 hover:text-destructive"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
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
        <Alert className="border-success/50 bg-success/10">
          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          <AlertDescription className="text-success">{success}</AlertDescription>
        </Alert>
      )}

      <EmailSendResult result={notifyResult} />

      {/* A bare search field. It was wrapped in a Card, which gave a single
          input the same visual weight as a whole section of content. */}
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          placeholder="Search elections by title or date"
          aria-label="Search elections"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-11 pl-9"
        />
      </div>

      <div className="grid grid-cols-3 overflow-hidden rounded-2xl border border-border bg-card shadow-e1">
        {[
          { label: 'Running', value: activeElections.length, tone: 'text-success' },
          { label: 'Upcoming', value: upcomingElections.length, tone: 'text-info' },
          { label: 'Finished', value: pastElections.length, tone: '' },
        ].map(({ label, value, tone }, i) => (
          <div key={label} className={`p-4 sm:p-5 ${i > 0 ? 'border-l border-border' : ''}`}>
            <div className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
              {label}
            </div>
            <div className={`mt-2 font-display text-3xl font-semibold tabular-nums tracking-tight ${tone}`}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {loading && elections.length === 0 ? (
        <div className="space-y-3" aria-busy="true" aria-label="Loading elections">
          {[0, 1, 2].map(i => (
            <div key={i} className="h-24 animate-pulse rounded-2xl border border-border bg-card" />
          ))}
        </div>
      ) : (
        <>
          {/* The status is already on every row as a badge, so the group
              heading is a plain label, not another bordered card wrapped
              around a bordered list. */}
          {activeElections.length > 0 && (
            <section>
              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" aria-hidden="true" />
                Running now
              </h4>
              <ElectionTable elections={activeElections} emptyMessage="No active elections" />
            </section>
          )}

          {upcomingElections.length > 0 && (
            <section>
              <h4 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Upcoming
              </h4>
              <ElectionTable elections={upcomingElections} emptyMessage="No upcoming elections" />
            </section>
          )}

          {pastElections.length > 0 && (
            <section>
              <h4 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Finished
              </h4>
              <ElectionTable elections={pastElections} emptyMessage="No past elections" />
            </section>
          )}

          {filteredElections.length === 0 && !loading && (
            <div className="rounded-2xl border border-border bg-card px-6 py-16 text-center shadow-e1">
              <div
                className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-muted"
                aria-hidden="true"
              >
                <Calendar className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="mt-4 font-medium">
                {searchQuery ? 'Nothing matches that search' : 'No elections yet'}
              </p>
              <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground text-pretty">
                {searchQuery
                  ? `Nothing found for “${searchQuery}”. Try a shorter phrase.`
                  : 'Create one from the New election tab to get started.'}
              </p>
            </div>
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
              <div className="p-4 bg-muted/50 rounded-xl">
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
              <div className="p-4 bg-muted/50 rounded-xl">
                <div className="font-semibold mb-2">{electionToUpdate.title}</div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>Start: {new Date(electionToUpdate.start_time).toLocaleDateString()}</div>
                  <div>End: {new Date(electionToUpdate.end_time).toLocaleDateString()}</div>
                  <div>Votes cast: {electionToUpdate.voteCount || 0}</div>
                </div>
              </div>

              {statusAction === 'close' ? (
                <Alert className="border-warning/50 bg-warning/10">
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  <AlertDescription className="text-warning">
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
                  <Alert className="border-success/50 bg-success/10">
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    <AlertDescription className="text-success">
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
                ? 'bg-warning text-warning-foreground hover:bg-warning/90 active:bg-warning/85'
                : 'bg-success text-success-foreground hover:bg-success/90 active:bg-success/85'}
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

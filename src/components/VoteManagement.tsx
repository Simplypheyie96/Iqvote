import { useState, useEffect } from 'react';
import { Trash2, AlertCircle, CheckCircle2, XCircle, Search, FileDown, UserX, Bell } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Checkbox } from './ui/checkbox';
import { Skeleton } from './ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Textarea } from './ui/textarea';
import { EmailSendResult } from './EmailSendResult';
import { api } from '../utils/api';
import { describeSendResult, type SendOutcome } from '../utils/emailSend';

interface Ballot {
  voter_id: string;
  election_id: string;
  selections: {
    rank: number;
    employee_id: string;
    points: number;
  }[];
  created_at: string;
  revoked: boolean;
  revoked_at?: string;
  revoke_reason?: string;
  voter?: {
    name: string;
    email: string;
    role: string;
  };
}

interface Election {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  /* The employee ids on this election's ballot. Already in the /elections
     payload — this interface simply never declared it. */
  eligible_employees?: string[];
}

export function VoteManagement() {
  const [elections, setElections] = useState<Election[]>([]);
  const [selectedElectionId, setSelectedElectionId] = useState<string>('');
  const [votes, setVotes] = useState<Ballot[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  /* Only used to tell "hasn't voted yet" apart from "has no account, so never
     can". Without it the same five names sit in the chase list forever. */
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Delete dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [ballotToDelete, setBallotToDelete] = useState<Ballot | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteReasonPreset, setDeleteReasonPreset] = useState('');
  const [customDeleteReason, setCustomDeleteReason] = useState('');
  
  // Election search
  const [electionSearch, setElectionSearch] = useState('');
  
  // Election selection modal
  const [showElectionModal, setShowElectionModal] = useState(false);

  // Search/filter state for voters
  const [voterSearch, setVoterSearch] = useState('');

  /* Reminders. Held as the people the admin has *unticked* rather than the ones
     ticked, so everyone still to vote is a recipient by default and anyone who
     appears later — a candidate added mid-election — is included without the
     selection needing to be resynced behind the scenes. */
  const [excludedFromReminder, setExcludedFromReminder] = useState<Set<string>>(new Set());
  const [showRemindDialog, setShowRemindDialog] = useState(false);
  const [sendingReminder, setSendingReminder] = useState(false);
  const [reminderResult, setReminderResult] = useState<SendOutcome | null>(null);

  useEffect(() => {
    loadElections();
    loadEmployees();
    loadUsers();
  }, []);

  useEffect(() => {
    if (selectedElectionId) {
      loadVotes();
    }
    // A different election is a different set of people to chase.
    setExcludedFromReminder(new Set());
    setReminderResult(null);
  }, [selectedElectionId]);

  async function loadElections() {
    try {
      const { elections } = await api.getElections();
      setElections(elections || []);
      if (elections && elections.length > 0) {
        // Find current/active election (election currently running)
        const now = new Date();
        const activeElection = elections.find((e: Election) => 
          new Date(e.start_time) <= now && new Date(e.end_time) >= now
        );
        
        // If there's an active election, select it; otherwise select the first one
        setSelectedElectionId(activeElection?.id || elections[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load elections:', err);
      setError('Failed to load elections: ' + err.message);
    }
  }

  async function loadEmployees() {
    try {
      const { employees } = await api.getEmployees();
      setEmployees(employees || []);
    } catch (err: any) {
      console.error('Failed to load employees:', err);
    }
  }

  /* Non-fatal on purpose: if this fails the turnout list still works, it just
     can't say which candidates have no account. */
  async function loadUsers() {
    try {
      const { users } = await api.getUsers();
      setUsers(users || []);
    } catch (err: any) {
      console.error('Failed to load users:', err);
    }
  }

  async function loadVotes() {
    if (!selectedElectionId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { votes } = await api.getVotes(selectedElectionId);
      setVotes(votes || []);
    } catch (err: any) {
      console.error('Failed to load votes:', err);
      setError('Failed to load votes: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  function openDeleteDialog(ballot: Ballot) {
    setBallotToDelete(ballot);
    setDeleteReason('');
    setDeleteReasonPreset('');
    setCustomDeleteReason('');
    setShowDeleteDialog(true);
  }

  async function handleDeleteVote() {
    // Build the final reason from preset + custom
    const finalReason = deleteReasonPreset === 'other' 
      ? customDeleteReason.trim()
      : deleteReasonPreset + (customDeleteReason.trim() ? ` - ${customDeleteReason.trim()}` : '');
    
    if (!ballotToDelete || !finalReason) {
      setError('Please select a reason for deleting this vote');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await api.revokeBallot(
        ballotToDelete.election_id,
        ballotToDelete.voter_id,
        finalReason
      );

      setSuccess('Vote deleted successfully!');
      setShowDeleteDialog(false);
      setBallotToDelete(null);
      setDeleteReason('');
      setDeleteReasonPreset('');
      setCustomDeleteReason('');
      loadVotes();
    } catch (err: any) {
      console.error('Failed to delete vote:', err);
      setError('Failed to delete vote: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  function getEmployeeName(employeeId: string): string {
    const employee = employees.find(e => e.id === employeeId);
    return employee ? employee.name : 'Unknown';
  }

  async function handleExportVotes() {
    if (!selectedElectionId) return;
    
    try {
      const data = await api.exportResults(selectedElectionId);
      
      // Create CSV content
      const election = elections.find(e => e.id === selectedElectionId);
      const electionTitle = election?.title || 'Election';
      
      // Download as JSON
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${electionTitle.replace(/\s+/g, '_')}_results.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setSuccess('Election results exported successfully!');
    } catch (err: any) {
      console.error('Failed to export results:', err);
      setError('Failed to export results: ' + err.message);
    }
  }

  const activeVotes = votes.filter(v => !v.revoked);
  const revokedVotes = votes.filter(v => v.revoked);

  // Filter elections based on search
  const filteredElections = elections.filter(election =>
    election.title.toLowerCase().includes(electionSearch.toLowerCase()) ||
    new Date(election.start_time).toLocaleDateString().includes(electionSearch)
  );

  // Filter votes based on voter search
  const filteredActiveVotes = activeVotes.filter(ballot =>
    ballot.voter?.name.toLowerCase().includes(voterSearch.toLowerCase()) ||
    ballot.voter?.email.toLowerCase().includes(voterSearch.toLowerCase())
  );

  const filteredRevokedVotes = revokedVotes.filter(ballot =>
    ballot.voter?.name.toLowerCase().includes(voterSearch.toLowerCase()) ||
    ballot.voter?.email.toLowerCase().includes(voterSearch.toLowerCase())
  );

  /* Who still owes a vote. Worked out here from data the screen already has —
     the ballot's own candidate list, minus everyone with a counting ballot.
     Nothing new is asked of the server and nothing about the vote changes.

     Email is the join key, not id: employees converted from a user account
     share that user's id, but an admin-created employee gets a fresh UUID, so
     matching on id alone quietly misses people. Match on either. */
  const selectedElection = elections.find(e => e.id === selectedElectionId);
  // The server refuses result exports while a vote is live; mirror that here
  // so the button explains itself instead of failing.
  const exportSealed = !!selectedElection && new Date(selectedElection.end_time) > new Date();

  const votedIds = new Set(activeVotes.map(b => b.voter_id).filter(Boolean));
  const votedEmails = new Set(
    activeVotes.map(b => b.voter?.email?.toLowerCase()).filter(Boolean) as string[]
  );
  const accountEmails = new Set(
    users.map(u => u.email?.toLowerCase()).filter(Boolean) as string[]
  );

  /* Scoped to the people on the ballot, deliberately — not to everyone who
     holds an account and could vote. An account holder who isn't standing as a
     candidate never appears here and is never reminded. See "Still to vote
     means candidates, not all voters" in docs/architecture.md before widening
     this; the company-wide blast on the Elections tab is the other case.

     An older election may predate the eligibility field, in which case every
     employee was on the ballot — fall back to that rather than claiming nobody
     was standing. */
  const ballotCandidates = selectedElection?.eligible_employees?.length
    ? selectedElection.eligible_employees
        .map(id => employees.find(e => e.id === id))
        .filter(Boolean)
    : employees;

  const nonVoters = ballotCandidates.filter(
    (e: any) => !votedIds.has(e.id) && !(e.email && votedEmails.has(e.email.toLowerCase()))
  );

  const filteredNonVoters = nonVoters.filter((e: any) =>
    (e.name || '').toLowerCase().includes(voterSearch.toLowerCase()) ||
    (e.email || '').toLowerCase().includes(voterSearch.toLowerCase())
  );

  /* Someone with no sign-in can't cast a ballot however hard you chase them.
     Only claim that when the roster actually loaded. */
  const hasAccount = (e: any) =>
    users.length === 0 || (!!e.email && accountEmails.has(e.email.toLowerCase()));

  /* Who a reminder could actually reach: still to vote, has an address, has a
     way in. Mailing the other two groups would be a message nobody can act on.
     Deduplicated by address, because one person can hold two employee rows and
     one reminder each is plenty. */
  const remindable = nonVoters.filter((e: any) => e.email && hasAccount(e));
  const remindableByEmail = new Map<string, any>();
  for (const e of remindable) {
    const key = e.email.toLowerCase();
    if (!remindableByEmail.has(key)) remindableByEmail.set(key, e);
  }
  const reminderRecipients = [...remindableByEmail.entries()]
    .filter(([email]) => !excludedFromReminder.has(email))
    .map(([, employee]) => employee);

  const isReminding = (e: any) =>
    !!e.email && !excludedFromReminder.has(e.email.toLowerCase());

  function toggleReminder(employee: any) {
    const key = employee.email?.toLowerCase();
    if (!key) return;
    setExcludedFromReminder(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function setAllReminders(on: boolean) {
    setExcludedFromReminder(
      on ? new Set() : new Set(remindableByEmail.keys())
    );
  }

  async function handleSendReminders() {
    if (!selectedElectionId || reminderRecipients.length === 0) return;

    setSendingReminder(true);
    setError(null);
    setSuccess(null);
    setReminderResult(null);

    try {
      const result = await api.remindNonVoters(
        selectedElectionId,
        reminderRecipients.map((e: any) => e.email)
      );
      setReminderResult(describeSendResult(result, { audience: 'still to vote' }));
      setShowRemindDialog(false);
    } catch (err: any) {
      setReminderResult({
        tone: 'error',
        title: err.message || 'The reminder request never reached the server.',
      });
      setShowRemindDialog(false);
    } finally {
      setSendingReminder(false);
    }
  }

  // Group elections by status
  const now = new Date();
  const activeElections = filteredElections.filter(e => 
    new Date(e.start_time) <= now && new Date(e.end_time) >= now
  );
  const upcomingElections = filteredElections.filter(e => 
    new Date(e.start_time) > now
  );
  const pastElections = filteredElections.filter(e => 
    new Date(e.end_time) < now
  );

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

      {/* No heading here on purpose — the tab header above already says what
          this screen is, and repeating it just pushes the search further down. */}
      <div className="space-y-4">
        {/* A plain note, not an alert. Nothing has gone wrong; this is simply
            how the ballot works, so it shouldn't wear a warning colour. */}
        <p className="rounded-xl bg-muted/50 px-4 py-3 text-sm text-muted-foreground text-pretty inset-ring-1 inset-ring-border">
          Ballots stay anonymous. You can see who voted and remove a vote if you need to — but never who they picked.
        </p>

          {/* Search/Select Combo */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search elections by name or date"
                value={electionSearch}
                onChange={(e) => setElectionSearch(e.target.value)}
                className="h-11 pl-9"
              />
            </div>

            {/* Compact Results Dropdown */}
            {electionSearch && (
              <div className="border border-border rounded-xl bg-card max-h-64 overflow-y-auto">
                {filteredElections.length > 0 ? (
                  <div className="divide-y divide-border">
                    {filteredElections.slice(0, 50).map(election => {
                      const start = new Date(election.start_time);
                      const end = new Date(election.end_time);
                      const now = new Date();
                      const isActive = start <= now && end >= now;
                      const isUpcoming = start > now;
                      
                      return (
                        <button
                          key={election.id}
                          onClick={() => {
                            setSelectedElectionId(election.id);
                            setElectionSearch('');
                          }}
                          className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors flex items-center justify-between gap-3 ${
                            selectedElectionId === election.id ? 'bg-primary/5' : ''
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{election.title}</div>
                            <div className="text-xs text-muted-foreground">
                              {start.toLocaleDateString()} - {end.toLocaleDateString()}
                            </div>
                          </div>
                          {isActive && (
                            <span className="flex items-center gap-1.5 text-xs text-success shrink-0">
                              <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse"></span>
                              Active
                            </span>
                          )}
                          {isUpcoming && (
                            <span className="text-xs text-info shrink-0">
                              Upcoming
                            </span>
                          )}
                        </button>
                      );
                    })}
                    {filteredElections.length > 50 && (
                      <div className="px-4 py-3 text-xs text-muted-foreground text-center bg-muted/30">
                        Showing first 50 of {filteredElections.length} results. Keep typing to narrow down.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No elections match "{electionSearch}"
                  </div>
                )}
              </div>
            )}

            {/* Currently Selected Election */}
            {selectedElectionId && !electionSearch && (
              <div className="rounded-xl bg-primary/8 p-4 inset-ring-1 inset-ring-primary/25">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="mb-1 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Now viewing</div>
                    <div className="font-semibold">
                      {elections.find(e => e.id === selectedElectionId)?.title}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {elections.find(e => e.id === selectedElectionId) && (
                        <>
                          {new Date(elections.find(e => e.id === selectedElectionId)!.start_time).toLocaleDateString()} - {new Date(elections.find(e => e.id === selectedElectionId)!.end_time).toLocaleDateString()}
                        </>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowElectionModal(true)}
                    className="text-xs shrink-0"
                  >
                    Change
                  </Button>
                </div>
              </div>
            )}

            {!selectedElectionId && !electionSearch && (
              <div className="rounded-2xl border border-dashed border-border px-6 py-10 text-center">
                <p className="text-sm text-muted-foreground text-pretty">
                  Pick an election to see who has voted in it.
                </p>
                <Button onClick={() => setShowElectionModal(true)} variant="outline" className="mt-4 h-10">
                  Browse all elections
                </Button>
              </div>
            )}
          </div>
      </div>

      {selectedElectionId && (
        <>
          {/* Same three-up strip as the admin dashboard, so a count means the
              same thing and sits the same way wherever you meet it. */}
          {/* Four across on a wide screen, two-by-two on a phone — a fourth
              column at 375px would squeeze the numbers to nothing. */}
          <div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-border bg-card shadow-e1 sm:grid-cols-4">
            {[
              { label: 'Cast', value: votes.length, tone: '' },
              { label: 'Counting', value: activeVotes.length, tone: 'text-success' },
              { label: 'Yet to vote', value: nonVoters.length, tone: nonVoters.length > 0 ? 'text-warning' : 'text-success' },
              { label: 'Removed', value: revokedVotes.length, tone: 'text-destructive' },
            ].map(({ label, value, tone }, i) => (
              <div
                key={label}
                className={`border-border p-4 sm:border-t-0 sm:p-5 ${i % 2 === 1 ? 'border-l' : ''} ${i >= 2 ? 'border-t' : ''} ${i > 0 ? 'sm:border-l' : 'sm:border-l-0'}`}
              >
                <div className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                  {label}
                </div>
                <div className={`mt-2 font-display text-3xl font-semibold tabular-nums tracking-tight ${tone}`}>
                  {value}
                </div>
              </div>
            ))}
          </div>

          {/* One enclosure, hairline rows. A per-voter card each would make a
              turnout of thirty read as thirty unrelated objects. */}
          <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-e1">
            <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div>
                <h3 className="font-display text-base font-semibold tracking-tight">Who voted</h3>
                <p className="mt-1 text-sm text-muted-foreground tabular-nums">
                  {activeVotes.length} ballot{activeVotes.length !== 1 ? 's' : ''} counting
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                {(activeVotes.length > 0 || nonVoters.length > 0) && (
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input
                      placeholder="Search by name or email"
                      value={voterSearch}
                      onChange={(e) => setVoterSearch(e.target.value)}
                      className="h-11 pl-9"
                    />
                  </div>
                )}
                <div className="flex shrink-0 flex-col gap-1 sm:items-end">
                  <Button
                    onClick={handleExportVotes}
                    variant="outline"
                    disabled={exportSealed}
                    title={exportSealed ? 'Results are sealed until voting closes' : undefined}
                    className="h-11 gap-2"
                  >
                    <FileDown className="w-4 h-4" />
                    Export
                  </Button>
                  {exportSealed && (
                    <span className="text-xs text-muted-foreground">
                      Sealed until voting closes
                    </span>
                  )}
                </div>
              </div>
            </div>

            {loading ? (
              <div className="divide-y divide-border" aria-busy="true">
                {[0, 1, 2].map(i => (
                  <div key={i} className="flex items-center justify-between gap-4 p-5 sm:p-6">
                    <div className="min-w-0 flex-1 space-y-2">
                      <Skeleton className="h-4 w-44" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-9 w-20 rounded-lg" />
                  </div>
                ))}
              </div>
            ) : activeVotes.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <p className="font-medium">Nobody has voted yet</p>
                <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground text-pretty">
                  Ballots will appear here the moment the first one comes in.
                </p>
              </div>
            ) : filteredActiveVotes.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <p className="font-medium">No voters match that search</p>
                <p className="mt-1 text-sm text-muted-foreground">Try a different name or email.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredActiveVotes.map((ballot, idx) => (
                  <div
                    key={ballot.voter?.id || ballot.voter?.email || idx}
                    className="flex items-center justify-between gap-4 p-5 transition-colors duration-150 hover:bg-muted/40 animate-fade-in-up sm:p-6"
                    style={{ animationDelay: `${Math.min(idx, 12) * 35}ms` }}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{ballot.voter?.name || 'Unknown voter'}</div>
                      <div className="mt-0.5 truncate text-sm text-muted-foreground">{ballot.voter?.email}</div>
                      <div className="mt-1 text-xs text-muted-foreground tabular-nums">
                        Voted {new Date(ballot.created_at).toLocaleString()}
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDeleteDialog(ballot)}
                      className="h-9 shrink-0 gap-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* The other half of the same question. "Who voted" tells you the
              turnout; this tells you who to go and ask. Same enclosure and the
              same shared search, so the two read as one pair. */}
          <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-e1">
            <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
              <div>
                <h3 className="flex items-center gap-2 font-display text-base font-semibold tracking-tight">
                  <UserX className="w-4 h-4 text-muted-foreground" />
                  Still to vote
                </h3>
                <p className="mt-1 text-sm text-muted-foreground tabular-nums text-pretty">
                  {nonVoters.length} of {ballotCandidates.length} on this ballot {nonVoters.length === 1 ? 'has' : 'have'} not voted
                </p>
                {/* Sits with the count it changes, not under the button — a
                    text link tucked beneath a filled button reads as an
                    afterthought and crowds it. */}
                {remindableByEmail.size > 1 && (
                  <button
                    type="button"
                    onClick={() => setAllReminders(reminderRecipients.length === 0)}
                    className="mt-2 rounded-sm text-xs text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    {reminderRecipients.length === 0 ? 'Select everyone' : 'Clear selection'}
                  </button>
                )}
              </div>

              {/* Chasing these people is the whole reason the list exists, so
                  the way to do it sits in the list's own header rather than on
                  the elections screen, where the only option writes to everyone
                  — including the people who have already voted. */}
              {remindableByEmail.size > 0 && (
                <Button
                  onClick={() => setShowRemindDialog(true)}
                  disabled={reminderRecipients.length === 0 || sendingReminder}
                  className="h-11 w-full shrink-0 gap-2 sm:w-auto"
                >
                  <Bell className="w-4 h-4" aria-hidden="true" />
                  {sendingReminder
                    ? 'Sending…'
                    : `Remind ${reminderRecipients.length} ${reminderRecipients.length === 1 ? 'person' : 'people'}`}
                </Button>
              )}
            </div>

            {/* The outcome sits with the list it came from, not at the top of
                the screen where a send from the bottom of a long page reports
                itself somewhere you aren't looking. */}
            {reminderResult && (
              <div className="border-b border-border p-5 sm:p-6">
                <EmailSendResult result={reminderResult} />
              </div>
            )}

            {loading ? (
              <div className="divide-y divide-border" aria-busy="true">
                {[0, 1, 2].map(i => (
                  <div key={i} className="space-y-2 p-5 sm:p-6">
                    <Skeleton className="h-4 w-44" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                ))}
              </div>
            ) : ballotCandidates.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <p className="font-medium">Nobody is on this ballot</p>
                <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground text-pretty">
                  Add candidates to the election and they will show up here.
                </p>
              </div>
            ) : nonVoters.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <p className="font-medium text-success">Everyone on the ballot has voted</p>
                <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground text-pretty">
                  Nothing left to chase.
                </p>
              </div>
            ) : filteredNonVoters.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <p className="font-medium">Nobody here matches that search</p>
                <p className="mt-1 text-sm text-muted-foreground">Try a different name or email.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredNonVoters.map((employee: any, idx: number) => {
                  /* Only the people a reminder could reach get a tick box. The
                     rest aren't choices to make — there is nowhere to send. */
                  const canRemind = !!employee.email && hasAccount(employee);
                  const rowId = `remind-${employee.id || employee.email || idx}`;
                  /* No address is a different problem from no sign-in, and the
                     fix is different too — say which one it is. */
                  const blocker = !employee.email ? 'No email' : !hasAccount(employee) ? 'No account' : null;

                  return (
                    <div
                      key={employee.id || employee.email || idx}
                      className="flex items-start gap-4 p-5 transition-colors duration-150 hover:bg-muted/40 animate-fade-in-up sm:p-6"
                      style={{ animationDelay: `${Math.min(idx, 12) * 35}ms` }}
                    >
                      {canRemind ? (
                        <Checkbox
                          id={rowId}
                          checked={isReminding(employee)}
                          onCheckedChange={() => toggleReminder(employee)}
                          aria-label={`Include ${employee.name || employee.email} in the reminder`}
                          /* Rows are three lines tall; centring would park the
                             box against the address rather than the name. */
                          className="mt-1 shrink-0"
                        />
                      ) : (
                        /* Holds the column so names stay on one line down the
                           list instead of stepping in and out. */
                        <span className="mt-1 w-4 shrink-0" aria-hidden="true" />
                      )}

                      {/* A plain label, not the UI one: that carries
                          `flex items-center`, which would lay the three lines
                          out side by side instead of stacked. */}
                      <label
                        htmlFor={canRemind ? rowId : undefined}
                        className={`min-w-0 flex-1 ${canRemind ? 'cursor-pointer' : ''}`}
                      >
                        <span className="block truncate font-medium">{employee.name || 'Unnamed candidate'}</span>
                        <span className="mt-0.5 block truncate text-sm text-muted-foreground">
                          {employee.email || 'No email on file'}
                        </span>
                        {employee.role && (
                          <span className="mt-1 block truncate text-xs text-muted-foreground">{employee.role}</span>
                        )}
                      </label>

                      {/* A candidate with no sign-in isn't dragging their feet —
                          they have no way in. Worth saying, so nobody spends a
                          reminder on them. */}
                      {blocker && (
                        <span className="shrink-0 self-center rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground inset-ring-1 inset-ring-border">
                          {blocker}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Removed ballots. Kept visibly separate from the live count so the
              two can never be mistaken for one another. */}
          {revokedVotes.length > 0 && (
            <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-e1">
              <div className="border-b border-border p-5 sm:p-6">
                <h3 className="flex items-center gap-2 font-display text-base font-semibold tracking-tight">
                  <XCircle className="w-4 h-4 text-destructive" />
                  Removed
                </h3>
                <p className="mt-1 text-sm text-muted-foreground tabular-nums">
                  {revokedVotes.length} ballot{revokedVotes.length !== 1 ? 's' : ''} no longer counting
                </p>
              </div>
              <div className="divide-y divide-border">
                {filteredRevokedVotes.map((ballot, idx) => (
                  <div
                    key={ballot.voter?.id || ballot.voter?.email || idx}
                    className="p-5 sm:p-6"
                  >
                    <div className="truncate font-medium text-muted-foreground">{ballot.voter?.name || 'Unknown voter'}</div>
                    <div className="mt-0.5 truncate text-sm text-muted-foreground">{ballot.voter?.email}</div>
                    <div className="mt-2 text-xs text-destructive tabular-nums">
                      Removed {ballot.revoked_at ? new Date(ballot.revoked_at).toLocaleString() : 'at an unknown time'}
                    </div>
                    {ballot.revoke_reason && (
                      <p className="mt-1 text-xs text-muted-foreground text-pretty">
                        Reason: {ballot.revoke_reason}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* Election Selection Modal */}
      <Dialog open={showElectionModal} onOpenChange={setShowElectionModal}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>All elections</DialogTitle>
            <DialogDescription>
              Pick one to see who voted in it.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 overflow-y-auto flex-1 pr-2">
            {/* Active Elections */}
            {activeElections.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-success mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-success rounded-full animate-pulse"></span>
                  Running now ({activeElections.length})
                </h4>
                <div className="space-y-2">
                  {activeElections.map(election => {
                    const start = new Date(election.start_time);
                    const end = new Date(election.end_time);
                    const isSelected = selectedElectionId === election.id;
                    
                    return (
                      <button
                        key={election.id}
                        onClick={() => {
                          setSelectedElectionId(election.id);
                          setShowElectionModal(false);
                        }}
                        className={`w-full rounded-xl border border-border bg-card p-4 text-left transition-colors duration-150 ${
                          isSelected
                            ? 'bg-primary/8 inset-ring-1 inset-ring-primary/30'
                            : 'hover:bg-muted/40'
                        }`}
                      >
                        <div className="font-semibold mb-1">{election.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {start.toLocaleDateString()} - {end.toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-success mt-2">
                          <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse"></span>
                          Open for votes
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Past Elections */}
            {pastElections.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-3">
                  Finished ({pastElections.length})
                </h4>
                <div className="space-y-2">
                  {pastElections.map(election => {
                    const start = new Date(election.start_time);
                    const end = new Date(election.end_time);
                    const isSelected = selectedElectionId === election.id;
                    
                    return (
                      <button
                        key={election.id}
                        onClick={() => {
                          setSelectedElectionId(election.id);
                          setShowElectionModal(false);
                        }}
                        className={`w-full rounded-xl border border-border bg-card p-4 text-left transition-colors duration-150 ${
                          isSelected
                            ? 'bg-primary/8 inset-ring-1 inset-ring-primary/30'
                            : 'hover:bg-muted/40'
                        }`}
                      >
                        <div className="font-semibold mb-1">{election.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {start.toLocaleDateString()} - {end.toLocaleDateString()}
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">
                          Closed
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Upcoming Elections */}
            {upcomingElections.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-info mb-3">
                  Not open yet ({upcomingElections.length})
                </h4>
                <div className="space-y-2">
                  {upcomingElections.map(election => {
                    const start = new Date(election.start_time);
                    const end = new Date(election.end_time);
                    const isSelected = selectedElectionId === election.id;
                    
                    return (
                      <button
                        key={election.id}
                        onClick={() => {
                          setSelectedElectionId(election.id);
                          setShowElectionModal(false);
                        }}
                        className={`w-full rounded-xl border border-border bg-card p-4 text-left transition-colors duration-150 ${
                          isSelected
                            ? 'bg-primary/8 inset-ring-1 inset-ring-primary/30'
                            : 'hover:bg-muted/40'
                        }`}
                      >
                        <div className="font-semibold mb-1">{election.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {start.toLocaleDateString()} - {end.toLocaleDateString()}
                        </div>
                        <div className="mt-2 text-xs text-info">
                          Opens later
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {elections.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No elections found
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t flex-shrink-0">
            <Button variant="outline" onClick={() => setShowElectionModal(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reminder confirmation. Mail to real colleagues shouldn't leave on a
          single click, and the one thing worth checking before it does is the
          list of who gets it — so that's what the dialog shows. */}
      <Dialog open={showRemindDialog} onOpenChange={setShowRemindDialog}>
        <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>
              Remind {reminderRecipients.length} {reminderRecipients.length === 1 ? 'person' : 'people'}?
            </DialogTitle>
            <DialogDescription className="text-pretty">
              Each one gets a single email asking them to vote in “{selectedElection?.title}” before it closes
              {selectedElection ? ` on ${new Date(selectedElection.end_time).toLocaleString()}` : ''}. Nobody who has already
              voted is written to.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="divide-y divide-border overflow-hidden rounded-xl border border-border">
              {reminderRecipients.map((employee: any, idx: number) => (
                <div key={employee.id || employee.email || idx} className="px-4 py-3">
                  <div className="truncate font-medium">{employee.name || 'Unnamed candidate'}</div>
                  <div className="mt-0.5 truncate text-sm text-muted-foreground">{employee.email}</div>
                </div>
              ))}
            </div>

            {/* Say the gap out loud rather than letting the header count and
                the recipient count quietly disagree. */}
            {nonVoters.length > remindableByEmail.size && (
              <p className="mt-4 text-sm text-muted-foreground text-pretty">
                {nonVoters.length - remindableByEmail.size} other{nonVoters.length - remindableByEmail.size === 1 ? '' : 's'} on
                this list can't be emailed — no account or no address on file.
              </p>
            )}
          </div>

          <div className="flex flex-shrink-0 gap-3 border-t border-border pt-4">
            <Button
              variant="outline"
              onClick={() => setShowRemindDialog(false)}
              disabled={sendingReminder}
              className="h-11 flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendReminders}
              disabled={sendingReminder || reminderRecipients.length === 0}
              className="h-11 flex-1 gap-2"
            >
              <Bell className="w-4 h-4" aria-hidden="true" />
              {sendingReminder ? 'Sending…' : 'Send reminder'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Remove this vote?</DialogTitle>
            <DialogDescription className="text-pretty">
              The ballot stops counting and the leaderboard updates straight away. This can't be undone, so a reason is required.
            </DialogDescription>
          </DialogHeader>

          {ballotToDelete && (
            <div className="space-y-5 overflow-y-auto flex-1 pr-2">
              <div className="rounded-xl bg-muted/50 p-4 inset-ring-1 inset-ring-border">
                <div className="font-medium">{ballotToDelete.voter?.name}</div>
                <div className="mt-0.5 text-sm text-muted-foreground">{ballotToDelete.voter?.email}</div>
              </div>

              <div>
                <Label className="mb-2 block">Why is it being removed?</Label>
                {/* Hairline-divided rows rather than floating pills — the whole
                    group is one decision, so it should read as one object. */}
                <RadioGroup value={deleteReasonPreset} onValueChange={setDeleteReasonPreset}>
                  <div className="divide-y divide-border overflow-hidden rounded-xl border border-border">
                    {[
                      { value: 'Duplicate vote', id: 'duplicate', label: 'Duplicate vote' },
                      { value: 'Voter requested removal', id: 'voter-request', label: 'Voter asked for it to be removed' },
                      { value: 'Error correction', id: 'error', label: 'Correcting a mistake' },
                      { value: 'Policy violation', id: 'policy', label: 'Broke a policy' },
                      { value: 'Invalid submission', id: 'invalid', label: 'Invalid submission' },
                      { value: 'other', id: 'other', label: 'Something else' },
                    ].map(({ value, id, label }) => (
                      <div
                        key={id}
                        className={`flex items-center gap-3 px-4 py-3 transition-colors duration-150 ${
                          deleteReasonPreset === value ? 'bg-primary/8' : 'hover:bg-muted/40'
                        }`}
                      >
                        <RadioGroupItem value={value} id={id} />
                        <Label htmlFor={id} className="flex-1 cursor-pointer font-normal">{label}</Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="custom-reason">
                  More detail {deleteReasonPreset === 'other' ? '(required)' : '(optional)'}
                </Label>
                <Textarea
                  id="custom-reason"
                  value={customDeleteReason}
                  onChange={(e) => setCustomDeleteReason(e.target.value)}
                  placeholder={deleteReasonPreset === 'other' ? 'Say what happened' : 'Anything worth recording alongside this'}
                  className="mt-1.5 min-h-[80px] max-h-[120px] resize-none"
                />
              </div>
            </div>
          )}

          <div className="flex flex-shrink-0 gap-3 border-t border-border pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setDeleteReasonPreset('');
                setCustomDeleteReason('');
              }}
              disabled={loading}
              className="h-11 flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteVote}
              disabled={
                loading ||
                !deleteReasonPreset ||
                (deleteReasonPreset === 'other' && !customDeleteReason.trim())
              }
              className="h-11 flex-1"
            >
              {loading ? 'Removing…' : 'Remove vote'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
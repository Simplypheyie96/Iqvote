import { useState, useEffect, useCallback } from 'react';
import { Clock, CheckCircle2, AlertCircle, CalendarClock, Hourglass, Lock } from 'lucide-react';
import { Employee, Election, BallotSelection } from '../types';
import { EmployeeCard } from './EmployeeCard';
import { RankMedal, RANK_LABEL, RANK_POINTS } from './RankMedal';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { toast } from 'sonner';
import { api } from '../utils/api';
import confetti from 'canvas-confetti';
import { LoadingSpinner } from './LoadingSpinner';

interface VotingPageProps {
  currentUser: Employee;
  election: Election | null;
  employees: Employee[];
  onVoteSubmitted: () => void;
}

/**
 * The one shape every "you can't vote right now" screen takes: an icon, a
 * sentence naming what happened, and the scoring rule so the page still
 * teaches something instead of being a dead end. Closed, not-yet-open and
 * no-election-at-all differ only in wording.
 */
function VoteNotice({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-14 sm:px-6 sm:py-20">
      <div className="rounded-2xl border border-border bg-card px-6 py-12 text-center shadow-e1 sm:px-12">
        <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full bg-muted text-muted-foreground">
          {icon}
        </div>
        <h1 className="font-display text-xl font-semibold tracking-tight">{title}</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground text-pretty">
          {body}
        </p>

        <div className="mt-9 border-t border-border pt-6">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            How voting works
          </p>
          <div className="mt-4 flex items-center justify-center gap-2.5">
            {[1, 2, 3].map((rank) => (
              <span
                key={rank}
                className="inline-flex items-center gap-2 rounded-full bg-muted/70 py-1.5 pr-3.5 pl-1.5 text-xs font-medium inset-ring-1 inset-ring-border/60"
              >
                <RankMedal rank={rank} size="sm" />
                {RANK_POINTS[rank]} pts
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function VotingPage({ currentUser, election, employees, onVoteSubmitted }: VotingPageProps) {
  const [selections, setSelections] = useState<Map<number, string>>(new Map());
  const [reasons, setReasons] = useState<Map<number, string>>(new Map()); // New: Optional reasons
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [hasVoted, setHasVoted] = useState(false);
  const [rankFeedback, setRankFeedback] = useState<Map<number, string>>(new Map());
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [pastElection, setPastElection] = useState<Election | null>(null);

  // Filter employees to only show eligible ones for this election
  const eligibleEmployees = election?.eligible_employees && election.eligible_employees.length > 0
    ? employees.filter(emp => election.eligible_employees.includes(emp.id))
    : employees;

  const loadMostRecentElection = useCallback(async () => {
    try {
      const { elections } = await api.getElections();
      if (elections && elections.length > 0) {
        // Sort by end_time descending to get most recent
        const sorted = elections.sort((a, b) => new Date(b.end_time).getTime() - new Date(a.end_time).getTime());
        setPastElection(sorted[0]);
      }
    } catch (err) {
      console.error('Failed to load past elections:', err);
    }
  }, []);

  const loadExistingBallot = useCallback(async () => {
    if (!election) return;
    
    try {
      const { ballot } = await api.getBallot(election.id);
      if (ballot && !ballot.revoked) {
        const newSelections = new Map<number, string>();
        ballot.selections.forEach((sel: BallotSelection) => {
          newSelections.set(sel.rank, sel.employee_id);
        });
        setSelections(newSelections);
        setHasVoted(true);
        setShowSuccess(true);
      }
    } catch (err) {
      console.error('Failed to load ballot:', err);
    }
  }, [election]);

  const updateTimeRemaining = useCallback(() => {
    if (!election) return;
    
    const now = new Date();
    const end = new Date(election.end_time);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) {
      setTimeRemaining('Voting has ended');
      return;
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) {
      setTimeRemaining(`${days}d ${hours}h remaining`);
    } else if (hours > 0) {
      setTimeRemaining(`${hours}h ${minutes}m remaining`);
    } else {
      setTimeRemaining(`${minutes}m remaining`);
    }
  }, [election]);

  useEffect(() => {
    if (election) {
      loadExistingBallot();
      updateTimeRemaining();
      const interval = setInterval(updateTimeRemaining, 1000);
      return () => clearInterval(interval);
    } else {
      // If no active election, fetch the most recent one
      loadMostRecentElection();
    }
  }, [election, loadExistingBallot, loadMostRecentElection, updateTimeRemaining]);

  function handleSelectRank(employeeId: string, rank: number) {
    setError(null);
    setSuccess(null);
    
    const newSelections = new Map(selections);
    const newFeedback = new Map(rankFeedback);
    
    // Check if this employee is already selected for another rank
    let previousRank: number | null = null;
    for (const [selectedRank, selectedId] of newSelections.entries()) {
      if (selectedId === employeeId && selectedRank !== rank) {
        previousRank = selectedRank;
        newSelections.delete(selectedRank);
        break;
      }
    }
    
    // Check if the rank is already taken by another employee
    const currentOccupant = newSelections.get(rank);
    if (currentOccupant && currentOccupant !== employeeId) {
      const occupantName = employees.find(e => e.id === currentOccupant)?.name;
      newFeedback.set(rank, `Moved from ${occupantName} to selected employee`);
      setTimeout(() => {
        setRankFeedback(new Map());
      }, 3000);
    }
    
    // Toggle selection
    if (newSelections.get(rank) === employeeId) {
      newSelections.delete(rank);
      newFeedback.delete(rank);
    } else {
      newSelections.set(rank, employeeId);
      if (previousRank) {
        newFeedback.set(rank, `Moved from ${previousRank}${previousRank === 1 ? 'st' : previousRank === 2 ? 'nd' : 'rd'} place`);
        setTimeout(() => {
          setRankFeedback(new Map());
        }, 3000);
      }
    }
    
    setSelections(newSelections);
    setRankFeedback(newFeedback);
    setShowConfirmation(false);
    
    // Update validation errors
    validateSelections(newSelections);
  }
  
  function validateSelections(currentSelections: Map<number, string>) {
    const errors: string[] = [];
    
    if (currentSelections.size === 0) {
      errors.push('Please select at least one employee');
    } else if (currentSelections.size < 3) {
      const missing = [];
      if (!currentSelections.has(1)) missing.push('1st place');
      if (!currentSelections.has(2)) missing.push('2nd place');
      if (!currentSelections.has(3)) missing.push('3rd place');
      errors.push(`Missing: ${missing.join(', ')}`);
    }
    
    setValidationErrors(errors);
  }

  function getSelectedRank(employeeId: string): number | null {
    for (const [rank, id] of selections.entries()) {
      if (id === employeeId) return rank;
    }
    return null;
  }

  function isRankTaken(rank: number, employeeId: string): boolean {
    const selected = selections.get(rank);
    return selected !== undefined && selected !== employeeId;
  }

  function canSubmit(): boolean {
    return selections.size === 3;
  }

  function getConfirmationDetails() {
    const details = [];
    const pointsMap = { 1: 5, 2: 3, 3: 2 };
    
    for (let rank = 1; rank <= 3; rank++) {
      const employeeId = selections.get(rank);
      if (employeeId) {
        const employee = employees.find(e => e.id === employeeId);
        if (employee) {
          details.push({
            rank,
            employee,
            points: pointsMap[rank as 1 | 2 | 3]
          });
        }
      }
    }
    
    return details;
  }

  async function handleSubmit() {
    if (!election || !canSubmit()) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const ballotSelections: BallotSelection[] = [
        { rank: 1, employee_id: selections.get(1)!, points: 5, reason: reasons.get(1) || undefined },
        { rank: 2, employee_id: selections.get(2)!, points: 3, reason: reasons.get(2) || undefined },
        { rank: 3, employee_id: selections.get(3)!, points: 2, reason: reasons.get(3) || undefined },
      ];
      
      await api.submitBallot(election.id, ballotSelections);
      
      setSuccess('Your ballot has been submitted and locked! Thank you for voting.');
      setHasVoted(true);
      setShowConfirmation(false);
      onVoteSubmitted();
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (err: any) {
      setError(err.message || 'Failed to submit ballot');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!election) {
    /* The old version said "there is nothing to vote on" three times over —
       an alert, a greyed-out mock ballot, and a large empty panel. One clear
       statement, plus the rule for next time, is enough. */
    return (
      <VoteNotice
        icon={<CalendarClock className="h-7 w-7" aria-hidden="true" />}
        title={pastElection ? 'Voting has closed' : 'No election running'}
        body={
          pastElection
            ? `“${pastElection.title}” finished on ${new Date(pastElection.end_time).toLocaleDateString(undefined, { day: 'numeric', month: 'long' })}. The results are on the leaderboard.`
            : 'There is no open election right now. An admin will start the next one — you will be emailed when it opens.'
        }
      />
    );
  }

  const now = new Date();
  const start = new Date(election.start_time);
  const end = new Date(election.end_time);
  const isActive = start <= now && now <= end;
  const hasEnded = now > end;
  
  if (!isActive) {
    return hasEnded ? (
      <VoteNotice
        icon={<CalendarClock className="h-7 w-7" aria-hidden="true" />}
        title="Voting has closed"
        body={`“${election.title}” finished on ${end.toLocaleDateString(undefined, { day: 'numeric', month: 'long' })}. The results are on the leaderboard.`}
      />
    ) : (
      <VoteNotice
        icon={<Hourglass className="h-7 w-7" aria-hidden="true" />}
        title="Voting opens soon"
        body={`“${election.title}” opens on ${start.toLocaleDateString(undefined, { day: 'numeric', month: 'long' })} at ${start.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}. Come back then to rank your top three.`}
      />
    );
  }

  const candidates = eligibleEmployees.filter(e => e.active);
  /* Which places are already spoken for — passed down so a row can show that
     tapping "1st" will move it rather than take a free slot. */
  const takenRanks = [1, 2, 3].filter(r => selections.has(r));

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 max-lg:pb-28">
      {/* Header */}
      <div className="flex flex-col gap-3 mb-6 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-xl sm:text-2xl font-semibold tracking-tight truncate" id="voting-title">
            {election.title}
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5 text-pretty" id="voting-description">
            Rank your top three colleagues. Your ballot locks once submitted.
          </p>
        </div>

        <div className="shrink-0 inline-flex items-center gap-2 self-start rounded-full border border-border bg-muted/40 px-3 py-1.5 text-sm" role="status" aria-live="polite">
          <Clock className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
          <span className="font-medium tabular-nums whitespace-nowrap" aria-label={`Time remaining: ${timeRemaining}`}>{timeRemaining}</span>
        </div>
      </div>

      {/* A locked ballot is a state, not an alert — it doesn't get dismissed
          and it isn't news, so it reads as a quiet standing banner. */}
      {hasVoted && (
        <div className="mb-5 flex items-center gap-3 rounded-xl bg-primary/[0.07] px-4 py-3 inset-ring-1 inset-ring-primary/20">
          <Lock className="h-4 w-4 shrink-0 text-primary-strong" aria-hidden="true" />
          <p className="text-sm text-pretty">
            <span className="font-medium">Your ballot is in.</span>{' '}
            <span className="text-muted-foreground">
              Votes are final, so this one can&apos;t be changed. Results appear on the leaderboard when voting closes.
            </span>
          </p>
        </div>
      )}

      {error && (
        <Alert variant="destructive" className="mb-4" role="alert" aria-live="assertive">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid lg:grid-cols-[1fr_340px] gap-6 lg:gap-8 items-start">
        {/* Left: candidate list. Ordered second on a phone so the ballot —
            the thing that tells you where you are — isn't buried under a
            list that can run to dozens of rows. */}
        <div className="order-2 lg:order-1">
          <div className="flex items-baseline justify-between gap-3 mb-2.5 px-1">
            <h2 className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Candidates
              <span className="ml-2 tabular-nums text-muted-foreground/70">{candidates.length}</span>
            </h2>
            {/* The scoring rule, on the screen where it applies. It used to
                live only in a tooltip on the rank buttons. */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground max-sm:hidden">
              {[1, 2, 3].map(rank => (
                <span key={rank} className="inline-flex items-center gap-1.5">
                  <RankMedal rank={rank} size="sm" />
                  <span className="tabular-nums">{RANK_POINTS[rank]} pts</span>
                  {rank < 3 && <span className="ml-1 text-border">·</span>}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card divide-y divide-border" role="list" aria-labelledby="voting-title">
            {candidates.length === 0 ? (
              <div className="text-center py-14 px-4">
                <h3 className="text-sm font-medium mb-1">No candidates yet</h3>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                  No employees are eligible for this election yet. Contact an administrator to add them.
                </p>
              </div>
            ) : (
              candidates.map((employee, idx) => {
                const selectedRank = getSelectedRank(employee.id);
                return (
                  <div key={employee.id} role="listitem" className="px-2 py-1.5">
                    <EmployeeCard
                      employee={employee}
                      index={idx}
                      selectedRank={selectedRank}
                      takenRanks={takenRanks}
                      onSelectRank={(rank) => handleSelectRank(employee.id, rank)}
                      disabled={hasVoted}
                      reason={selectedRank ? reasons.get(selectedRank) : undefined}
                      onReasonChange={selectedRank && !hasVoted ? (reason) => {
                        const newReasons = new Map(reasons);
                        if (reason.trim()) {
                          newReasons.set(selectedRank, reason);
                        } else {
                          newReasons.delete(selectedRank);
                        }
                        setReasons(newReasons);
                      } : undefined}
                    />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right column. `contents` on a phone dissolves the wrapper so its two
            cards become grid items in their own right — that's what lets the
            ballot sit above the candidate list while the reference material
            drops below it. On desktop it re-forms as a sticky column. */}
        <aside className="max-lg:contents lg:order-2 lg:sticky lg:top-24">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-e1 max-lg:order-1 sm:p-5" role="status" aria-live="polite" aria-label={`Ballot: ${selections.size} of 3 selected`}>
            <div className="flex items-baseline justify-between gap-3 mb-3.5">
              <h2 className="text-sm font-semibold">Your ballot</h2>
              {/* A count, not a progress bar — three slots is small enough to
                  read at a glance without a second visual language. */}
              <span className="text-xs tabular-nums text-muted-foreground">
                <span className={selections.size === 3 ? 'font-semibold text-primary-strong' : 'font-semibold text-foreground'}>
                  {selections.size}
                </span>
                {' of 3'}
              </span>
            </div>

            <div className="space-y-2">
              {[1, 2, 3].map(rank => {
                const selected = selections.get(rank);
                const employee = selected ? employees.find(e => e.id === selected) : null;
                const initials = employee
                  ? employee.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                  : '';
                return (
                  <div
                    key={rank}
                    className={`flex items-center gap-3 rounded-xl px-2.5 py-2 transition-colors duration-200 ${
                      employee
                        ? 'bg-muted/50 inset-ring-1 inset-ring-border'
                        : 'border border-dashed border-border'
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      {employee ? (
                        <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-muted text-[10px] font-medium text-muted-foreground inset-ring-1 inset-ring-border">
                          {employee.image_url ? (
                            <img src={employee.image_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            initials
                          )}
                        </div>
                      ) : (
                        <div className="h-9 w-9 rounded-full border border-dashed border-border" aria-hidden="true" />
                      )}
                      {/* The medal rides the avatar rather than sitting in its
                          own column, so the row stays two objects wide at
                          340px instead of three. */}
                      <RankMedal
                        rank={rank}
                        size="xs"
                        className={`absolute -right-1 -bottom-1 ring-2 ring-card ${employee ? '' : 'opacity-40 saturate-50'}`}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className={`truncate text-sm ${employee ? 'font-medium' : 'text-muted-foreground'}`}>
                        {employee ? employee.name : `${RANK_LABEL[rank]} place`}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {employee ? `${RANK_LABEL[rank]} · ${RANK_POINTS[rank]} pts` : 'Not picked yet'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* On a phone this button is duplicated by the docked bar at the
                bottom of the screen, so it stands down there. */}
            {!hasVoted && (
              <Button
                onClick={() => setShowConfirmation(true)}
                disabled={!canSubmit()}
                className="mt-4 h-11 w-full max-lg:hidden"
                aria-label="Review and submit your ballot"
              >
                Review &amp; submit
              </Button>
            )}
            <p className="mt-3 text-center text-xs text-muted-foreground text-pretty">
              {hasVoted
                ? 'Your ballot is locked.'
                : canSubmit()
                ? 'Nothing is sent until you confirm.'
                : 'Pick a 1st, 2nd and 3rd to continue.'}
            </p>
          </div>

          {/* How to vote */}
          <div className="rounded-2xl border border-border bg-card p-4 max-lg:order-3 lg:mt-4 sm:p-5" role="region" aria-labelledby="how-to-vote-heading">
            <h2 className="text-sm font-semibold mb-3" id="how-to-vote-heading">How to vote</h2>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li className="flex gap-2.5">
                <span className="text-muted-foreground/60 flex-shrink-0" aria-hidden="true">1.</span>
                <span>
                  Use the <span className="text-foreground font-medium">1st / 2nd / 3rd</span> buttons on a colleague&apos;s
                  row to rank them — worth <span className="text-foreground font-medium">5</span>,{' '}
                  <span className="text-foreground font-medium">3</span> and{' '}
                  <span className="text-foreground font-medium">2</span> points.
                </span>
              </li>
              <li className="flex gap-2.5">
                <span className="text-muted-foreground/60 flex-shrink-0" aria-hidden="true">2.</span>
                <span>Pick <span className="text-foreground font-medium">three different people</span> — one for each place.</span>
              </li>
              <li className="flex gap-2.5">
                <span className="text-muted-foreground/60 flex-shrink-0" aria-hidden="true">3.</span>
                <span>You can vote for yourself if you want to.</span>
              </li>
              <li className="flex gap-2.5">
                <span className="text-muted-foreground/60 flex-shrink-0" aria-hidden="true">4.</span>
                <span>Adding a note is optional, and always anonymous.</span>
              </li>
            </ul>
            <p className="text-xs text-foreground/80 mt-3 pt-3 border-t border-border">
              Once you submit, your vote is final and cannot be changed.
            </p>
          </div>
        </aside>
      </div>

      {/* Docked submit bar — phones only. The ballot card scrolls away above a
          long candidate list, and asking someone to scroll back up to a button
          they can't see is the single most common way this flow was abandoned.
          The page reserves space for it with pb-28. */}
      {!hasVoted && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/85 px-4 pt-3 backdrop-blur-xl lg:hidden [padding-bottom:calc(0.75rem+env(safe-area-inset-bottom))]">
          <div className="mx-auto flex max-w-6xl items-center gap-3">
            <div className="flex items-center gap-1.5" aria-hidden="true">
              {[1, 2, 3].map(rank => (
                <RankMedal
                  key={rank}
                  rank={rank}
                  size="sm"
                  className={selections.has(rank) ? '' : 'opacity-30 saturate-0'}
                />
              ))}
            </div>
            <Button
              onClick={() => setShowConfirmation(true)}
              disabled={!canSubmit()}
              className="h-11 flex-1"
              aria-label="Review and submit your ballot"
            >
              {canSubmit() ? 'Review & submit' : `${3 - selections.size} more to pick`}
            </Button>
          </div>
        </div>
      )}

      <Dialog open={showConfirmation} onOpenChange={(open) => { if (!open) setShowConfirmation(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Confirm your ballot</DialogTitle>
            <DialogDescription>
              Review your selections carefully — once submitted, your vote is locked and cannot be changed.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2" role="list" aria-label="Your ballot selections">
            {getConfirmationDetails().map(({ rank, employee, points }) => {
              const initials = employee.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
              return (
                <div key={rank} className="flex items-center gap-3 rounded-xl bg-muted/50 p-2.5 inset-ring-1 inset-ring-border" role="listitem">
                  <div className="relative flex-shrink-0">
                    <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-muted text-xs font-medium text-muted-foreground inset-ring-1 inset-ring-border">
                      {employee.image_url ? (
                        <img src={employee.image_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        initials
                      )}
                    </div>
                    <RankMedal rank={rank} size="sm" className="absolute -right-1.5 -bottom-1.5 ring-2 ring-card" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{employee.name}</div>
                    <div className="truncate text-xs text-muted-foreground">{employee.role}</div>
                  </div>
                  <div className="whitespace-nowrap text-sm font-medium text-muted-foreground">
                    <span className="text-foreground">{RANK_LABEL[rank]}</span>
                    <span className="mx-1.5 text-border">·</span>
                    <span className="tabular-nums">{points} pts</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* One line, in the dialog's own voice, instead of a red alert box.
              Nothing has gone wrong — the person is about to do the intended
              thing, and dressing that in an error colour teaches them to
              ignore the colour when something actually is wrong. */}
          <p className="flex items-start gap-2.5 rounded-xl bg-muted/50 px-3.5 py-3 text-sm text-muted-foreground text-pretty inset-ring-1 inset-ring-border">
            <Lock className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
            <span>
              <span className="font-medium text-foreground">This is final.</span> Once submitted your
              ballot locks and can&apos;t be changed or withdrawn.
            </span>
          </p>

          <DialogFooter className="gap-3 sm:gap-3">
            <Button
              variant="outline"
              onClick={() => setShowConfirmation(false)}
              disabled={isSubmitting}
              className="h-11 flex-1"
              aria-label="Go back to edit your selections"
            >
              Back
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="h-11 flex-1 gap-2"
              aria-label={isSubmitting ? 'Submitting your ballot' : 'Confirm and submit your ballot'}
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" inline />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                  Confirm &amp; submit
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      <Dialog open={!!success} onOpenChange={(open) => { if (!open) setSuccess(null); }}>
        <DialogContent className="max-w-sm text-center">
          <div className="mx-auto mt-2 grid h-16 w-16 place-items-center rounded-full bg-primary/15 animate-pop inset-ring-1 inset-ring-primary/25" aria-hidden="true">
            <CheckCircle2 className="h-8 w-8 text-primary-strong" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-center font-display text-xl tracking-tight">Thanks for voting</DialogTitle>
            <DialogDescription className="text-center text-pretty">
              Your ballot is recorded and locked. Results go up on the leaderboard when this
              election closes.
            </DialogDescription>
          </DialogHeader>

          {/* The ballot, one last time — a receipt. Closing a dialog that only
              said "done" left people unsure what had actually been sent. */}
          <div className="flex items-center justify-center gap-2" aria-hidden="true">
            {getConfirmationDetails().map(({ rank, employee }) => (
              <span
                key={rank}
                className="inline-flex max-w-[9rem] items-center gap-1.5 rounded-full bg-muted/70 py-1 pr-3 pl-1 text-xs font-medium inset-ring-1 inset-ring-border/60"
              >
                <RankMedal rank={rank} size="sm" />
                <span className="truncate">{employee.name.split(' ')[0]}</span>
              </span>
            ))}
          </div>

          <Button onClick={() => setSuccess(null)} className="h-11 w-full" aria-label="Close success message">
            Done
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
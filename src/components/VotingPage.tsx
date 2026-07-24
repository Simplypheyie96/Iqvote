import { useState, useEffect, useCallback } from 'react';
import { Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Employee, Election, BallotSelection } from '../types';
import { EmployeeCard } from './EmployeeCard';
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
    // Show empty state with layout structure
    return (
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gradient mb-2">
                {pastElection ? pastElection.title : 'Employee of the Month Voting'}
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                Vote for your colleagues — make every vote count
              </p>
            </div>
            
            {pastElection && (
              <div className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-muted/50 border border-border self-start sm:self-auto">
                <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div className="text-sm">
                  <div className="text-xs text-muted-foreground">Election ended</div>
                  <div className="font-semibold whitespace-nowrap text-muted-foreground">
                    {new Date(pastElection.end_time).toLocaleDateString()}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {pastElection 
                ? 'This election has ended. View the results on the Leaderboard or wait for the next election to begin.'
                : 'No active election at the moment. Contact your administrator to create an election.'}
            </AlertDescription>
          </Alert>
        </div>

        {/* Instructions */}
        <div className="bg-accent border border-border rounded-xl p-6 mb-8">
          <div>
            <h4 className="flex items-center gap-2 mb-3 font-semibold">
              <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-primary" />
              </div>
              How to vote
            </h4>
            <ul className="text-sm text-muted-foreground space-y-2 ml-8">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Select one employee for each rank: 1st place (5 points), 2nd place (3 points), 3rd place (2 points)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>You must choose three distinct employees</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>You can vote for yourself if you wish</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span><strong>Important:</strong> Once submitted, your vote cannot be changed</span>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Progress indicator - Empty state */}
        <div className="mb-8 bg-card border border-border rounded-xl p-4 sm:p-6 shadow-lg opacity-60">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-muted-foreground">Your selections</span>
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-semibold text-foreground">0 of 3</span>
              <div className="hidden sm:block w-16 h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all duration-500" style={{ width: '0%' }} />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[1, 2, 3].map(rank => {
              const icon = rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉';
              
              return (
                <div
                  key={rank}
                  className="relative p-4 rounded-lg border bg-muted/30 border-border"
                >
                  <div className="flex items-center sm:flex-col sm:text-center gap-3 sm:gap-2">
                    <span className="text-2xl opacity-50 flex-shrink-0">{icon}</span>
                    <div className="flex-1 sm:flex-none sm:w-full">
                      <div className="text-xs text-muted-foreground mb-1 sm:mb-1.5">
                        {rank}{rank === 1 ? 'st' : rank === 2 ? 'nd' : 'rd'} place
                      </div>
                      <div className="text-sm font-semibold truncate text-muted-foreground">
                        Not selected
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Empty employee list */}
        <div className="text-center py-16 bg-card border border-border rounded-xl">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
            <Clock className="w-10 h-10 text-muted-foreground opacity-40" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No Active Election</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            {pastElection 
              ? `The "${pastElection.title}" election has ended. Check the Leaderboard to see the results, or wait for your administrator to create a new election.`
              : 'There are no active elections at this time. Please contact your administrator to create an election and start voting.'}
          </p>
        </div>
      </div>
    );
  }

  const now = new Date();
  const start = new Date(election.start_time);
  const end = new Date(election.end_time);
  const isActive = start <= now && now <= end;
  const hasEnded = now > end;
  
  if (!isActive) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {hasEnded 
              ? 'This election has ended. View the results on the Leaderboard.'
              : 'Voting has not started yet. Please check back later.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight truncate" id="voting-title">
            {election.title}
          </h1>
          <p className="text-sm text-muted-foreground mt-1" id="voting-description">
            Rank your top three colleagues — 1st is worth 5 points, 2nd 3, 3rd 2. Your ballot locks once submitted.
          </p>
        </div>

        <div className="shrink-0 inline-flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-sm" role="status" aria-live="polite">
          <Clock className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
          <span className="font-medium tabular-nums whitespace-nowrap" aria-label={`Time remaining: ${timeRemaining}`}>{timeRemaining}</span>
        </div>
      </div>

      {success && (
        <Alert className="mb-4" role="status" aria-live="polite">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          <AlertDescription className="font-medium">{success}</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive" className="mb-4" role="alert" aria-live="assertive">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid lg:grid-cols-[1fr_320px] gap-6 lg:gap-8 items-start">
        {/* Left: candidate list */}
        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Candidates
            </h2>
            <span className="text-xs text-muted-foreground tabular-nums">
              {eligibleEmployees.filter(e => e.active).length}
            </span>
          </div>

          <div className="rounded-xl border border-border bg-card divide-y divide-border" role="list" aria-labelledby="voting-title">
            {eligibleEmployees.filter(e => e.active).length === 0 ? (
              <div className="text-center py-14 px-4">
                <h3 className="text-sm font-medium mb-1">No candidates yet</h3>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                  No employees are eligible for this election yet. Contact an administrator to add them.
                </p>
              </div>
            ) : (
              eligibleEmployees.filter(e => e.active).map((employee, idx) => {
                const selectedRank = getSelectedRank(employee.id);
                return (
                  <div key={employee.id} role="listitem" className="px-2 py-1.5">
                    <EmployeeCard
                      employee={employee}
                      index={idx}
                      selectedRank={selectedRank}
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

        {/* Right: ballot summary */}
        <aside className="lg:sticky lg:top-24">
          <div className="rounded-xl border border-border bg-card p-4" role="status" aria-live="polite" aria-label={`Ballot: ${selections.size} of 3 selected`}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold">Your ballot</h2>
              <span className="text-xs text-muted-foreground tabular-nums">{selections.size}/3</span>
            </div>

            <div className="space-y-1.5">
              {[1, 2, 3].map(rank => {
                const selected = selections.get(rank);
                const employee = selected ? employees.find(e => e.id === selected) : null;
                const points = rank === 1 ? 5 : rank === 2 ? 3 : 2;
                const label = rank === 1 ? '1st' : rank === 2 ? '2nd' : '3rd';
                return (
                  <div
                    key={rank}
                    className={`flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors ${
                      employee ? 'border-border bg-muted/40' : 'border-dashed border-border'
                    }`}
                  >
                    <span className="text-xs font-medium text-muted-foreground w-6 flex-shrink-0">{label}</span>
                    <span className={`flex-1 min-w-0 truncate text-sm ${employee ? 'font-medium' : 'text-muted-foreground'}`}>
                      {employee ? employee.name : 'Empty'}
                    </span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">{points} pt</span>
                  </div>
                );
              })}
            </div>

            {!hasVoted && (
              <Button
                onClick={() => setShowConfirmation(true)}
                disabled={!canSubmit()}
                className="w-full mt-4"
                aria-label="Review and submit your ballot"
              >
                Review &amp; submit
              </Button>
            )}
            <p className="text-xs text-muted-foreground text-center mt-2.5">
              {hasVoted
                ? 'Your ballot is locked.'
                : canSubmit()
                ? 'Review it before it locks for good.'
                : 'Pick 1st, 2nd and 3rd to continue.'}
            </p>
          </div>
        </aside>
      </div>

      <Dialog open={showConfirmation} onOpenChange={(open) => { if (!open) setShowConfirmation(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Confirm your ballot</DialogTitle>
            <DialogDescription>
              Review your selections carefully — once submitted, your vote is locked and cannot be changed.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3" role="list" aria-label="Your ballot selections">
            {getConfirmationDetails().map(({ rank, employee, points }) => {
              const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉';
              return (
                <div key={rank} className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl border border-border/60" role="listitem">
                  {employee.image_url ? (
                    <div className="relative w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 border border-primary/20">
                      <img src={employee.image_url} alt={employee.name} className="w-full h-full object-cover" />
                      <span className="absolute -bottom-1 -right-1 text-base" aria-hidden="true">{medal}</span>
                    </div>
                  ) : (
                    <div className="w-11 h-11 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-xl flex-shrink-0" aria-hidden="true">
                      {medal}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-semibold">{employee.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{employee.role}</div>
                  </div>
                  <div className="text-sm font-semibold text-primary whitespace-nowrap">
                    #{rank} • {points} pts
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between rounded-xl bg-primary/5 border border-primary/15 px-4 py-2.5 text-sm">
            <span className="text-muted-foreground">Total points distributed</span>
            <span className="font-semibold text-primary">
              {getConfirmationDetails().reduce((sum, d) => sum + d.points, 0)} pts
            </span>
          </div>

          <Alert className="border-destructive/40 bg-destructive/5" role="alert">
            <AlertCircle className="h-4 w-4 text-destructive" aria-hidden="true" />
            <AlertDescription className="text-destructive">
              This action is final — your vote cannot be changed after submitting.
            </AlertDescription>
          </Alert>

          <DialogFooter className="gap-3 sm:gap-3">
            <Button
              variant="outline"
              onClick={() => setShowConfirmation(false)}
              disabled={isSubmitting}
              className="flex-1"
              aria-label="Go back to edit your selections"
            >
              Go Back
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 gap-2"
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
                  Confirm &amp; Submit
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      <Dialog open={!!success} onOpenChange={(open) => { if (!open) setSuccess(null); }}>
        <DialogContent className="max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-primary/20 border border-primary/20 flex items-center justify-center mx-auto animate-pop" aria-hidden="true">
            <CheckCircle2 className="w-9 h-9 text-primary" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-xl text-center">Ballot submitted! 🎉</DialogTitle>
            <DialogDescription className="text-center">
              {hasVoted
                ? 'You have already voted in this election. Your vote has been locked.'
                : 'Your vote has been recorded and locked. Thank you for participating!'}
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => setSuccess(null)} className="w-full" aria-label="Close success message">
            Done
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
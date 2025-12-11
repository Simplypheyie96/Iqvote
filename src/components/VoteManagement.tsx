import { useState, useEffect } from 'react';
import { Trash2, AlertCircle, CheckCircle2, XCircle, Search } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Textarea } from './ui/textarea';
import { api } from '../utils/api';

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
}

export function VoteManagement() {
  const [elections, setElections] = useState<Election[]>([]);
  const [selectedElectionId, setSelectedElectionId] = useState<string>('');
  const [votes, setVotes] = useState<Ballot[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
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

  useEffect(() => {
    loadElections();
    loadEmployees();
  }, []);

  useEffect(() => {
    if (selectedElectionId) {
      loadVotes();
    }
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

  const activeVotes = votes.filter(v => !v.revoked);
  const revokedVotes = votes.filter(v => v.revoked);

  // Filter elections based on search
  const filteredElections = elections.filter(election =>
    election.title.toLowerCase().includes(electionSearch.toLowerCase()) ||
    new Date(election.start_time).toLocaleDateString().includes(electionSearch)
  );

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
        <Alert className="border-green-500/50 bg-green-500/10">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-600 dark:text-green-400">{success}</AlertDescription>
        </Alert>
      )}

      {/* Election Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Election</CardTitle>
          <CardDescription>Search and select an election to view and manage votes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search/Select Combo */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Type to search elections by title or date..."
                value={electionSearch}
                onChange={(e) => setElectionSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Compact Results Dropdown */}
            {electionSearch && (
              <div className="border border-border rounded-lg bg-card max-h-64 overflow-y-auto">
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
                            <span className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 shrink-0">
                              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                              Active
                            </span>
                          )}
                          {isUpcoming && (
                            <span className="text-xs text-blue-600 dark:text-blue-400 shrink-0">
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
              <div className="p-4 bg-primary/5 border-2 border-primary rounded-lg">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-muted-foreground mb-1">Currently Viewing</div>
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
              <div className="text-center py-8 text-sm text-muted-foreground">
                <Button onClick={() => setShowElectionModal(true)} variant="outline">
                  Browse All Elections
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedElectionId && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Votes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{votes.length}</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Votes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">{activeVotes.length}</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Deleted Votes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600 dark:text-red-400">{revokedVotes.length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Active Votes */}
          <Card>
            <CardHeader>
              <CardTitle>Active Votes</CardTitle>
              <CardDescription>
                {activeVotes.length} vote{activeVotes.length !== 1 ? 's' : ''} recorded
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading votes...</div>
              ) : activeVotes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No votes found for this election.</div>
              ) : (
                <div className="space-y-3">
                  {activeVotes.map((ballot, idx) => (
                    <div
                      key={idx}
                      className="flex items-start justify-between p-4 bg-muted/30 border border-border rounded-lg hover:border-primary/30 transition-all"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="font-semibold">{ballot.voter?.name || 'Unknown Voter'}</div>
                          <span className="text-xs text-muted-foreground">•</span>
                          <div className="text-sm text-muted-foreground truncate">{ballot.voter?.email}</div>
                        </div>
                        <div className="text-xs text-muted-foreground mb-3">
                          Voted on {new Date(ballot.created_at).toLocaleString()}
                        </div>
                        
                        {/* Vote Details */}
                        <div className="grid grid-cols-3 gap-2">
                          {ballot.selections
                            .sort((a, b) => a.rank - b.rank)
                            .map(selection => (
                              <div
                                key={selection.rank}
                                className="flex items-center gap-2 p-2 bg-background rounded border border-border"
                              >
                                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs shrink-0">
                                  {selection.rank}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs truncate">{getEmployeeName(selection.employee_id)}</div>
                                  <div className="text-xs text-muted-foreground">{selection.points} pts</div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDeleteDialog(ballot)}
                        className="gap-2 hover:border-destructive/50 hover:text-destructive ml-4 shrink-0"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Deleted Votes */}
          {revokedVotes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-destructive" />
                  Deleted Votes
                </CardTitle>
                <CardDescription>
                  {revokedVotes.length} vote{revokedVotes.length !== 1 ? 's' : ''} deleted
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {revokedVotes.map((ballot, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="font-semibold text-muted-foreground">{ballot.voter?.name || 'Unknown Voter'}</div>
                        <span className="text-xs text-muted-foreground">•</span>
                        <div className="text-sm text-muted-foreground">{ballot.voter?.email}</div>
                      </div>
                      <div className="text-xs text-destructive mb-2">
                        Deleted on {ballot.revoked_at ? new Date(ballot.revoked_at).toLocaleString() : 'Unknown'}
                      </div>
                      {ballot.revoke_reason && (
                        <div className="text-xs text-muted-foreground">
                          Reason: {ballot.revoke_reason}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Election Selection Modal */}
      <Dialog open={showElectionModal} onOpenChange={setShowElectionModal}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Browse All Elections</DialogTitle>
            <DialogDescription>
              Select an election to view and manage its votes
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 overflow-y-auto flex-1 pr-2">
            {/* Active Elections */}
            {activeElections.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-green-600 dark:text-green-400 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Active Elections ({activeElections.length})
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
                        className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/10'
                            : 'border-border bg-card hover:border-primary/50 hover:bg-muted/30'
                        }`}
                      >
                        <div className="font-semibold mb-1">{election.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {start.toLocaleDateString()} - {end.toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 mt-2">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                          In Progress
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
                  Past Elections ({pastElections.length})
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
                        className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/10'
                            : 'border-border bg-card hover:border-primary/50 hover:bg-muted/30'
                        }`}
                      >
                        <div className="font-semibold mb-1">{election.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {start.toLocaleDateString()} - {end.toLocaleDateString()}
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                          Completed
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
                <h4 className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-3">
                  Upcoming Elections ({upcomingElections.length})
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
                        className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/10'
                            : 'border-border bg-card hover:border-primary/50 hover:bg-muted/30'
                        }`}
                      >
                        <div className="font-semibold mb-1">{election.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {start.toLocaleDateString()} - {end.toLocaleDateString()}
                        </div>
                        <div className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                          Not Started
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Delete Vote</DialogTitle>
            <DialogDescription>
              This action will remove the vote and adjust the election results. Please provide a reason for the deletion.
            </DialogDescription>
          </DialogHeader>

          {ballotToDelete && (
            <div className="space-y-4 overflow-y-auto flex-1 pr-2">
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="font-semibold mb-1">{ballotToDelete.voter?.name}</div>
                <div className="text-sm text-muted-foreground">{ballotToDelete.voter?.email}</div>
              </div>

              <div>
                <Label className="mb-3 block">Select reason for deletion *</Label>
                <RadioGroup value={deleteReasonPreset} onValueChange={setDeleteReasonPreset}>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 p-2 rounded-lg hover:bg-muted/50 cursor-pointer">
                      <RadioGroupItem value="Duplicate vote" id="duplicate" />
                      <Label htmlFor="duplicate" className="cursor-pointer flex-1">Duplicate vote</Label>
                    </div>
                    <div className="flex items-center space-x-2 p-2 rounded-lg hover:bg-muted/50 cursor-pointer">
                      <RadioGroupItem value="Voter requested removal" id="voter-request" />
                      <Label htmlFor="voter-request" className="cursor-pointer flex-1">Voter requested removal</Label>
                    </div>
                    <div className="flex items-center space-x-2 p-2 rounded-lg hover:bg-muted/50 cursor-pointer">
                      <RadioGroupItem value="Error correction" id="error" />
                      <Label htmlFor="error" className="cursor-pointer flex-1">Error correction</Label>
                    </div>
                    <div className="flex items-center space-x-2 p-2 rounded-lg hover:bg-muted/50 cursor-pointer">
                      <RadioGroupItem value="Policy violation" id="policy" />
                      <Label htmlFor="policy" className="cursor-pointer flex-1">Policy violation</Label>
                    </div>
                    <div className="flex items-center space-x-2 p-2 rounded-lg hover:bg-muted/50 cursor-pointer">
                      <RadioGroupItem value="Invalid submission" id="invalid" />
                      <Label htmlFor="invalid" className="cursor-pointer flex-1">Invalid submission</Label>
                    </div>
                    <div className="flex items-center space-x-2 p-2 rounded-lg hover:bg-muted/50 cursor-pointer">
                      <RadioGroupItem value="other" id="other" />
                      <Label htmlFor="other" className="cursor-pointer flex-1">Other (specify below)</Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="custom-reason">
                  Additional details {deleteReasonPreset === 'other' ? '(required)' : '(optional)'}
                </Label>
                <Textarea
                  id="custom-reason"
                  value={customDeleteReason}
                  onChange={(e) => setCustomDeleteReason(e.target.value)}
                  placeholder={deleteReasonPreset === 'other' ? 'Please specify the reason...' : 'Add any additional context (optional)'}
                  className="mt-1.5 min-h-[80px] max-h-[120px] resize-none"
                />
              </div>

              <Alert className="border-red-500/50 bg-red-500/10">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <AlertDescription className="text-red-600 dark:text-red-400">
                  <strong>Warning:</strong> This action will permanently delete the vote and update the leaderboard. This cannot be undone.
                </AlertDescription>
              </Alert>
            </div>
          )}

          <div className="flex gap-3 flex-shrink-0 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setDeleteReasonPreset('');
                setCustomDeleteReason('');
              }}
              disabled={loading}
              className="flex-1"
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
              className="flex-1"
            >
              {loading ? 'Deleting...' : 'Delete Vote'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
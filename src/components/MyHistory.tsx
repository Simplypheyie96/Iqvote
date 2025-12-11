import { useState, useEffect } from 'react';
import { History, Trophy, User, ChevronDown, ChevronUp, Calendar, Eye, TrendingUp } from 'lucide-react';
import { api } from '../utils/api';
import { Employee } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { LoadingSpinner } from './LoadingSpinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';

interface MyHistoryProps {
  currentUser: Employee;
}

interface VoteHistory {
  election: {
    id: string;
    title: string;
    end_time: string;
  };
  ballot: {
    created_at: string;
    revoked: boolean;
    revoke_reason?: string;
  };
  selections: {
    rank: number;
    employee: Employee;
    points: number;
  }[];
}

interface ReceivedVotes {
  election: {
    id: string;
    title: string;
    end_time: string;
  };
  total_points: number;
  rank: number;
  total_participants: number;
}

export function MyHistory({ currentUser }: MyHistoryProps) {
  const [myVotes, setMyVotes] = useState<VoteHistory[]>([]);
  const [receivedVotes, setReceivedVotes] = useState<ReceivedVotes[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedVotes, setExpandedVotes] = useState<Set<string>>(new Set());
  const [expandedReceivedVotes, setExpandedReceivedVotes] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    setLoading(true);
    try {
      const [myVotesData, receivedVotesData] = await Promise.all([
        api.getMyVotes(),
        api.getMyReceivedVotes()
      ]);

      setMyVotes(myVotesData.votes);
      setReceivedVotes(receivedVotesData.votes);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  function getRankBadge(rank: number) {
    const rankConfig = {
      1: { icon: Trophy, label: '1st Place', color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30' },
      2: { icon: User, label: '2nd Place', color: 'text-gray-400 bg-gray-400/10 border-gray-400/30' },
      3: { icon: User, label: '3rd Place', color: 'text-amber-600 bg-amber-600/10 border-amber-600/30' }
    };

    const config = rankConfig[rank as keyof typeof rankConfig] || {
      icon: User,
      label: `${rank}th Place`,
      color: 'text-muted-foreground bg-muted/50 border-border'
    };

    const Icon = config.icon;

    return (
      <Badge variant="outline" className={`gap-1.5 ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  }

  function getPointsBadge(points: number) {
    if (points >= 5) {
      return <Badge className="bg-gradient-to-r from-primary to-primary/70">{points} pts</Badge>;
    } else if (points >= 3) {
      return <Badge variant="secondary">{points} pts</Badge>;
    } else {
      return <Badge variant="outline">{points} pts</Badge>;
    }
  }

  function toggleVoteExpand(electionId: string) {
    setExpandedVotes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(electionId)) {
        newSet.delete(electionId);
      } else {
        newSet.add(electionId);
      }
      return newSet;
    });
  }

  function toggleReceivedVoteExpand(electionId: string) {
    setExpandedReceivedVotes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(electionId)) {
        newSet.delete(electionId);
      } else {
        newSet.add(electionId);
      }
      return newSet;
    });
  }

  if (loading) {
    return (
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="text-center py-12">
          <LoadingSpinner size="lg" text="Loading your history" />
        </div>
      </div>
    );
  }

  const totalPointsReceived = receivedVotes.reduce((sum, v) => sum + v.total_points, 0);
  const totalVotesCast = myVotes.length;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent mb-2">
          My Voting History
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          View your vote history and the recognition you've received
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardDescription className="text-xs">Total Votes Cast</CardDescription>
            <CardTitle className="text-3xl">{totalVotesCast}</CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardDescription className="text-xs">Total Points Received</CardDescription>
            <CardTitle className="text-3xl text-primary">{totalPointsReceived}</CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardDescription className="text-xs">Elections Participated</CardDescription>
            <CardTitle className="text-3xl">{myVotes.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Tabs - Match Admin Style */}
      <Tabs defaultValue="my-votes" className="w-full">
        <TabsList>
          <TabsTrigger value="my-votes" className="gap-2">
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">My Votes</span>
            <span className="sm:hidden">Votes</span>
          </TabsTrigger>
          <TabsTrigger value="received" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            <span className="hidden sm:inline">Votes Received</span>
            <span className="sm:hidden">Received</span>
          </TabsTrigger>
        </TabsList>

        {/* My Votes Tab */}
        <TabsContent value="my-votes" className="space-y-4 mt-6">
          {myVotes.length === 0 ? (
            <Card className="border-border">
              <CardContent className="pt-12 pb-12 text-center">
                <Eye className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">You haven't cast any votes yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {myVotes.map((vote) => {
                const isExpanded = expandedVotes.has(vote.election.id);
                
                return (
                  <Card key={vote.election.id} className="overflow-hidden border-border">
                    {/* Compact header - always visible */}
                    <div 
                      className="p-4 cursor-pointer hover:bg-muted/30 transition-colors border-b border-border"
                      onClick={() => toggleVoteExpand(vote.election.id)}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-sm sm:text-base truncate">{vote.election.title}</h3>
                            <Badge variant={vote.ballot.revoked ? "destructive" : "outline"} className="text-xs">
                              {vote.ballot.revoked ? 'Revoked' : 'Counted'}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                            <Calendar className="w-3 h-3" />
                            Voted on {formatDate(vote.ballot.created_at)}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" className="flex-shrink-0">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Expandable content */}
                    {isExpanded && (
                      <CardContent className="pt-4 pb-4">
                        <div className="grid sm:grid-cols-3 gap-4">
                          {vote.selections
                            .sort((a, b) => a.rank - b.rank)
                            .map((selection) => (
                              <div
                                key={selection.rank}
                                className={`p-4 rounded-xl border ${
                                  selection.rank === 1 
                                    ? 'bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20'
                                    : selection.rank === 2
                                    ? 'bg-gradient-to-br from-primary/8 to-primary/3 border-primary/15'
                                    : 'bg-muted/30 border-border'
                                }`}
                              >
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground font-bold text-xs flex-shrink-0">
                                    {selection.rank}
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    {selection.rank === 1 ? '1st Choice' : selection.rank === 2 ? '2nd Choice' : '3rd Choice'}
                                  </p>
                                </div>
                                <p className="font-bold text-lg mb-0.5 truncate">{selection.employee.name}</p>
                                <p className="text-xs text-muted-foreground mb-2 truncate">{selection.employee.role}</p>
                                <Badge className={
                                  selection.rank === 1 
                                    ? 'bg-gradient-to-r from-primary to-primary/70'
                                    : selection.rank === 2
                                    ? 'bg-primary/60'
                                    : ''
                                } variant={selection.rank === 3 ? 'outline' : undefined}>
                                  {selection.points} pts
                                </Badge>
                              </div>
                            ))}
                        </div>

                        {vote.ballot.revoked && (
                          <Alert variant="destructive" className="mt-4">
                            <AlertDescription className="text-xs">
                              This vote was revoked: {vote.ballot.revoke_reason || 'No reason provided'}
                            </AlertDescription>
                          </Alert>
                        )}
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Votes Received Tab */}
        <TabsContent value="received" className="space-y-4 mt-6">
          {receivedVotes.length === 0 ? (
            <Card className="border-border">
              <CardContent className="pt-12 pb-12 text-center">
                <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">You haven't received any votes yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {receivedVotes.map((vote) => {
                const isExpanded = expandedReceivedVotes.has(vote.election.id);
                
                return (
                  <Card key={vote.election.id} className="overflow-hidden border-border">
                    {/* Compact header - always visible */}
                    <div 
                      className="p-4 cursor-pointer hover:bg-muted/30 transition-colors border-b border-border"
                      onClick={() => toggleReceivedVoteExpand(vote.election.id)}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-sm sm:text-base truncate">{vote.election.title}</h3>
                            {getRankBadge(vote.rank)}
                          </div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                            <Calendar className="w-3 h-3" />
                            Ended {formatDate(vote.election.end_time)}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" className="flex-shrink-0">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Expandable content */}
                    {isExpanded && (
                      <CardContent className="pt-4 pb-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                            <p className="text-xs text-muted-foreground mb-1">Points Received</p>
                            <p className="text-3xl font-bold text-primary">{vote.total_points}</p>
                          </div>
                          <div className="p-4 rounded-xl bg-muted/30 border border-border">
                            <p className="text-xs text-muted-foreground mb-1">Total Voters</p>
                            <p className="text-3xl font-bold">{vote.total_participants}</p>
                          </div>
                        </div>

                        <Alert className="mt-4 border-blue-500/50 bg-blue-500/10">
                          <AlertDescription className="text-xs text-blue-600 dark:text-blue-400">
                            Votes are anonymous. We don't share who voted for whom to maintain fairness and prevent bias.
                          </AlertDescription>
                        </Alert>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
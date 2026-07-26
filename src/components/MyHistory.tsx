import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Employee } from '../types';
import { Skeleton } from './ui/skeleton';
import {
  Stat,
  VotingHistory,
  type VoteHistoryEntry,
  type ReceivedVotesEntry,
} from './VotingHistory';

interface MyHistoryProps {
  currentUser: Employee;
}

export function MyHistory({ currentUser: _currentUser }: MyHistoryProps) {
  const [myVotes, setMyVotes] = useState<VoteHistoryEntry[]>([]);
  const [receivedVotes, setReceivedVotes] = useState<ReceivedVotesEntry[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8" aria-busy="true">
        <span className="sr-only" role="status">Loading your history</span>
        <Skeleton className="h-7 w-56" />
        <Skeleton className="mt-3 h-4 w-72" />
        <div className="mt-8 grid grid-cols-1 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-e1 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {[0, 1, 2].map(i => (
            <div key={i} className="px-5 py-4 sm:px-6 sm:py-5">
              <Skeleton className="h-7 w-12" />
              <Skeleton className="mt-3 h-3 w-24" />
            </div>
          ))}
        </div>
        <div className="mt-8 space-y-3">
          {[0, 1, 2].map(i => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const totalPointsReceived = receivedVotes.reduce((sum, v) => sum + v.total_points, 0);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="mb-8">
        <h1 className="font-display text-xl sm:text-2xl font-semibold tracking-tight">Your history</h1>
        <p className="mt-1.5 text-sm text-muted-foreground text-pretty">
          The ballots you&apos;ve cast, and the recognition that came back to you.
        </p>
      </div>

      {/* Two of the three tiles used to show the same number (votes cast and
          elections participated are the same list). The third stat is now how
          often you placed, which is the one thing the other two don't say. */}
      <div className="mb-8 grid grid-cols-1 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-e1 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <Stat label="Elections you voted in" value={myVotes.length} />
        <Stat label="Points people gave you" value={totalPointsReceived} accent />
        <Stat label="Elections you placed in" value={receivedVotes.length} />
      </div>

      <VotingHistory myVotes={myVotes} receivedVotes={receivedVotes} />
    </div>
  );
}

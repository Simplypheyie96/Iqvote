import { useState } from 'react';
import { ChevronDown, Calendar, Inbox, Send } from 'lucide-react';
import { Employee } from '../types';
import { RankMedal } from './RankMedal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { TAB_LIST_CLASS, TAB_TRIGGER_CLASS } from './ui/tab-pills';

/**
 * The two history lists — ballots you cast, and where you finished — shared by
 * the standalone history page and the profile page. Both screens already fetch
 * exactly these two arrays, so this component takes them as props and makes no
 * requests of its own. It owns only the open/closed state of its own rows.
 */

export interface VoteHistoryEntry {
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

export interface ReceivedVotesEntry {
  election: {
    id: string;
    title: string;
    end_time: string;
  };
  total_points: number;
  rank: number;
  total_participants: number;
}

const CHOICE_LABEL: Record<number, string> = { 1: 'First choice', 2: 'Second choice', 3: 'Third choice' };

const PLACE_LABEL: Record<number, string> = { 1: 'Won it', 2: 'Runner-up', 3: 'Third' };

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * One stat, one number. A bordered card each turned three integers into three
 * objects competing for attention; a single strip with hairlines between them
 * says the same thing and gets out of the way.
 */
export function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    // Stacked on a phone would give three integers 145px of height each. Side
    // by side, the same strip reads in one glance; from `sm` it goes back to
    // the number-over-label column the three-across layout wants.
    <div className="flex items-baseline justify-between gap-4 px-5 py-4 sm:block sm:px-6 sm:py-5">
      <div className={`font-display text-2xl font-semibold leading-none tabular-nums sm:text-3xl ${accent ? 'text-primary-strong' : ''}`}>
        {value}
      </div>
      <div className="text-right text-xs text-muted-foreground text-pretty sm:mt-2 sm:text-left">{label}</div>
    </div>
  );
}

/** The shared shell for both tabs: a heading row you can click to open. */
function HistoryRow({
  title,
  meta,
  badge,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  meta: string;
  badge?: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-muted/40 sm:px-6"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-semibold sm:text-base">{title}</h3>
            {badge}
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3 shrink-0" aria-hidden="true" />
            {meta}
          </p>
        </div>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>
      {expanded && <div className="border-t border-border px-4 py-5 sm:px-6">{children}</div>}
    </li>
  );
}

export function EmptyState({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border px-6 py-14 text-center">
      <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-muted text-muted-foreground">
        {icon}
      </div>
      <h3 className="font-display text-base font-semibold tracking-tight">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground text-pretty">{body}</p>
    </div>
  );
}

export function VotingHistory({
  myVotes,
  receivedVotes,
}: {
  myVotes: VoteHistoryEntry[];
  receivedVotes: ReceivedVotesEntry[];
}) {
  const [expandedVotes, setExpandedVotes] = useState<Set<string>>(new Set());
  const [expandedReceivedVotes, setExpandedReceivedVotes] = useState<Set<string>>(new Set());

  function toggle(setter: React.Dispatch<React.SetStateAction<Set<string>>>, electionId: string) {
    setter(prev => {
      const next = new Set(prev);
      if (next.has(electionId)) {
        next.delete(electionId);
      } else {
        next.add(electionId);
      }
      return next;
    });
  }

  return (
    <Tabs defaultValue="my-votes" className="w-full">
      <TabsList className={TAB_LIST_CLASS}>
        <TabsTrigger value="my-votes" className={`${TAB_TRIGGER_CLASS} gap-2`}>
          <Send className="h-4 w-4" aria-hidden="true" />
          My Votes
        </TabsTrigger>
        <TabsTrigger value="received" className={`${TAB_TRIGGER_CLASS} gap-2`}>
          <Inbox className="h-4 w-4" aria-hidden="true" />
          Votes Received
        </TabsTrigger>
      </TabsList>

      {/* Votes cast */}
      <TabsContent value="my-votes" className="mt-6">
        {myVotes.length === 0 ? (
          <EmptyState
            icon={<Send className="h-6 w-6" aria-hidden="true" />}
            title="You haven't voted yet"
            body="Once you cast a ballot, the three people you picked will show up here."
          />
        ) : (
          <ol className="overflow-hidden rounded-2xl border border-border bg-card shadow-e1 divide-y divide-border">
            {myVotes.map((vote) => (
              <HistoryRow
                key={vote.election.id}
                title={vote.election.title}
                meta={`Voted ${formatDate(vote.ballot.created_at)}`}
                expanded={expandedVotes.has(vote.election.id)}
                onToggle={() => toggle(setExpandedVotes, vote.election.id)}
                badge={
                  vote.ballot.revoked ? (
                    <span className="shrink-0 rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive">
                      Removed
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success">
                      Counting
                    </span>
                  )
                }
              >
                <div className="grid gap-3 sm:grid-cols-3">
                  {vote.selections
                    .sort((a, b) => a.rank - b.rank)
                    .map((selection) => (
                      <div key={selection.rank} className="rounded-xl bg-sunken px-4 py-4 inset-ring-1 inset-ring-sunken-line">
                        <div className="flex items-center gap-2">
                          <RankMedal rank={selection.rank} size="sm" />
                          <span className="text-xs text-muted-foreground">
                            {CHOICE_LABEL[selection.rank] || `Choice ${selection.rank}`}
                          </span>
                        </div>
                        <p className="mt-3 truncate font-semibold">{selection.employee.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{selection.employee.role}</p>
                        <p className="mt-2 text-xs font-medium tabular-nums text-muted-foreground">
                          {selection.points} pts
                        </p>
                      </div>
                    ))}
                </div>

                {vote.ballot.revoked && (
                  <p className="mt-4 rounded-xl bg-destructive/[0.07] px-4 py-3 text-sm text-pretty inset-ring-1 inset-ring-destructive/25">
                    <span className="font-medium">This ballot no longer counts.</span>{' '}
                    <span className="text-muted-foreground">
                      {vote.ballot.revoke_reason || 'No reason was recorded.'}
                    </span>
                  </p>
                )}
              </HistoryRow>
            ))}
          </ol>
        )}
      </TabsContent>

      {/* Votes received */}
      <TabsContent value="received" className="mt-6">
        {receivedVotes.length === 0 ? (
          <EmptyState
            icon={<Inbox className="h-6 w-6" aria-hidden="true" />}
            title="No votes yet"
            body="When colleagues pick you, the points and where you finished will appear here."
          />
        ) : (
          <>
            <ol className="overflow-hidden rounded-2xl border border-border bg-card shadow-e1 divide-y divide-border">
              {receivedVotes.map((vote) => (
                <HistoryRow
                  key={vote.election.id}
                  title={vote.election.title}
                  meta={`Ended ${formatDate(vote.election.end_time)}`}
                  expanded={expandedReceivedVotes.has(vote.election.id)}
                  onToggle={() => toggle(setExpandedReceivedVotes, vote.election.id)}
                  badge={
                    vote.rank <= 3 ? (
                      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-muted/70 py-0.5 pl-0.5 pr-2.5 text-[11px] font-medium inset-ring-1 inset-ring-border/60">
                        <RankMedal rank={vote.rank} size="xs" />
                        {PLACE_LABEL[vote.rank]}
                      </span>
                    ) : (
                      <span className="shrink-0 rounded-full bg-muted/70 px-2 py-0.5 text-[11px] font-medium text-muted-foreground tabular-nums inset-ring-1 inset-ring-border/60">
                        #{vote.rank}
                      </span>
                    )
                  }
                >
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl bg-sunken px-4 py-4 inset-ring-1 inset-ring-sunken-line">
                      <div className="font-display text-2xl font-semibold leading-none tabular-nums text-primary-strong">
                        {vote.total_points}
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">Points you received</div>
                    </div>
                    <div className="rounded-xl bg-sunken px-4 py-4 inset-ring-1 inset-ring-sunken-line">
                      <div className="font-display text-2xl font-semibold leading-none tabular-nums">
                        {vote.rank}
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">Where you finished</div>
                    </div>
                    <div className="rounded-xl bg-sunken px-4 py-4 inset-ring-1 inset-ring-sunken-line">
                      <div className="font-display text-2xl font-semibold leading-none tabular-nums">
                        {vote.total_participants}
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">People in the running</div>
                    </div>
                  </div>
                </HistoryRow>
              ))}
            </ol>

            {/* Said once, under the list — not repeated inside every row it
                applies to. Nothing has gone wrong, so it isn't an alert. */}
            <p className="mt-4 px-1 text-xs text-muted-foreground text-pretty">
              Ballots are anonymous. You can see the points you were given, never who gave them.
            </p>
          </>
        )}
      </TabsContent>
    </Tabs>
  );
}

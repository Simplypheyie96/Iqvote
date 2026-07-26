import { useState, useEffect, useCallback } from 'react';
import { Trophy, Crown, Award, User, MessageCircle, Calendar, Download, Share2 } from 'lucide-react';
import { Employee, Election, LeaderboardEntry } from '../types';
import { api } from '../utils/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { VotingReasonsModal } from './VotingReasonsModal';
import { SharePodiumDialog } from './SharePodiumDialog';
import { RankMedal } from './RankMedal';
import { Button } from './ui/button';
import { Skeleton } from './ui/skeleton';
import * as XLSX from 'xlsx';

interface LeaderboardPageProps {
  currentUser: Employee;
  election: Election | null;
  elections: Election[];
}

/**
 * The podium tiers, in rank order.
 *
 * `order` puts 1st in the middle on desktop while the DOM stays in rank order —
 * a screen reader and a keyboard both still travel 1 → 2 → 3.
 * `plinth` is the extra depth under each block; it is what makes 1st stand
 * taller than 3rd, so the three blocks read as one physical podium.
 * `award` is the rank's own metal, so gold, silver and bronze are actually
 * three different colours rather than two of them sharing one.
 * `delay` runs the entrance 2nd → 3rd → 1st so the winner lands last.
 */
const TIERS = [
  {
    primary: true, label: 'Champion', order: 'md:order-2', Icon: Crown, award: 'bg-medal-1',
    delay: 180, plinth: 'md:pb-20', edge: '',
    avatar: 'h-14 w-14 sm:h-16 sm:w-16 md:h-24 md:w-24', points: 'text-3xl md:text-4xl',
  },
  {
    primary: false, label: 'Runner-up', order: 'md:order-1', Icon: Trophy, award: 'bg-medal-2',
    delay: 60, plinth: 'md:pb-10', edge: 'md:rounded-tl-2xl',
    avatar: 'h-12 w-12 sm:h-14 sm:w-14 md:h-20 md:w-20', points: 'text-2xl md:text-3xl',
  },
  {
    primary: false, label: 'Third place', order: 'md:order-3', Icon: Award, award: 'bg-medal-3',
    delay: 120, plinth: 'md:pb-4', edge: 'md:rounded-tr-2xl',
    avatar: 'h-12 w-12 sm:h-14 sm:w-14 md:h-20 md:w-20', points: 'text-2xl md:text-3xl',
  },
];

function initialsOf(name?: string) {
  return (name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

export function LeaderboardPage({ currentUser, election, elections }: LeaderboardPageProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [reasonsModalOpen, setReasonsModalOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<{
    name: string;
    messages: string[];
    totalPoints: number;
  } | null>(null);

  // Time-based filtering states
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().getMonth().toString());
  const [electionsCount, setElectionsCount] = useState(0);

  // Get available years from elections
  const availableYears = Array.from(
    new Set(
      elections.map(e => new Date(e.start_time).getFullYear())
    )
  ).sort((a, b) => b - a);

  // Add current year if not in list
  const currentYear = new Date().getFullYear();
  if (!availableYears.includes(currentYear)) {
    availableYears.unshift(currentYear);
  }

  const loadLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      if (selectedYear === 'all-time') {
        // Load aggregated data for all time
        const { leaderboard: data, elections_count } = await api.getAggregatedLeaderboard('all-time');
        const withRanks = data.map((entry: LeaderboardEntry, index: number) => ({
          ...entry,
          rank: index + 1
        }));
        setLeaderboard(withRanks);
        setElectionsCount(elections_count || 0);
      } else if (selectedMonth && selectedMonth !== 'full-year') {
        // Load aggregated data for specific month
        const { leaderboard: data, elections_count } = await api.getAggregatedLeaderboard(selectedYear, selectedMonth);
        const withRanks = data.map((entry: LeaderboardEntry, index: number) => ({
          ...entry,
          rank: index + 1
        }));
        setLeaderboard(withRanks);
        setElectionsCount(elections_count || 0);
      } else {
        // Load aggregated data for whole year
        const { leaderboard: data, elections_count } = await api.getAggregatedLeaderboard(selectedYear);
        const withRanks = data.map((entry: LeaderboardEntry, index: number) => ({
          ...entry,
          rank: index + 1
        }));
        setLeaderboard(withRanks);
        setElectionsCount(elections_count || 0);
      }
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  const months = [
    { value: 'full-year', label: 'Full Year' },
    { value: '0', label: 'January' },
    { value: '1', label: 'February' },
    { value: '2', label: 'March' },
    { value: '3', label: 'April' },
    { value: '4', label: 'May' },
    { value: '5', label: 'June' },
    { value: '6', label: 'July' },
    { value: '7', label: 'August' },
    { value: '8', label: 'September' },
    { value: '9', label: 'October' },
    { value: '10', label: 'November' },
    { value: '11', label: 'December' },
  ];

  const topThree = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  // Get filter description
  function getFilterDescription() {
    const unit = electionsCount === 1 ? 'election' : 'elections';
    if (selectedYear === 'all-time') {
      return `All time · ${electionsCount} ${unit}`;
    } else if (selectedMonth && selectedMonth !== 'full-year') {
      const monthName = months.find(m => m.value === selectedMonth)?.label || '';
      return `${monthName} ${selectedYear} · ${electionsCount} ${unit}`;
    } else {
      return `${selectedYear} · ${electionsCount} ${unit}`;
    }
  }

  /* What the share card is announcing, in words. Both strings come from the
     filter state that is already on screen — no query, no recomputation. */
  function getCardHeadings() {
    if (selectedYear === 'all-time') {
      return { title: 'All-time standings', subtitle: getFilterDescription() };
    }
    if (selectedMonth && selectedMonth !== 'full-year') {
      const monthName = months.find(m => m.value === selectedMonth)?.label || '';
      return { title: 'Employee of the Month', subtitle: `${monthName} ${selectedYear}` };
    }
    return { title: `The year in recognition`, subtitle: getFilterDescription() };
  }

  const sharePeople = topThree.map(entry => ({
    name: entry.employee?.name || 'Unknown',
    role: entry.employee?.role,
    points: entry.total_points,
    imageUrl: entry.employee?.image_url,
  }));

  function openNotes(entry: LeaderboardEntry) {
    setSelectedEmployee({
      name: entry.employee?.name || 'Unknown',
      messages: (entry as any).messages || [],
      totalPoints: entry.total_points,
    });
    setReasonsModalOpen(true);
  }

  // Function to export leaderboard to Excel
  const exportToExcel = () => {
    // Prepare data for export
    const wsData = [
      ['IQ Vote - Leaderboard Export'],
      [`Period: ${getFilterDescription()}`],
      [`Exported on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`],
      [], // Empty row for spacing
      ['Rank', 'Name', 'Role', 'Department', 'Total Points', '1st Place (5pts)', '2nd Place (3pts)', '3rd Place (2pts)', 'Messages']
    ];

    leaderboard.forEach(entry => {
      wsData.push([
        entry.rank,
        entry.employee?.name || 'Unknown',
        entry.employee?.role || 'N/A',
        entry.employee?.department || 'N/A',
        entry.total_points,
        entry.count_first,
        entry.count_second,
        entry.count_third,
        (entry as any).message_count || 0
      ]);
    });

    // Add summary statistics at the bottom
    wsData.push([]);
    wsData.push(['Summary Statistics']);
    wsData.push(['Total Employees:', leaderboard.length]);
    wsData.push(['Total Elections:', electionsCount]);
    const totalPoints = leaderboard.reduce((sum, entry) => sum + entry.total_points, 0);
    wsData.push(['Total Points Awarded:', totalPoints]);

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths
    ws['!cols'] = [
      { wch: 6 }, // Rank
      { wch: 20 }, // Name
      { wch: 20 }, // Role
      { wch: 20 }, // Department
      { wch: 12 }, // Total Points
      { wch: 16 }, // 1st Place
      { wch: 16 }, // 2nd Place
      { wch: 16 }, // 3rd Place
      { wch: 10 } // Messages
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Leaderboard');

    // Generate filename based on period
    let filename = 'IQ_Vote_Leaderboard';
    if (selectedYear === 'all-time') {
      filename += '_All_Time';
    } else if (selectedMonth && selectedMonth !== 'full-year') {
      const monthName = months.find(m => m.value === selectedMonth)?.label || '';
      filename += `_${monthName}_${selectedYear}`;
    } else {
      filename += `_${selectedYear}`;
    }
    filename += `_${new Date().toISOString().split('T')[0]}.xlsx`;

    XLSX.writeFile(wb, filename);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Header and time filters */}
      <div className="mb-8 flex flex-col gap-4 sm:mb-10 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-xl sm:text-2xl font-semibold tracking-tight" id="leaderboard-title">
            Leaderboard
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground tabular-nums" aria-live="polite">
            {getFilterDescription()}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:shrink-0">
          {/* Year Selector */}
          <Select value={selectedYear} onValueChange={(value) => {
            setSelectedYear(value);
            if (value === 'all-time') {
              setSelectedMonth('full-year');
            }
          }}>
            <SelectTrigger className="h-11 min-w-[9rem] flex-1 sm:w-[172px] sm:flex-none" aria-label="Filter by year">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-time">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>All time</span>
                </div>
              </SelectItem>
              {availableYears.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Month Selector (only show if not all-time) */}
          {selectedYear !== 'all-time' && (
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="h-11 min-w-[9rem] flex-1 sm:w-[172px] sm:flex-none" aria-label="Filter by month">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Admin-only actions, behind the same role check that has always
              gated the spreadsheet export. */}
          {currentUser.is_admin && (
            <>
              <Button
                variant="outline"
                onClick={exportToExcel}
                className="h-11 gap-2 shrink-0"
                disabled={leaderboard.length === 0 || loading}
              >
                <Download className="w-4 h-4" aria-hidden="true" />
                Export
              </Button>
              <Button
                onClick={() => setShareOpen(true)}
                className="h-11 gap-2 shrink-0"
                disabled={topThree.length === 0 || loading}
              >
                <Share2 className="w-4 h-4" aria-hidden="true" />
                Share podium
              </Button>
            </>
          )}
        </div>
      </div>

      {loading ? (
        /* Skeletons in the shape of what is coming — a tiered podium and a
           ranked list — rather than a spinner that says only "wait". */
        <div aria-busy="true" role="status" aria-live="polite">
          <span className="sr-only">Loading the leaderboard</span>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:items-end md:gap-3">
            {['md:order-2 md:h-28', 'md:order-1 md:h-16', 'md:order-3 md:h-10'].map((tier, i) => (
              <div key={i} className={`flex flex-col ${tier.split(' ')[0]}`}>
                {/* Phone: a row. Desktop: a column. Same shape as what lands. */}
                <div className="rounded-2xl border border-border bg-card p-3.5 shadow-e1 md:p-6">
                  <div className="flex items-center gap-3.5 md:block">
                    <Skeleton className="h-14 w-14 shrink-0 rounded-full md:mx-auto md:h-20 md:w-20" />
                    <div className="flex min-w-0 flex-1 flex-col gap-2 md:gap-0">
                      <Skeleton className="h-4 w-28 md:mx-auto md:mt-4" />
                      <Skeleton className="h-3 w-20 md:mx-auto md:mt-2" />
                    </div>
                    <Skeleton className="h-8 w-12 shrink-0 md:mx-auto md:mt-5 md:h-9 md:w-16" />
                  </div>
                  <Skeleton className="mt-3.5 h-14 w-full rounded-xl md:mt-5 md:h-16" />
                </div>
                <div className={`hidden rounded-t-xl border border-b-0 border-border bg-muted md:block ${tier.split(' ')[1]}`} />
              </div>
            ))}
          </div>
          <div className="mt-10 overflow-hidden rounded-2xl border border-border bg-card shadow-e1">
            <div className="divide-y divide-border">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-4 sm:px-6">
                  <Skeleton className="h-4 w-5" />
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                  <Skeleton className="h-6 w-10" />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-6 py-16 text-center">
          <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-muted text-muted-foreground">
            <Trophy className="h-7 w-7" aria-hidden="true" />
          </div>
          <h2 className="font-display text-lg font-semibold tracking-tight">Nothing to show yet</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground text-pretty">
            No votes have been counted for this period. Standings appear here as soon as people start voting.
          </p>
          {selectedYear !== 'all-time' && selectedMonth !== 'full-year' && (
            <Button
              variant="outline"
              onClick={() => setSelectedMonth('full-year')}
              className="mt-6 h-11 gap-2"
            >
              <Calendar className="w-4 h-4" />
              See the whole year
            </Button>
          )}
        </div>
      ) : (
        <div id="leaderboard-content">
          {/* The podium. Three blocks of different heights standing on a floor:
              the tiering IS the ranking, so it is drawn rather than described.

              Below 768px a silhouette will not fit, so the same three entries
              become left-aligned ranked rows on the identical axis as the rest
              of the field below them — photo inside the block at the left, name
              beside it, points right. Rank is carried by size and by the pink
              wash on 1st rather than by centring. It used to be three centred
              columns with the photo floating above each one, which ran two
              different alignment systems on one screen. */}
          {topThree.length > 0 && (
            <section className="mb-10 sm:mb-14" aria-labelledby="podium-heading">
              <h2 id="podium-heading" className="sr-only">Top three</h2>

              <ol className="grid grid-cols-1 gap-3 md:grid-cols-3 md:items-end md:gap-0">
                {topThree.map((entry, index) => {
                  const tier = TIERS[index];
                  const Icon = tier.Icon;
                  const isCurrentUser = entry.employee_id === currentUser.id;
                  const messageCount = (entry as any).message_count || 0;
                  const firstNote: string | undefined = ((entry as any).messages || [])[0];

                  return (
                    <li
                      key={entry.employee_id}
                      className={`grid animate-fade-in-up grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3.5 rounded-2xl border p-3.5 md:flex md:flex-col md:items-center md:rounded-none md:border-0 md:bg-transparent md:p-0 ${tier.order} ${
                        tier.primary ? 'border-primary/55 bg-primary/[0.11]' : 'border-border bg-card'
                      }`}
                      style={{ animationDelay: `${tier.delay}ms` }}
                    >
                      {/* On a phone the two wrappers below go `display: contents`,
                          so every leaf lands directly in the row grid above:
                          photo | name + role + award | points. That is the whole
                          point of the mobile layout — the photo sits inside the
                          block on the same left axis as the rest of the field,
                          instead of floating above a centred column.

                          From `md` up the wrappers come back and nothing about
                          the podium changes: the person stands above the
                          platform, and the platform is its own bordered box. */}
                      <div className="contents md:flex md:flex-col md:items-center md:px-2 md:pb-4 md:text-center">
                        <div className="relative col-start-1 row-span-2 row-start-1 self-center">
                          <div
                            className={`${tier.avatar} grid place-items-center overflow-hidden rounded-full bg-muted text-lg font-medium text-muted-foreground ${
                              tier.primary ? 'inset-ring-2 inset-ring-primary/60' : 'inset-ring-1 inset-ring-border'
                            }`}
                          >
                            {entry.employee?.image_url ? (
                              <img src={entry.employee.image_url} alt="" className="h-full w-full object-cover" />
                            ) : (
                              initialsOf(entry.employee?.name)
                            )}
                          </div>
                          <RankMedal
                            rank={entry.rank}
                            size="sm"
                            className="absolute -bottom-0.5 -right-0.5 ring-2 ring-background"
                          />
                        </div>

                        <div className="col-start-2 row-start-1 flex max-w-full items-center gap-1.5 md:mt-3 md:justify-center">
                          <h3 className="truncate font-display text-base font-semibold tracking-tight">
                            {entry.employee?.name}
                          </h3>
                          {isCurrentUser && (
                            <span className="shrink-0 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary-strong">
                              You
                            </span>
                          )}
                        </div>
                        {entry.employee?.role && (
                          <p className="col-start-2 row-start-2 max-w-full truncate text-xs text-muted-foreground md:mt-0.5">
                            {entry.employee.role}
                          </p>
                        )}
                      </div>

                      {/* The platform — a solid block with a lit top face and a
                          front face. The top face is a real bordered element
                          rotated in 3D (not a clip-path), so the outline wraps
                          the whole shape and the block reads as one object. */}
                      <div className="contents md:block md:w-full">
                        <div
                          className={`hidden h-11 border border-b-0 md:block ${tier.edge} ${
                            tier.primary ? 'border-primary/55 bg-primary/[0.16]' : 'border-border bg-muted'
                          }`}
                          style={{ transform: 'perspective(420px) rotateX(58deg)', transformOrigin: 'bottom center' }}
                          aria-hidden="true"
                        />

                        <div
                          className={`contents md:flex md:w-full md:flex-col md:items-center md:border-x md:px-5 md:pb-6 md:pt-5 md:text-center ${tier.plinth} ${
                            tier.primary ? 'md:border-primary/55 md:bg-primary/[0.11]' : 'md:border-border md:bg-card'
                          }`}
                        >
                          {/* The award, in the rank's own metal. On a phone it
                              shrinks to a chip and pairs with its label on one
                              line under the name; on the podium it goes back to
                              being the tile at the top of the block. */}
                          <div className="col-start-2 row-start-3 mt-2 flex items-center gap-2 md:contents">
                            <div
                              className={`grid h-6 w-6 place-items-center rounded-lg text-medal-foreground inset-ring-1 inset-ring-foreground/15 md:h-12 md:w-12 md:rounded-xl ${tier.award}`}
                            >
                              <Icon className="h-3.5 w-3.5 md:h-6 md:w-6" aria-hidden="true" />
                            </div>
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground md:mt-2.5">
                              {tier.label}
                            </span>
                          </div>

                          <p className={`col-start-3 row-start-1 self-center text-right font-display font-semibold leading-none tabular-nums md:mt-4 md:text-center ${tier.points}`}>
                            {entry.total_points}
                            <span className="sr-only"> points</span>
                          </p>
                          <p className="col-start-3 row-start-2 self-start text-right text-xs text-muted-foreground md:mt-1.5 md:self-auto md:text-center" aria-hidden="true">Points</p>

                          {/* Where those points came from. Sunken so it reads as
                              a panel inside the block, not a second card. */}
                          <div className="col-span-3 col-start-1 row-start-4 mt-3.5 grid w-full grid-cols-3 divide-x divide-sunken-line overflow-hidden rounded-xl bg-sunken text-center inset-ring-1 inset-ring-sunken-line md:mt-4">
                            {[
                              { n: entry.count_first, l: '1st' },
                              { n: entry.count_second, l: '2nd' },
                              { n: entry.count_third, l: '3rd' },
                            ].map(({ n, l }) => (
                              <div key={l} className="px-1 py-2">
                                <div className="text-sm font-semibold leading-none tabular-nums">{n}</div>
                                <div className="mt-1 text-[11px] text-muted-foreground">{l}</div>
                              </div>
                            ))}
                          </div>

                          {/* The reason someone won, in their voters' words. One
                              element in both states so the three blocks keep the
                              same content height and the podium stays level. */}
                          {messageCount > 0 ? (
                            <button
                              type="button"
                              onClick={() => openNotes(entry)}
                              aria-label={`Read ${messageCount} anonymous ${messageCount === 1 ? 'note' : 'notes'} about ${entry.employee?.name || 'this person'}`}
                              className="col-span-3 col-start-1 row-start-5 mt-2.5 w-full rounded-xl bg-sunken px-3.5 py-2.5 text-left transition-colors inset-ring-1 inset-ring-sunken-line hover:bg-sunken-strong md:mt-3 md:min-h-[5.5rem] md:py-3"
                            >
                              <p className="line-clamp-2 text-sm leading-relaxed text-pretty">
                                &ldquo;{firstNote}&rdquo;
                              </p>
                              <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-primary-strong">
                                <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
                                {messageCount === 1 ? 'Read the note' : `Read all ${messageCount} notes`}
                              </span>
                            </button>
                          ) : (
                            <div className="col-span-3 col-start-1 row-start-5 mt-2.5 flex w-full items-center rounded-xl bg-sunken px-3.5 py-2.5 text-sm text-muted-foreground inset-ring-1 inset-ring-sunken-line md:mt-3 md:min-h-[5.5rem] md:justify-center md:py-3">
                              No notes left yet.
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>

              {/* The floor the blocks stand on */}
              <div className="hidden h-px bg-border md:block" aria-hidden="true" />
            </section>
          )}

          {/* Everyone else — one enclosure with hairline rows. A card each
              would make a team of twenty read as twenty unrelated objects. */}
          {rest.length > 0 && (
            <section aria-labelledby="all-rankings-heading">
              <h2 id="all-rankings-heading" className="mb-4 font-display text-base font-semibold tracking-tight">
                The rest of the field
              </h2>

              <ol className="overflow-hidden rounded-2xl border border-border bg-card shadow-e1 divide-y divide-border">
                {rest.map((entry, idx) => {
                  const isCurrentUser = entry.employee_id === currentUser.id;
                  const messageCount = (entry as any).message_count || 0;

                  // One grid, two shapes. On a phone the row wraps to a second
                  // line so the name gets the width it needs; from `sm` up
                  // everything sits on one line. The cells move — nothing is
                  // drawn twice.
                  return (
                    <li
                      key={entry.employee_id}
                      className="grid animate-fade-in-up grid-cols-[1.25rem_auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 px-4 py-4 transition-colors hover:bg-muted/40 sm:grid-cols-[1.25rem_auto_minmax(0,1fr)_auto_auto] sm:gap-x-4 sm:px-6"
                      style={{ animationDelay: `${Math.min(idx, 12) * 40}ms` }}
                    >
                      <span className="row-span-2 self-center text-right text-sm font-semibold tabular-nums text-muted-foreground">
                        {entry.rank}
                      </span>

                      <div className="row-span-2 grid h-10 w-10 shrink-0 place-items-center self-center overflow-hidden rounded-full bg-muted text-muted-foreground inset-ring-1 inset-ring-border sm:h-11 sm:w-11">
                        {entry.employee?.image_url ? (
                          <img src={entry.employee.image_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <User className="h-5 w-5" aria-hidden="true" />
                        )}
                      </div>

                      <div className="col-start-3 row-start-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate text-sm font-semibold sm:text-base">{entry.employee?.name}</h3>
                          {isCurrentUser && (
                            <span className="shrink-0 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary-strong">
                              You
                            </span>
                          )}
                        </div>
                        <p className="truncate text-xs text-muted-foreground sm:text-sm">
                          {entry.employee?.role}
                          {entry.employee?.department && <span> · {entry.employee.department}</span>}
                        </p>
                      </div>

                      {/* The score, and where it came from. From `sm` up this
                          is a full stat cluster — the total, then the 1st /
                          2nd / 3rd breakdown behind a rule — so the scoring is
                          legible at a glance the way it is on the podium. On a
                          phone there is no room for it, so the breakdown drops
                          to its own line below. */}
                      <div className="col-start-4 row-start-2 flex items-center justify-end sm:row-start-1 sm:gap-4">
                        <div className="flex items-baseline gap-1.5 text-right sm:block">
                          <div className="font-display text-lg font-semibold leading-none tabular-nums sm:text-2xl">
                            {entry.total_points}
                          </div>
                          <div className="text-[11px] text-muted-foreground sm:mt-1 sm:text-xs">Points</div>
                        </div>

                        <div className="hidden items-center gap-3 border-l border-border pl-4 sm:flex">
                          {[
                            { n: entry.count_first, l: '1st' },
                            { n: entry.count_second, l: '2nd' },
                            { n: entry.count_third, l: '3rd' },
                          ].map(({ n, l }) => (
                            <div key={l} className="w-7 text-center">
                              <div className="text-sm font-semibold leading-none tabular-nums">{n}</div>
                              <div className="mt-1 text-[11px] text-muted-foreground">{l}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => messageCount > 0 && openNotes(entry)}
                        disabled={messageCount === 0}
                        aria-label={
                          messageCount === 0
                            ? `No notes yet for ${entry.employee?.name || 'this person'}`
                            : `Read ${messageCount} ${messageCount === 1 ? 'note' : 'notes'} about ${entry.employee?.name || 'this person'}`
                        }
                        className="col-start-4 row-start-1 h-9 shrink-0 gap-1.5 px-2.5 sm:col-start-5"
                      >
                        <MessageCircle className="h-4 w-4" aria-hidden="true" />
                        <span className="tabular-nums">{messageCount}</span>
                      </Button>

                      {/* Phone-only: the same three numbers as the cluster
                          above, as one line of prose so the row stays two
                          lines tall instead of four. */}
                      <p className="col-start-3 row-start-2 text-xs text-muted-foreground tabular-nums sm:hidden">
                        {entry.count_first} × 1st · {entry.count_second} × 2nd · {entry.count_third} × 3rd
                      </p>
                    </li>
                  );
                })}
              </ol>
            </section>
          )}
        </div>
      )}

      {currentUser.is_admin && sharePeople.length > 0 && (
        <SharePodiumDialog
          open={shareOpen}
          onOpenChange={setShareOpen}
          people={sharePeople}
          {...getCardHeadings()}
        />
      )}

      {/* Voting Reasons Modal */}
      {selectedEmployee && (
        <VotingReasonsModal
          open={reasonsModalOpen}
          onOpenChange={setReasonsModalOpen}
          employeeName={selectedEmployee.name}
          messages={selectedEmployee.messages}
          totalPoints={selectedEmployee.totalPoints}
        />
      )}
    </div>
  );
}

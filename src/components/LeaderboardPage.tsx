import { useState, useEffect, useCallback } from 'react';
import { Trophy, Award, User, Crown, Star, MessageCircle, Calendar, Download } from 'lucide-react';
import { Employee, Election, LeaderboardEntry } from '../types';
import { api } from '../utils/api';
import { Alert, AlertDescription } from './ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { VotingReasonsModal } from './VotingReasonsModal';
import { Button } from './ui/button';
import { LoadingSpinner } from './LoadingSpinner';
import * as XLSX from 'xlsx';

interface LeaderboardPageProps {
  currentUser: Employee;
  election: Election | null;
  elections: Election[];
}

export function LeaderboardPage({ currentUser, election, elections }: LeaderboardPageProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [reasonsModalOpen, setReasonsModalOpen] = useState(false);
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
    if (selectedYear === 'all-time') {
      return `Showing all-time results (${electionsCount} elections)`;
    } else if (selectedMonth && selectedMonth !== 'full-year') {
      const monthName = months.find(m => m.value === selectedMonth)?.label || '';
      return `Showing ${monthName} ${selectedYear} (${electionsCount} ${electionsCount === 1 ? 'election' : 'elections'})`;
    } else {
      return `Showing ${selectedYear} totals (${electionsCount} ${electionsCount === 1 ? 'election' : 'elections'})`;
    }
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
      {/* Header with Time Filters */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
          <div className="animate-fade-in">
            <h2 className="text-2xl sm:text-3xl font-bold text-gradient mb-2">
              Leaderboard
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              {getFilterDescription()}
            </p>
          </div>
          
          {/* Time Period Filters */}
          <div className="flex flex-col sm:flex-row gap-3 lg:flex-shrink-0">
            {/* Year Selector */}
            <Select value={selectedYear} onValueChange={(value) => {
              setSelectedYear(value);
              if (value === 'all-time') {
                setSelectedMonth('full-year');
              }
            }}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-time">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>All Time</span>
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
                <SelectTrigger className="w-full sm:w-[200px]">
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
            
            {/* Export Button */}
            {currentUser.is_admin && (
              <Button
                variant="outline"
                onClick={exportToExcel}
                className="gap-2"
                disabled={leaderboard.length === 0 || loading}
              >
                <Download className="w-4 h-4" />
                Export
              </Button>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12" role="status" aria-live="polite">
          <div className="inline-flex items-center gap-2 text-muted-foreground">
            <LoadingSpinner />
            Loading leaderboard...
          </div>
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="text-center py-16 px-4">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center">
            <Trophy className="w-10 h-10 text-primary/40" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No Results Yet</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            No votes have been cast for this time period. Results will appear here once voting begins.
          </p>
          {selectedYear === 'all-time' || selectedMonth === 'full-year' ? (
            <p className="text-sm text-muted-foreground">
              Try selecting a different time period or create an election in the Admin panel.
            </p>
          ) : (
            <Button
              variant="outline"
              onClick={() => {
                setSelectedMonth('full-year');
              }}
              className="gap-2"
            >
              <Calendar className="w-4 h-4" />
              View Full Year
            </Button>
          )}
        </div>
      ) : (
        <div id="leaderboard-content" role="tabpanel" aria-labelledby="leaderboard-title">
          {/* Top 3 Podium */}
          {topThree.length > 0 && (
            <section className="mb-8 sm:mb-12 animate-fade-in" aria-labelledby="top-performers-heading">
              <div className="flex items-center gap-2 mb-8 sm:mb-10">
                <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/20">
                  <Crown className="w-5 h-5 text-primary" aria-hidden="true" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold" id="top-performers-heading">Top Performers</h3>
              </div>

              {/* Podium — solid blocks with a lit top face, joined into one structure */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-0 md:items-end">
                {topThree.map((entry, index) => {
                  const config = [
                    { primary: true,  label: 'Champion',    order: 'md:order-2', Icon: Crown,  iconColor: 'text-amber-300',  badge: 'bg-amber-400/15 border-amber-400/40',  plinth: 'md:pb-20', avatar: 'w-20 h-20 sm:w-24 sm:h-24', edge: '' },
                    { primary: false, label: 'Runner-up',   order: 'md:order-1', Icon: Trophy, iconColor: 'text-slate-200',  badge: 'bg-slate-300/15 border-slate-300/40',  plinth: 'md:pb-10', avatar: 'w-16 h-16 sm:w-20 sm:h-20', edge: 'md:rounded-tl-xl' },
                    { primary: false, label: 'Third place', order: 'md:order-3', Icon: Trophy, iconColor: 'text-orange-300', badge: 'bg-orange-400/15 border-orange-400/40', plinth: 'md:pb-4',  avatar: 'w-16 h-16 sm:w-20 sm:h-20', edge: 'md:rounded-tr-xl' },
                  ][index];
                  const Icon = config.Icon;
                  const isCurrentUser = entry.employee_id === currentUser.id;
                  const messageCount = (entry as any).message_count || 0;
                  const initials = (entry.employee?.name || '?')
                    .split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

                  return (
                    <div
                      key={entry.employee_id}
                      className={`flex flex-col items-center animate-fade-in-up ${config.order}`}
                      style={{ animationDelay: `${index * 90}ms` }}
                    >
                      {/* Person — stands above the platform */}
                      <div className="flex flex-col items-center text-center px-2 pb-4">
                        <div className="relative">
                          <div className={`${config.avatar} rounded-full bg-muted border overflow-hidden flex items-center justify-center text-lg font-medium text-muted-foreground ${
                            config.primary ? 'border-primary' : 'border-border'
                          }`}>
                            {entry.employee?.image_url ? (
                              <img src={entry.employee.image_url} alt={entry.employee.name} className="w-full h-full object-cover" />
                            ) : (
                              initials
                            )}
                          </div>
                          <span className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold border-2 border-background ${
                            config.primary ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                          }`}>
                            {entry.rank}
                          </span>
                        </div>

                        <div className="mt-3 flex items-center gap-1.5">
                          <span className="font-semibold truncate max-w-[12rem]">{entry.employee?.name}</span>
                          {isCurrentUser && (
                            <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-full flex-shrink-0">You</span>
                          )}
                        </div>
                        {entry.employee?.role && (
                          <p className="text-xs text-muted-foreground truncate max-w-[12rem]">{entry.employee.role}</p>
                        )}
                      </div>

                      {/* Platform — a solid block: lit top face + front face.
                          The top face is a real bordered element rotated in 3D
                          (not clip-path), so the outline wraps the whole shape. */}
                      <div className="w-full">
                        {/* Top face (desktop only) */}
                        <div
                          className={`hidden md:block h-11 border border-b-0 ${config.edge} ${
                            config.primary
                              ? 'border-primary/60 bg-primary/[0.16]'
                              : 'border-border bg-muted'
                          }`}
                          style={{ transform: 'perspective(420px) rotateX(58deg)', transformOrigin: 'bottom center' }}
                          aria-hidden="true"
                        />
                        {/* Front face */}
                        <div
                          className={`w-full rounded-xl md:rounded-none border md:border-b-0 md:border-t-0 px-4 pt-5 pb-6 flex flex-col items-center ${config.plinth} ${
                            config.primary
                              ? 'border-primary/60 bg-primary/[0.11]'
                              : 'border-border bg-card'
                          }`}
                        >
                        {/* Award badge */}
                        <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${config.badge}`}>
                          <Icon className={`w-6 h-6 ${config.iconColor}`} aria-hidden="true" />
                        </div>
                        <span className="mt-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {config.label}
                        </span>

                        <div className="mt-4 text-center">
                          <div className="text-3xl sm:text-4xl font-bold tabular-nums leading-none">{entry.total_points}</div>
                          <div className="text-xs text-muted-foreground mt-1.5">Points</div>
                        </div>

                        {/* Inner surfaces use neutral alpha, not a fixed hue, so they
                            tint with whatever block they sit in (pink or navy). */}
                        <div className="mt-4 w-full grid grid-cols-3 rounded-xl border border-white/10 divide-x divide-white/10 overflow-hidden">
                          {[
                            { n: entry.count_first, l: '1st' },
                            { n: entry.count_second, l: '2nd' },
                            { n: entry.count_third, l: '3rd' },
                          ].map(({ n, l }) => (
                            <div key={l} className="px-1 py-2 text-center bg-white/[0.03]">
                              <div className="text-sm font-semibold tabular-nums leading-none">{n}</div>
                              <div className="text-[11px] text-muted-foreground mt-1">{l}</div>
                            </div>
                          ))}
                        </div>

                        {messageCount > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedEmployee({
                                name: entry.employee?.name || 'Unknown',
                                messages: (entry as any).messages || [],
                                totalPoints: entry.total_points,
                              });
                              setReasonsModalOpen(true);
                            }}
                            className="w-full mt-3 gap-1.5 bg-white/[0.03] border-white/10 hover:bg-white/[0.08]"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span className="text-sm">{messageCount} {messageCount === 1 ? 'message' : 'messages'}</span>
                          </Button>
                        )}
                        </div>
                      </div>
                    </div>
                  );
                })}</div>
              {/* Podium floor */}
              <div className="hidden md:block h-px bg-border" aria-hidden="true" />
            </section>
          )}

          {/* Rest of the team */}
          {rest.length > 0 && (
            <section aria-labelledby="all-rankings-heading">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center border border-border">
                  <Award className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold" id="all-rankings-heading">All Rankings</h3>
              </div>
              
              <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
                {rest.map((entry, idx) => {
                  const isCurrentUser = entry.employee_id === currentUser.id;

                  return (
                    <div
                      key={entry.employee_id}
                      className="px-4 sm:px-6 py-4 sm:py-5 animate-fade-in-up transition-colors hover:bg-muted/40"
                      style={{ animationDelay: `${Math.min(idx, 12) * 40}ms` }}
                    >
                      <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                        {/* Rank Badge */}
                        <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-muted/50 border border-border flex items-center justify-center">
                          <span className="text-sm sm:text-base font-bold text-muted-foreground">
                            #{entry.rank}
                          </span>
                        </div>
                        
                        {/* Avatar & Info */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-muted/50 border border-border flex items-center justify-center">
                            {entry.employee?.image_url ? (
                              <img 
                                src={entry.employee.image_url} 
                                alt={entry.employee.name}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <User className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-semibold truncate text-sm sm:text-base">{entry.employee?.name}</h4>
                              {isCurrentUser && (
                                <div className="flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                  <Star className="w-3 h-3 fill-current" />
                                  You
                                </div>
                              )}
                            </div>
                            <p className="text-xs sm:text-sm text-muted-foreground truncate">
                              {entry.employee?.role}
                              {entry.employee?.department && (
                                <span> · {entry.employee.department}</span>
                              )}
                            </p>
                          </div>
                        </div>
                        
                        {/* Stats - Desktop */}
                        <div className="hidden sm:flex items-center gap-4">
                          {/* Total Points - Most Prominent */}
                          <div className="flex-shrink-0 text-right">
                            <div className="text-xl sm:text-2xl font-bold">
                              {entry.total_points}
                            </div>
                            <div className="text-xs text-muted-foreground">Points</div>
                          </div>
                          
                          {/* Message Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const messageCount = (entry as any).message_count || 0;
                              if (messageCount > 0) {
                                setSelectedEmployee({
                                  name: entry.employee?.name || 'Unknown',
                                  messages: (entry as any).messages || [],
                                  totalPoints: entry.total_points
                                });
                                setReasonsModalOpen(true);
                              }
                            }}
                            className="flex items-center gap-1.5"
                            disabled={(entry as any).message_count === 0}
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span>{(entry as any).message_count || 0}</span>
                          </Button>
                          
                          {/* Vote Breakdown */}
                          <div className="flex items-center gap-3 pl-4 border-l border-border">
                            <div className="text-center">
                              <div className="text-sm font-semibold mb-0.5">{entry.count_first}</div>
                              <div className="text-xs text-muted-foreground">1st</div>
                            </div>
                            <div className="text-center">
                              <div className="text-sm font-semibold mb-0.5">{entry.count_second}</div>
                              <div className="text-xs text-muted-foreground">2nd</div>
                            </div>
                            <div className="text-center">
                              <div className="text-sm font-semibold mb-0.5">{entry.count_third}</div>
                              <div className="text-xs text-muted-foreground">3rd</div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Mobile stats */}
                      <div className="sm:hidden mt-4 space-y-3">
                        {/* Points */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Total Points</span>
                          <span className="text-xl font-bold">{entry.total_points}</span>
                        </div>
                        
                        {/* Vote breakdown */}
                        <div className="flex items-center gap-3 pt-3 border-t border-border">
                          <div className="flex-1 text-center">
                            <div className="text-sm font-semibold mb-0.5">{entry.count_first}</div>
                            <div className="text-xs text-muted-foreground">1st Place</div>
                          </div>
                          <div className="flex-1 text-center">
                            <div className="text-sm font-semibold mb-0.5">{entry.count_second}</div>
                            <div className="text-xs text-muted-foreground">2nd Place</div>
                          </div>
                          <div className="flex-1 text-center">
                            <div className="text-sm font-semibold mb-0.5">{entry.count_third}</div>
                            <div className="text-xs text-muted-foreground">3rd Place</div>
                          </div>
                        </div>
                        
                        {/* Message button */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const messageCount = (entry as any).message_count || 0;
                            if (messageCount > 0) {
                              setSelectedEmployee({
                                name: entry.employee?.name || 'Unknown',
                                messages: (entry as any).messages || [],
                                totalPoints: entry.total_points
                              });
                              setReasonsModalOpen(true);
                            }
                          }}
                          className="w-full flex items-center justify-center gap-1.5"
                          disabled={(entry as any).message_count === 0}
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>{(entry as any).message_count || 0} Messages</span>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
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
import { useState, useEffect, useCallback } from 'react';
import { Trophy, Medal, Award, User, Crown, Star, MessageCircle, Calendar, Download } from 'lucide-react';
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
      { wch: 6 },  // Rank
      { wch: 20 }, // Name
      { wch: 20 }, // Role
      { wch: 20 }, // Department
      { wch: 12 }, // Total Points
      { wch: 16 }, // 1st Place
      { wch: 16 }, // 2nd Place
      { wch: 16 }, // 3rd Place
      { wch: 10 }  // Messages
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
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent mb-2">
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
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
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
            <section className="mb-8 sm:mb-12" aria-labelledby="top-performers-heading">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center border border-border">
                  <Crown className="w-5 h-5 text-foreground" aria-hidden="true" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold" id="top-performers-heading">Top Performers</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                {topThree.map((entry, index) => {
                  const icons = [Trophy, Medal, Award];
                  const Icon = icons[index];
                  const gradients = [
                    'from-yellow-400 via-yellow-500 to-yellow-600',
                    'from-slate-300 via-slate-400 to-slate-500',
                    'from-amber-600 via-orange-600 to-orange-700'
                  ];
                  
                  const isCurrentUser = entry.employee_id === currentUser.id;
                  
                  return (
                    <div
                      key={entry.employee_id}
                      className="relative bg-card border border-border rounded-2xl p-4 sm:p-6 transition-all hover:border-border/80"
                    >
                      {/* Rank badge */}
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br ${gradients[index]} flex items-center justify-center shadow-md`}>
                          <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-center text-center pt-4 sm:pt-6">
                        {/* Avatar */}
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center mb-3 sm:mb-4 border-2 border-border">
                          {entry.employee?.image_url ? (
                            <img 
                              src={entry.employee.image_url} 
                              alt={entry.employee.name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <User className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground" />
                          )}
                        </div>
                        
                        {/* Name & Role */}
                        <h3 className="mb-1 text-base sm:text-lg">{entry.employee?.name}</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">
                          {entry.employee?.role}
                        </p>
                        
                        {/* Points breakdown */}
                        <div className="w-full space-y-3">
                          <div className="bg-muted/50 rounded-lg p-3 sm:p-4 border border-border">
                            <div className="text-2xl sm:text-3xl mb-1 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                              {entry.total_points}
                            </div>
                            <div className="text-xs text-muted-foreground">Total Points</div>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-2">
                            <div className="bg-muted/30 rounded-lg p-2 sm:p-3 border border-border">
                              <div className="text-base sm:text-lg mb-1">{entry.count_first}</div>
                              <div className="text-xs text-muted-foreground">1st</div>
                            </div>
                            <div className="bg-muted/30 rounded-lg p-2 sm:p-3 border border-border">
                              <div className="text-base sm:text-lg mb-1">{entry.count_second}</div>
                              <div className="text-xs text-muted-foreground">2nd</div>
                            </div>
                            <div className="bg-muted/30 rounded-lg p-2 sm:p-3 border border-border">
                              <div className="text-base sm:text-lg mb-1">{entry.count_third}</div>
                              <div className="text-xs text-muted-foreground">3rd</div>
                            </div>
                          </div>

                          {/* Message Button - Always show */}
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
                            <span className="text-xs sm:text-sm">{(entry as any).message_count || 0} Messages</span>
                          </Button>
                        </div>
                        
                        {isCurrentUser && (
                          <div className="mt-3 sm:mt-4 flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 sm:px-3 py-1 rounded-full">
                            <Star className="w-3 h-3 fill-current" />
                            You
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}</div>
            </section>
          )}

          {/* Rest of the team */}
          {rest.length > 0 && (
            <section aria-labelledby="all-rankings-heading">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center border border-border">
                  <Award className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold" id="all-rankings-heading">All Rankings</h3>
              </div>
              
              <div className="space-y-3">
                {rest.map((entry) => {
                  const isCurrentUser = entry.employee_id === currentUser.id;
                  
                  return (
                    <div
                      key={entry.employee_id}
                      className="bg-card border border-border rounded-xl p-4 sm:p-5 transition-all hover:border-border/80"
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
                          <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-muted/50 to-muted border border-border flex items-center justify-center">
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
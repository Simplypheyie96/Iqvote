import { User, Check, Award, Lock } from 'lucide-react';
import { Employee } from '../types';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';

interface EmployeeCardProps {
  employee: Employee;
  selectedRank: number | null;
  onSelectRank: (rank: number) => void;
  disabled: boolean;
  reason?: string;
  onReasonChange?: (reason: string) => void;
  /** Position in the list — drives the staggered entrance animation. */
  index?: number;
}

const RANKS = [
  {
    rank: 1,
    label: '1st',
    points: 5,
    emoji: '🥇',
    // Selected-button treatment (metallic gold)
    selected: 'bg-gradient-to-br from-amber-300 to-yellow-500 text-amber-950 border-transparent shadow-lg shadow-amber-500/30',
    ring: 'ring-amber-400/50',
  },
  {
    rank: 2,
    label: '2nd',
    points: 3,
    emoji: '🥈',
    selected: 'bg-gradient-to-br from-slate-200 to-slate-400 text-slate-800 border-transparent shadow-lg shadow-slate-400/30',
    ring: 'ring-slate-400/50',
  },
  {
    rank: 3,
    label: '3rd',
    points: 2,
    emoji: '🥉',
    selected: 'bg-gradient-to-br from-orange-300 to-amber-600 text-orange-950 border-transparent shadow-lg shadow-orange-500/30',
    ring: 'ring-orange-400/50',
  },
] as const;

export function EmployeeCard({
  employee,
  selectedRank,
  onSelectRank,
  disabled,
  reason,
  onReasonChange,
  index = 0,
}: EmployeeCardProps) {
  const activeRank = selectedRank ? RANKS.find((r) => r.rank === selectedRank) : null;

  return (
    <div
      className={`group relative bg-card border rounded-2xl p-4 sm:p-5 animate-fade-in-up transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/5 ${
        activeRank
          ? `border-transparent ring-2 ${activeRank.ring} shadow-lg`
          : 'border-border hover:border-primary/30'
      }`}
      style={{ animationDelay: `${Math.min(index, 12) * 45}ms` }}
      role="article"
      aria-label={`${employee.name}, ${employee.role}`}
    >
      {/* Selected medal badge */}
      {activeRank && (
        <div
          className={`absolute -top-2.5 -right-2.5 w-9 h-9 rounded-full ${activeRank.selected} flex items-center justify-center text-lg animate-pop border-2 border-background`}
          aria-hidden="true"
        >
          {activeRank.emoji}
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 w-full sm:w-auto">
          <div
            className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent flex items-center justify-center flex-shrink-0 border border-primary/20 shadow-inner overflow-hidden transition-transform duration-300 group-hover:scale-105"
            aria-hidden="true"
          >
            {employee.image_url ? (
              <img
                src={employee.image_url}
                alt={employee.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="truncate font-semibold text-foreground text-sm sm:text-base">{employee.name}</h3>
            <p className="text-xs sm:text-sm text-muted-foreground truncate flex items-center gap-1.5">
              <Award className="w-3 h-3 flex-shrink-0" />
              {employee.role}
            </p>
          </div>
        </div>

        <div className="flex gap-2 w-full sm:w-auto" role="group" aria-label={`Vote for ${employee.name}`}>
          {RANKS.map(({ rank, label, points, selected }) => {
            const isSelected = selectedRank === rank;

            return (
              <Button
                key={rank}
                variant={isSelected ? 'default' : 'outline'}
                size="sm"
                onClick={() => onSelectRank(rank)}
                disabled={disabled && !isSelected}
                className={`flex-1 sm:flex-none sm:min-w-[74px] gap-1.5 transition-all duration-300 ${
                  isSelected
                    ? `${selected} scale-[1.03] hover:brightness-105`
                    : 'hover:border-primary/50 hover:-translate-y-0.5'
                }`}
                aria-label={`Vote ${label} place for ${employee.name}, worth ${points} points${isSelected ? ', currently selected' : ''}`}
                aria-pressed={isSelected}
              >
                {isSelected && <Check className="w-3.5 h-3.5" aria-hidden="true" />}
                <span className="font-semibold">{label}</span>
                <span className="text-xs opacity-75">({points}pt)</span>
              </Button>
            );
          })}
        </div>
      </div>

      {activeRank && onReasonChange && (
        <div className="mt-4 pt-4 border-t border-border animate-fade-in">
          <Label htmlFor={`reason-${employee.id}`} className="text-sm text-muted-foreground">
            Why did you choose this person? (Optional)
          </Label>
          <Textarea
            id={`reason-${employee.id}`}
            value={reason || ''}
            onChange={(e) => onReasonChange(e.target.value)}
            placeholder="Share your reason anonymously (visible to everyone)..."
            className="mt-1.5 resize-none"
            rows={2}
          />
          <p className="text-xs text-muted-foreground mt-1.5 flex items-start gap-1.5">
            <Lock className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              Shared <strong>completely anonymously</strong> on the leaderboard. No one (not even admins) will know who wrote it.
            </span>
          </p>
        </div>
      )}
    </div>
  );
}

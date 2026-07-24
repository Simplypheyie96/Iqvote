import { Lock } from 'lucide-react';
import { Employee } from '../types';
import { Textarea } from './ui/textarea';

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
  { rank: 1, label: '1st', points: 5 },
  { rank: 2, label: '2nd', points: 3 },
  { rank: 3, label: '3rd', points: 2 },
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
  const isSelectedAny = selectedRank !== null;
  const initials = employee.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const meta = [employee.role, employee.department].filter(Boolean).join(' · ');

  return (
    <div
      className="animate-fade-in-up"
      style={{ animationDelay: `${Math.min(index, 12) * 30}ms` }}
      role="article"
      aria-label={`${employee.name}, ${employee.role}`}
    >
      <div
        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
          isSelectedAny ? 'bg-primary/[0.06]' : 'hover:bg-muted/60'
        }`}
      >
        {/* Avatar */}
        <div
          className="w-9 h-9 rounded-full bg-muted border border-border flex items-center justify-center overflow-hidden flex-shrink-0 text-xs font-medium text-muted-foreground"
          aria-hidden="true"
        >
          {employee.image_url ? (
            <img src={employee.image_url} alt={employee.name} className="w-full h-full object-cover" />
          ) : (
            initials
          )}
        </div>

        {/* Name + role */}
        <div className="flex-1 min-w-0">
          <div className="truncate text-sm font-medium text-foreground">{employee.name}</div>
          <div className="truncate text-xs text-muted-foreground">{meta}</div>
        </div>

        {/* Rank selector — compact segmented control */}
        <div
          className="flex items-center gap-0.5 rounded-xl bg-muted p-0.5 flex-shrink-0"
          role="group"
          aria-label={`Vote for ${employee.name}`}
        >
          {RANKS.map(({ rank, label, points }) => {
            const isSelected = selectedRank === rank;
            return (
              <button
                key={rank}
                type="button"
                onClick={() => onSelectRank(rank)}
                disabled={disabled && !isSelected}
                title={`${label} place · ${points} points`}
                aria-pressed={isSelected}
                aria-label={`Vote ${label} place for ${employee.name}, ${points} points`}
                className={`h-7 px-2.5 rounded-xl text-xs font-medium transition-colors disabled:opacity-40 disabled:pointer-events-none ${
                  isSelected
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Optional anonymous reason */}
      {isSelectedAny && onReasonChange && (
        <div className="mt-2 ml-12 mr-1 animate-fade-in">
          <Textarea
            id={`reason-${employee.id}`}
            value={reason || ''}
            onChange={(e) => onReasonChange(e.target.value)}
            placeholder="Add an optional note — shared anonymously…"
            className="resize-none text-sm"
            rows={2}
          />
          <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5">
            <Lock className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
            Posted anonymously — no one, not even admins, sees who wrote it.
          </p>
        </div>
      )}
    </div>
  );
}

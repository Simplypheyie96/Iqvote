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
  /** Ranks currently held by someone else. Shown so it's obvious a tap will
      move that place rather than silently taking a free one. */
  takenRanks?: number[];
}

const RANKS = [
  { rank: 1, label: '1st', points: 5 },
  { rank: 2, label: '2nd', points: 3 },
  { rank: 3, label: '3rd', points: 2 },
] as const;

const RANK_LABEL: Record<number, string> = { 1: '1st', 2: '2nd', 3: '3rd' };
const RANK_POINTS: Record<number, number> = { 1: 5, 2: 3, 3: 2 };

export function EmployeeCard({
  employee,
  selectedRank,
  onSelectRank,
  disabled,
  reason,
  onReasonChange,
  index = 0,
  takenRanks = [],
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
        className={`relative flex flex-col gap-3 rounded-xl px-3 py-2.5 transition-colors duration-200 sm:flex-row sm:items-center ${
          isSelectedAny
            ? 'bg-primary/[0.09] inset-ring-2 inset-ring-primary/45'
            : 'hover:bg-muted/60'
        }`}
      >
        {/* A picked row reads through three things at once: the tint, this
            ring, and the rank chip at the end of the row. There used to be a
            pink spine at `left-0` as well, but it sat directly on top of the
            ring and made that one edge look thicker than the other three. */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {/* Avatar */}
          <div
            className={`relative h-9 w-9 flex-shrink-0 overflow-hidden rounded-full bg-muted text-xs font-medium text-muted-foreground ${
              isSelectedAny ? 'inset-ring-2 inset-ring-primary/50' : 'inset-ring-1 inset-ring-border'
            } flex items-center justify-center`}
            aria-hidden="true"
          >
            {employee.image_url ? (
              <img src={employee.image_url} alt="" className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </div>

          {/* Name + role */}
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-foreground">{employee.name}</div>
            <div className="truncate text-xs text-muted-foreground">
              {isSelectedAny ? (
                <span className="font-medium text-primary-strong">
                  {RANK_LABEL[selectedRank!]} place · {RANK_POINTS[selectedRank!]} pts
                </span>
              ) : (
                meta
              )}
            </div>
          </div>
        </div>

        {/* Once the ballot is locked the control stops being a control. A row
            of dimmed buttons invites a tap that will never do anything; a
            static chip says the decision is already made. */}
        {disabled ? (
          isSelectedAny ? (
            <span className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full bg-primary/12 px-3 py-1.5 text-xs font-semibold text-primary-strong inset-ring-1 inset-ring-primary/25 max-sm:self-start">
              <Lock className="h-3 w-3" aria-hidden="true" />
              {RANK_LABEL[selectedRank!]} · {RANK_POINTS[selectedRank!]} pts
            </span>
          ) : (
            <span className="flex-shrink-0 text-xs text-muted-foreground max-sm:hidden">
              Not ranked
            </span>
          )
        ) : (
          /* Rank selector — compact segmented control. Sits on its own line on
             a phone so the three targets stay a comfortable size instead of
             being squeezed against a long name. */
          <div
            className="flex flex-shrink-0 items-center gap-0.5 rounded-full bg-muted p-1 inset-ring-1 inset-ring-border/60 max-sm:w-full"
            role="group"
            aria-label={`Vote for ${employee.name}`}
          >
            {RANKS.map(({ rank, label, points }) => {
              const isSelected = selectedRank === rank;
              const heldByAnother = !isSelected && takenRanks.includes(rank);
              return (
                <button
                  key={rank}
                  type="button"
                  onClick={() => onSelectRank(rank)}
                  title={
                    heldByAnother
                      ? `${label} place is taken — this will move it`
                      : `${label} place · ${points} points`
                  }
                  aria-pressed={isSelected}
                  aria-label={`Vote ${label} place for ${employee.name}, ${points} points`}
                  className={`h-8 flex-1 rounded-full px-3 text-xs font-medium transition-[background-color,color,transform] duration-200 active:scale-[0.96] sm:flex-none ${
                    isSelected
                      ? 'bg-primary font-semibold text-primary-foreground'
                      : heldByAnother
                        ? 'text-muted-foreground/50 hover:bg-background hover:text-foreground'
                        : 'text-muted-foreground hover:bg-background hover:text-foreground'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Optional anonymous reason */}
      {isSelectedAny && onReasonChange && (
        <div className="animate-fade-in mt-2 mr-1 ml-3 sm:ml-12">
          <Textarea
            id={`reason-${employee.id}`}
            value={reason || ''}
            onChange={(e) => onReasonChange(e.target.value)}
            placeholder={`Why ${employee.name.split(' ')[0]}? Optional.`}
            className="resize-none text-sm"
            rows={2}
          />
          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
            Shown anonymously on the leaderboard. No one, admins included, sees who wrote it.
          </p>
        </div>
      )}
    </div>
  );
}

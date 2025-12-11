import { User, Check, Award } from 'lucide-react';
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
}

export function EmployeeCard({ employee, selectedRank, onSelectRank, disabled, reason, onReasonChange }: EmployeeCardProps) {
  const ranks = [
    { rank: 1, label: '1st', points: 5, gradient: 'from-yellow-400 to-yellow-600', icon: '🥇' },
    { rank: 2, label: '2nd', points: 3, gradient: 'from-gray-300 to-gray-500', icon: '🥈' },
    { rank: 3, label: '3rd', points: 2, gradient: 'from-orange-400 to-orange-600', icon: '🥉' },
  ];

  return (
    <div 
      className={`group relative bg-card border border-border rounded-xl p-4 sm:p-5 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30 ${
        selectedRank ? 'ring-2 ring-primary/20 shadow-lg shadow-primary/10' : ''
      }`}
      role="article"
      aria-label={`${employee.name}, ${employee.role}`}
    >
      {selectedRank && (
        <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/30 border-2 border-background">
          <Check className="w-4 h-4 text-primary-foreground" />
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 w-full sm:w-auto">
          <div 
            className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent flex items-center justify-center flex-shrink-0 border border-primary/20 shadow-inner overflow-hidden"
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
            {selectedRank && (
              <div className="absolute -bottom-1 -right-1 text-base sm:text-lg">
                {ranks.find(r => r.rank === selectedRank)?.icon}
              </div>
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
          {ranks.map(({ rank, label, points, gradient }) => {
            const isSelected = selectedRank === rank;
            
            return (
              <Button
                key={rank}
                variant={isSelected ? 'default' : 'outline'}
                size="sm"
                onClick={() => onSelectRank(rank)}
                disabled={disabled && !isSelected}
                className={`flex-1 sm:flex-none sm:min-w-[70px] gap-1.5 transition-all duration-300 ${
                  isSelected 
                    ? 'shadow-lg shadow-primary/30 scale-105' 
                    : 'hover:scale-105 hover:border-primary/50'
                }`}
                aria-label={`Vote ${label} place for ${employee.name}, worth ${points} points${isSelected ? ', currently selected' : ''}`}
                aria-pressed={isSelected}
              >
                {isSelected && <Check className="w-3.5 h-3.5" aria-hidden="true" />}
                <span className="font-semibold">{label}</span>
                <span className="text-xs opacity-70">({points}pt)</span>
              </Button>
            );
          })}
        </div>
      </div>
      
      {selectedRank && onReasonChange && (
        <div className="mt-4 pt-4 border-t border-border">
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
          <p className="text-xs text-muted-foreground mt-1 flex items-start gap-1.5">
            <span className="text-primary">🔒</span>
            <span>
              This message will be shared <strong>completely anonymously</strong> on the leaderboard. No one (not even admins) will know who wrote it.
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
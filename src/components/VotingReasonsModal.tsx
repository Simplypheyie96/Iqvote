import { MessageCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';

interface VotingReasonsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeName: string;
  messages: string[];
  totalPoints: number;
}

export function VotingReasonsModal({
  open,
  onOpenChange,
  employeeName,
  messages,
  totalPoints
}: VotingReasonsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] max-w-2xl flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="font-display tracking-tight">Why people voted for {employeeName}</DialogTitle>
          <DialogDescription className="text-pretty">
            {messages.length === 1 ? 'One note' : `${messages.length} notes`}, left anonymously
            {' · '}
            <span className="tabular-nums">{totalPoints}</span> points in total
          </DialogDescription>
        </DialogHeader>

        {/* The notes are the content — they don't need a stat panel above them
            repeating two numbers the sentence has already given. */}
        <div className="-mr-2 flex-1 overflow-y-auto pr-2">
          {messages.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center">
              <p className="text-sm text-muted-foreground text-pretty">
                No notes were left for {employeeName}.
              </p>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {messages.map((message, index) => (
                <li
                  key={index}
                  className="rounded-xl bg-muted/50 px-4 py-3.5 inset-ring-1 inset-ring-border"
                >
                  <p className="text-sm leading-relaxed break-words text-pretty">{message}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="flex shrink-0 items-start gap-2 border-t border-border pt-4 text-xs text-muted-foreground text-pretty">
          <MessageCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>Nobody — not even an admin — can see who wrote which note.</span>
        </p>
      </DialogContent>
    </Dialog>
  );
}

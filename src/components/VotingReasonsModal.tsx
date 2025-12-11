import { MessageCircle, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';

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
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            Why People Voted for {employeeName}
          </DialogTitle>
          <DialogDescription>
            {messages.length} anonymous {messages.length === 1 ? 'message' : 'messages'} from voters
          </DialogDescription>
        </DialogHeader>

        <div className="mb-4 p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Total Points</p>
              <p className="text-2xl font-bold text-primary">{totalPoints}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Messages</p>
              <p className="text-2xl font-bold">{messages.length}</p>
            </div>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 pr-2">
          <div className="space-y-3">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No messages yet</p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg bg-muted/50 border border-border hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="mt-0.5 flex-shrink-0">
                      #{index + 1}
                    </Badge>
                    <p className="text-sm leading-relaxed flex-1 break-words">{message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 flex-shrink-0">
          <p className="text-xs text-blue-600 dark:text-blue-400 flex items-start gap-2">
            <MessageCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>
              <strong>100% Anonymous:</strong> All messages are completely anonymous. No one (not even admins) can see who wrote which message. This ensures fairness and prevents bias.
            </span>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
import { AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import type { SendOutcome } from '../utils/emailSend';

/* The result of one send. One banner, in the tone the outcome actually
   deserves, and — when it failed — the cause and the fix rather than a wall of
   Brevo's own prose to interpret yourself.

   Shared by the elections screen and the turnout screen so a send reports
   itself the same way wherever it was pressed. */
export function EmailSendResult({ result }: { result: SendOutcome | null }) {
  if (!result) return null;

  const toneBorder =
    result.tone === 'success' ? 'border-success/50 bg-success/10'
      : result.tone === 'warning' ? 'border-warning/50 bg-warning/10'
      : 'border-destructive/50 bg-destructive/10';

  const toneText =
    result.tone === 'success' ? 'text-success'
      : result.tone === 'warning' ? 'text-warning'
      : 'text-destructive';

  return (
    <Alert className={toneBorder}>
      {result.tone === 'success'
        ? <CheckCircle2 className="h-4 w-4 text-success" />
        : result.tone === 'warning'
          ? <AlertTriangle className="h-4 w-4 text-warning" />
          : <AlertCircle className="h-4 w-4 text-destructive" />}
      {/* AlertTitle clamps to one line, which on a phone cuts the headline off
          mid-sentence — and the headline is the whole verdict. Let it wrap. */}
      <AlertTitle className={`line-clamp-none text-pretty ${toneText}`}>{result.title}</AlertTitle>
      {(result.cause || result.fix || result.detail) && (
        <AlertDescription className="gap-2">
          {result.cause && <p>{result.cause}</p>}
          {result.fix && (
            <p>
              {result.fix}
              {result.fixHref && (
                <>
                  {' '}
                  <a
                    href={result.fixHref}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-foreground underline underline-offset-4 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm"
                  >
                    {result.fixLabel || 'Open Brevo'}
                  </a>
                </>
              )}
            </p>
          )}
          {result.detail && (
            <p className="mt-1 break-words text-xs text-muted-foreground/80">
              Brevo said: {result.detail}
            </p>
          )}
        </AlertDescription>
      )}
    </Alert>
  );
}

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
  inline?: boolean;
}

const SIZE = {
  sm: 'w-4 h-4',
  md: 'w-7 h-7',
  lg: 'w-10 h-10',
} as const;

const TEXT = {
  sm: 'text-sm',
  md: 'text-sm',
  lg: 'text-base',
} as const;

/** Clean circular spinner — a faint track with a rotating arc. */
function Spinner({ size, className = '' }: { size: 'sm' | 'md' | 'lg'; className?: string }) {
  return (
    <span
      className={`inline-block ${SIZE[size]} rounded-full border-2 border-current/25 border-t-current animate-spin align-[-0.125em] ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}

export function LoadingSpinner({ size = 'md', text, fullScreen = false, inline = false }: LoadingSpinnerProps) {
  if (inline || (!text && !fullScreen)) {
    return <Spinner size={size} className={inline ? 'text-current' : 'text-primary'} />;
  }

  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      <Spinner size={size} className="text-primary" />
      {text && <p className={`${TEXT[size]} text-muted-foreground`}>{text}</p>}
    </div>
  );

  if (fullScreen) {
    return <div className="min-h-screen flex items-center justify-center bg-background">{content}</div>;
  }
  return content;
}

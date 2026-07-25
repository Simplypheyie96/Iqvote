interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
  inline?: boolean;
}

// Podium heights per size — middle bar tallest, like a leaderboard podium.
const BARS = {
  sm: { w: 'w-1', h: ['h-2.5', 'h-4', 'h-3'], gap: 'gap-0.5' },
  md: { w: 'w-1.5', h: ['h-4', 'h-6', 'h-5'], gap: 'gap-1' },
  lg: { w: 'w-2', h: ['h-6', 'h-9', 'h-7'], gap: 'gap-1.5' },
} as const;

const TEXT = { sm: 'text-sm', md: 'text-sm', lg: 'text-base' } as const;

/** Thematic loader: three podium bars rising in a wave (voting / ranking motif). */
function PodiumLoader({ size, className = '' }: { size: 'sm' | 'md' | 'lg'; className?: string }) {
  const cfg = BARS[size];
  return (
    <span className={`inline-flex items-end ${cfg.gap} ${className}`} role="status" aria-label="Loading">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={`${cfg.w} ${cfg.h[i]} rounded-full bg-current origin-bottom`}
          style={{ animation: 'podium-rise 1s ease-in-out infinite', animationDelay: `${[0.15, 0, 0.3][i]}s` }}
        />
      ))}
    </span>
  );
}

export function LoadingSpinner({ size = 'md', text, fullScreen = false, inline = false }: LoadingSpinnerProps) {
  if (inline || (!text && !fullScreen)) {
    return <PodiumLoader size={size} className={inline ? 'text-current' : 'text-primary-strong'} />;
  }

  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      <PodiumLoader size={size} className="text-primary-strong" />
      {text && <p className={`${TEXT[size]} text-muted-foreground`}>{text}</p>}
    </div>
  );

  if (fullScreen) {
    return <div className="min-h-screen flex items-center justify-center bg-background">{content}</div>;
  }
  return content;
}

import { Monitor, Moon, Sun } from 'lucide-react';
import { Theme, useTheme } from './ThemeProvider';

const OPTIONS: { value: Theme; label: string; Icon: typeof Sun }[] = [
  { value: 'system', label: 'System', Icon: Monitor },
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'dark', label: 'Dark', Icon: Moon },
];

interface ThemeToggleProps {
  /** 'icon' for the nav bar, 'labeled' for the mobile menu. */
  variant?: 'icon' | 'labeled';
  className?: string;
}

/**
 * Three-way theme control. "System" is a real, selectable option rather than a
 * hidden default — a two-state sun/moon switch can't express "follow my OS",
 * which is what most people actually want.
 */
export function ThemeToggle({ variant = 'icon', className = '' }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const activeIndex = Math.max(0, OPTIONS.findIndex(o => o.value === theme));
  const labeled = variant === 'labeled';

  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className={`relative isolate flex items-center gap-0.5 rounded-full border border-border bg-card p-1 ${
        labeled ? 'w-full' : ''
      } ${className}`}
    >
      {/* One indicator that slides, rather than two separate fades — the change
          reads as a single object travelling between positions. */}
      <span
        aria-hidden="true"
        className="absolute inset-y-1 left-1 -z-10 rounded-full bg-background shadow-e1 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{
          width: labeled ? 'calc((100% - 0.75rem) / 3)' : '1.75rem',
          transform: labeled
            ? `translateX(calc(${activeIndex} * (100% + 0.125rem)))`
            : `translateX(calc(${activeIndex} * 1.875rem))`,
        }}
      />

      {OPTIONS.map(({ value, label, Icon }) => {
        const isActive = theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={`${label} theme`}
            onClick={() => setTheme(value)}
            className={`relative grid place-items-center rounded-full font-medium transition-colors duration-200 ${
              labeled ? 'flex-1 h-8 grid-flow-col gap-1.5' : 'w-7 h-7'
            } ${isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Icon className={labeled ? 'w-4 h-4' : 'w-3.5 h-3.5'} aria-hidden="true" />
            {labeled && <span className="text-xs">{label}</span>}
          </button>
        );
      })}
    </div>
  );
}

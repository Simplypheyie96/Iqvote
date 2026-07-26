import { useCallback, useEffect, useRef, useState } from 'react';
import { Download, ImageIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Skeleton } from './ui/skeleton';
import {
  drawPodiumCard,
  podiumCardFilename,
  type CardSize,
  type CardTheme,
  type PodiumPerson,
} from '../utils/podiumCard';
import logoImageLight from 'figma:asset/adf5897e345947bbe763382a76a190054bc17e88.png';
import logoImageDark from 'figma:asset/edd81dc1188a78ee35f46489ff2f13306860893c.png';

interface SharePodiumDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The top three the leaderboard has already ranked. Nothing is recomputed here. */
  people: PodiumPerson[];
  title: string;
  subtitle: string;
}

const SIZES: { value: CardSize; label: string; hint: string }[] = [
  { value: 'landscape', label: 'Wide', hint: '1200 × 675' },
  { value: 'square', label: 'Square', hint: '1080 × 1080' },
];

const THEMES: { value: CardTheme; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

/** The same segmented track used by the header nav and the auth tabs. */
function Segmented<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div
      className="flex h-11 items-center gap-1 rounded-full bg-muted/70 p-1 inset-ring-1 inset-ring-border/60"
      role="group"
      aria-label={label}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
          className={`h-9 rounded-full px-4 text-sm transition-colors ${
            value === option.value
              ? 'bg-background font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.06)] inset-ring-1 inset-ring-border'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function SharePodiumDialog({
  open,
  onOpenChange,
  people,
  title,
  subtitle,
}: SharePodiumDialogProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState<CardSize>('landscape');
  const [theme, setTheme] = useState<CardTheme>(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light',
  );
  const [rendering, setRendering] = useState(true);

  const render = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setRendering(true);
    await drawPodiumCard(
      canvas,
      {
        people,
        title,
        subtitle,
        logoSrc: theme === 'dark' ? logoImageDark : logoImageLight,
      },
      theme,
      size,
      2,
    );
    setRendering(false);
  }, [people, title, subtitle, theme, size]);

  useEffect(() => {
    if (!open) return;
    // The canvas only exists once the dialog content has mounted.
    let cancelled = false;
    const id = requestAnimationFrame(() => {
      if (!cancelled) void render();
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(id);
    };
  }, [open, render]);

  function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = podiumCardFilename(subtitle, size);
      link.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-3xl flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="font-display tracking-tight">Share the podium</DialogTitle>
          <DialogDescription className="text-pretty">
            A branded image of the top three, ready to post. Exported at twice the listed
            size so it stays sharp on any screen.
          </DialogDescription>
        </DialogHeader>

        <div className="-mr-2 flex-1 overflow-y-auto pr-2">
          {/* The preview is the card itself at whatever width is available —
              what you see here is exactly what downloads. */}
          <div className="rounded-2xl bg-sunken p-4 inset-ring-1 inset-ring-sunken-line sm:p-6">
            <div className="relative mx-auto max-w-full">
              <canvas
                ref={canvasRef}
                className={`mx-auto block h-auto w-full rounded-xl transition-opacity duration-200 ${
                  rendering ? 'opacity-0' : 'opacity-100'
                } ${size === 'square' ? 'max-w-[26rem]' : ''}`}
                role="img"
                aria-label={`Podium card: ${title}, ${subtitle}. ${people
                  .map((p, i) => `${i + 1}. ${p.name}, ${p.points} points`)
                  .join('. ')}`}
              />
              {rendering && (
                <Skeleton
                  className={`absolute inset-0 mx-auto rounded-xl ${
                    size === 'square' ? 'max-w-[26rem]' : ''
                  }`}
                />
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">Shape</p>
                <Segmented label="Card shape" value={size} onChange={setSize} options={SIZES} />
              </div>
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">Card</p>
                <Segmented label="Card theme" value={theme} onChange={setTheme} options={THEMES} />
              </div>
            </div>

            <Button onClick={download} disabled={rendering} className="h-11 gap-2 sm:shrink-0">
              <Download className="h-4 w-4" aria-hidden="true" />
              Download PNG
            </Button>
          </div>

          <p className="mt-5 flex items-start gap-2 border-t border-border pt-4 text-xs text-muted-foreground text-pretty">
            <ImageIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>
              Only names, roles and points appear on the card. The anonymous notes people
              left are never included.
            </span>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * The rank badge — one component so 1st place looks identical on the ballot,
 * in the confirmation dialog, on the podium and in the shared image.
 *
 * It replaces the emoji medals the app used to draw (🥇🥈🥉). Emoji render
 * differently on every platform, can't be recoloured, don't scale with the
 * type ramp, and are read aloud as "1st place medal" in the middle of a
 * sentence that already says the rank.
 */

export const RANK_LABEL: Record<number, string> = { 1: '1st', 2: '2nd', 3: '3rd' };
export const RANK_POINTS: Record<number, number> = { 1: 5, 2: 3, 3: 2 };

/* Fills come from the medal tokens; the numeral is always the dark medal
   foreground, which clears AA on all three metals in both themes. */
const MEDAL_FILL: Record<number, string> = {
  1: 'bg-medal-1',
  2: 'bg-medal-2',
  3: 'bg-medal-3',
};

const SIZES = {
  xs: 'h-5 w-5 text-[10px]',
  sm: 'h-6 w-6 text-[11px]',
  md: 'h-8 w-8 text-sm',
  lg: 'h-11 w-11 text-lg',
} as const;

interface RankMedalProps {
  rank: number;
  size?: keyof typeof SIZES;
  className?: string;
}

export function RankMedal({ rank, size = 'md', className = '' }: RankMedalProps) {
  const fill = MEDAL_FILL[rank] ?? 'bg-muted';

  return (
    <span
      /* The hairline isn't decoration: gold on a white page measures 1.9,
         so without an edge the disc dissolves into the card. */
      className={`inline-grid shrink-0 place-items-center rounded-full font-semibold tabular-nums text-medal-foreground inset-ring-1 inset-ring-foreground/15 ${fill} ${SIZES[size]} ${className}`}
      aria-hidden="true"
    >
      {rank}
    </span>
  );
}

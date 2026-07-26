/**
 * The admin tab row, styled once.
 *
 * The admin panel nests tabs inside tabs (Historical → Google Sheets / Single
 * election), so the same pill treatment has to be reachable from more than one
 * file. Keeping it here rather than in AdminPage avoids a circular import,
 * since AdminPage is what renders those children.
 *
 * The list is `w-max` and left-aligned: the track hugs its tabs instead of
 * stretching to the container and leaving a wide empty tail on the right.
 * Seven tabs never fit a phone, so the row still scrolls inside an
 * edge-bleeding wrapper and a half-visible tab is the honest signal that
 * there is more this way.
 *
 * The track is a fill and nothing else — no outline of its own. It used to
 * carry one, and when the FIRST or LAST tab was the active one its pill sat
 * 4px inside that outline, so two hairlines curved round the same corner in
 * parallel. Worse, the pill's line was full-strength and the track's was at
 * 60%, so the inner line was the darker of the two, which is the opposite of
 * how a nested object reads. Middle tabs never showed it because you only ever
 * saw their straight sides. One stroke, on the pill, fixes it at every
 * position. The gap is also 6px now rather than 4 — at 4px a raised thumb
 * looks jammed into its track rather than resting in it.
 */
export const TAB_LIST_CLASS =
  'h-12 w-max justify-start gap-1 rounded-full bg-muted p-1.5';

export const TAB_TRIGGER_CLASS =
  'h-9 rounded-full px-4 text-sm whitespace-nowrap data-[state=active]:bg-background data-[state=active]:font-semibold data-[state=active]:shadow-[0_1px_2px_rgba(0,0,0,0.06)] data-[state=active]:inset-ring-1 data-[state=active]:inset-ring-border';

/**
 * The nested variants. Historical can stack three tab rows on top of each other
 * (admin → import method → CSV or typed), and three identical full-width rows
 * read as three peers rather than a hierarchy. Nested rows shrink to their
 * content and sit left, so depth is legible at a glance.
 */
export const SUBTAB_LIST_CLASS =
  'h-11 w-max justify-start gap-1 rounded-full bg-muted p-1.5';

export const SUBTAB_TRIGGER_CLASS =
  'h-8 rounded-full px-3.5 text-sm whitespace-nowrap data-[state=active]:bg-background data-[state=active]:font-semibold data-[state=active]:shadow-[0_1px_2px_rgba(0,0,0,0.06)] data-[state=active]:inset-ring-1 data-[state=active]:inset-ring-border';

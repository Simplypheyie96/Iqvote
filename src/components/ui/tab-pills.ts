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
 */
export const TAB_LIST_CLASS =
  'h-11 w-max justify-start gap-1 rounded-full bg-muted/70 p-1 inset-ring-1 inset-ring-border/60';

export const TAB_TRIGGER_CLASS =
  'h-9 rounded-full px-4 text-sm whitespace-nowrap data-[state=active]:bg-background data-[state=active]:font-semibold data-[state=active]:shadow-[0_1px_2px_rgba(0,0,0,0.06)] data-[state=active]:inset-ring-1 data-[state=active]:inset-ring-border';

/**
 * The nested variants. Historical can stack three tab rows on top of each other
 * (admin → import method → CSV or typed), and three identical full-width rows
 * read as three peers rather than a hierarchy. Nested rows shrink to their
 * content and sit left, so depth is legible at a glance.
 */
export const SUBTAB_LIST_CLASS =
  'h-10 w-max justify-start gap-1 rounded-full bg-muted/70 p-1 inset-ring-1 inset-ring-border/60';

export const SUBTAB_TRIGGER_CLASS =
  'h-8 rounded-full px-3.5 text-sm whitespace-nowrap data-[state=active]:bg-background data-[state=active]:font-semibold data-[state=active]:shadow-[0_1px_2px_rgba(0,0,0,0.06)] data-[state=active]:inset-ring-1 data-[state=active]:inset-ring-border';

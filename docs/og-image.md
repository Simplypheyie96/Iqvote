# Social preview (OG) image

The image that appears when an IQ Vote link is shared in Slack, X, LinkedIn etc.

## Current state

Already done — `public/og-image.png` exists and `App.tsx` sets the `og:` and
`twitter:` meta tags on load. Nothing needs doing unless the design changes.

| Piece | Where |
|---|---|
| Design (React component) | `src/imports/OgImage.tsx` |
| Preview route | `/og-image-preview` or `#og-preview` |
| Rendered image | `public/og-image.png` (1200 × 630) |
| Meta tags | `App.tsx`, in the mount effect |

## Regenerating it

1. Open `/og-image-preview` on a running instance.
2. DevTools → device toolbar → set the viewport to exactly **1200 × 630**.
3. Capture a screenshot and save it over `public/og-image.png`.
4. Commit, deploy, then re-scrape the URL so caches update — social platforms
   hold the old image for a long time otherwise. Facebook's Sharing Debugger and
   LinkedIn's Post Inspector both force a refresh.

Dimensions matter: 1200 × 630 is the standard 1.91:1 ratio. Off-ratio images get
cropped unpredictably per platform.

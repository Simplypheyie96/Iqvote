# Social preview (OG) image

The image that appears when an IQ Vote link is shared in Slack, X, LinkedIn etc.

## Current state

Already done — `public/og-image.png` exists and `App.tsx` sets the `og:` and
`twitter:` meta tags on load. Nothing needs doing unless the design changes.

| Piece | Where |
|---|---|
| Design (React component) | `src/imports/OgImage.tsx` |
| Preview route | `/og-image-preview` or `#og-preview` |
| Rendered image | `public/og-image.png` (2400 × 1260 — 2× of 1200 × 630) |
| Meta tags | `App.tsx`, in the mount effect |

## Regenerating it

`src/imports/OgImage.tsx` is the only source of truth. The PNG is rendered *from
that component on a running instance*, so the two can never drift.

Render at 2× and **ship it at 2×** — do not downscale. The asset is
2400 × 1260, which is the 1.91:1 ratio at double density:

```bash
npm run dev   # serves on :3000
```

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=2 --window-size=1200,630 --virtual-time-budget=9000 --screenshot=/tmp/og@2x.png http://localhost:3000/og-image-preview
```

```bash
python3 -c "from PIL import Image; Image.open('/tmp/og@2x.png').convert('RGB').save('public/og-image.png', optimize=True)"
```

Why 2× and not 1200 × 630, which is what every OG guide tells you to ship:
clients render the card *wider* than 1200px, so a 1200px source gets upscaled
and goes soft. Discord's large embed on a HiDPI display draws it around 1712px;
at that width a 1200px source has lost ~21% of its edge acutance relative to its
own native size, which reads as visible blur on the headline. A 2400px source is
always being *down*scaled instead, which is always sharp — measured ~14% sharper
than the 1200px source at 1712px, and ~30% sharper at 2048px.

Measure it with edge standard deviation, not by eye:

```bash
python3 -c "from PIL import Image, ImageFilter, ImageStat; im=Image.open('public/og-image.png').convert('RGB').resize((1712,899), Image.LANCZOS); print(ImageStat.Stat(im.convert('L').filter(ImageFilter.FIND_EDGES)).stddev[0])"
```

Cost is file size: 1.32 MB versus 492 KB. That is comfortably inside every
platform cap (Twitter and LinkedIn 5 MB, Facebook 8 MB).

Dimensions matter: keep the 1.91:1 ratio. Off-ratio images get cropped
unpredictably per platform.

## Busting social caches

Platforms cache the scraped image hard, and Discord is the worst case — it
caches the page embed *and* re-hosts the image on its own proxy, with no public
purge tool. Changing bytes at the same URL will not dislodge it.

So the image URL carries a version query: `og-image.png?v=2`, set in **both**
`index.html` (the static tags scrapers read, since they do not run JS) and
`App.tsx` (the runtime injection). **Bump that `v=` on every future image
change, in both files, or the new card will not propagate.** Twitter's Card
Validator and LinkedIn's Post Inspector force a refresh; Discord needs the
changed URL.

## Notes on the current design

- **The ground is quoted from the app, not invented for the image.** It is
  `--card` from the `.dark` block of `src/index.css` (`oklch(0.2574 0.0262
  255.7576)` = `#1b2430`) carrying the app's own `.bg-grid` — 1px lines at 6%
  `--foreground`, 44px pitch — at the same `opacity-60` that `AuthPage`'s brand
  rail runs it at, so the effective alpha is `0.06 * 0.6 = 0.036`. `AuthPage`
  also already carries this image's headline and a near-identical paragraph, so
  the OG card and the app's hero are the same surface.
- **Pink is a lattice, not a wash.** The second grid tier — pink majors on every
  4th rule, 176px pitch at 18% `--primary` — is the only place brand pink enters
  the ground. It is offset half a cell (+88px) off the minor grid: anchored flush
  to the content box, a pink rule lands on the logo's left edge and the
  headline's cap line and reads as a rendering glitch. Offset, it crosses behind
  the type, where the glyphs interrupt it and it reads as intentional.
- The card interior uses the app's **light**-theme tokens, so it reads as a real
  product surface. The podium mirrors the in-app leaderboard: 1st tallest and
  centred, flanked by 2nd and 3rd, with the 5/3/2 scoring. Primary *fills* are
  capped at the champion step and the LIVE dot, per `DESIGN.md`.
- Grain is an inline `feTurbulence` data-URI (a few hundred bytes) rather than a
  noise PNG, with a `feComponentTransfer` slope acting as a contrast amplifier —
  raw turbulence sits in a narrow band around mid-grey and vanishes once blended.
- **The grain blend is `soft-light`, and that is load-bearing.** `overlay`
  resolves to `2 * base * source` where the base is below 0.5, so on a ground
  this dark it caps the grain at an 11-level spread no matter the opacity — it
  was measured collapsing from 53 levels to 11 when the ground went from magenta
  to `#1b2430`. `screen` has the amplitude but lifts the ground mean 4–9 levels
  off the token. `soft-light` is the only blend here with amplitude to spare,
  which is what lets it run *quiet*: at 0.45 it measures a **14–17 level**
  spread and lifts the ground mean under 1.2 levels, so `#1b2430` is essentially
  untouched. Raising the opacity is not the way to make grain read on a dark
  ground — choosing the blend is. Anything at or above 0.8 goes sandy.
- Measure grain in a **text-free** band. Sampling at the canvas's vertical middle
  reads the white headline, not the ground, and reports a meaningless ~235.
- Every selector is scoped under `.og-canvas`, and each text element pins its own
  `line-height`. The app sets `line-height: 1.5` on `body`; without those pins
  the component renders ~3.5px off from its intended metrics.
- Contrast is measured, not estimated, and light text is checked against the
  **lightest** grain patches (p95 = `rgb(37, 48, 61)`), which is its worst case.
  Worst pair overall is card body copy on paper at **7.44:1**; the URL over a p95
  grain patch is **9.53:1**; white headline on the ground is **13.4–15.7:1**.
  Everything clears AAA.
- Geometry is verified against the delivered pixels, not the source: card top and
  bottom land on 320.0 / 562.0, paper edges on 74.0 / 1125.5, and the podium step
  tops sit 32px and 56px apart, matching the 158/126/102 step heights exactly.
- Logo asset: `public/og-assets/og-logo-mono.png` (white line-art mono mark), the
  only file that folder needs. The previous design's `og-bg.png`, `og-lines.svg`,
  and `og-logo.png` have been removed.

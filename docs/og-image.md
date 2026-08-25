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

Cost is file size: 1.39 MB versus 492 KB. That is comfortably inside every
platform cap (Twitter and LinkedIn 5 MB, Facebook 8 MB).

**3× was measured and rejected.** A 3600 × 1890 source is within ±1% of the
2400px source at every display width up to 2048 — 400px: +0.1%, 800px: −0.3%,
1712px: −0.4%, 2048px: −0.9%. That is noise, not a gain, and it is exactly what
the logic above predicts: past 2×, every real display width is *down*scaling
either source, and downscaling is already sharp. 3× doubles the file to 2.74 MB
and buys nothing. Do not go past 2×.

## Blur has two causes, and grain is the one that hides

When the card reads as "blurry", check these in order. Resolution is almost
never the answer — see above.

### 1. Grain adjacent to small text (checked first, it is usually this)

`.og-canvas::after` lays an `feTurbulence` noise tile over the whole card at
`mix-blend-mode: soft-light`. `.og-stage` carries `z-index: 1` and the pseudo
element does not, so the grain paints *behind* the content: the glyphs
themselves come out clean, but small type on the dark ground sits on a speckled
field, and the eye cannot resolve a 1px stroke against noise. This is why the
74px headline survives it and 17px type does not, and why the body copy on the
white paper panel — where there is far less grain contrast — has always looked
crisp while the URL and the lockup did not.

It shipped at `opacity: 0.45`, which measured a **46-level** luminance spread on
the dark ground (mean 36.5, stddev 5.46, range 23..69) against the 14–17 levels
this doc used to claim. Two things fix it together:

- **`opacity: 0.45` → `0.17`.** Spread drops to 27 levels, stddev to 2.58. The
  ground also lands *closer* to the `#1b2430` token, not further: drift went
  from 1.89 levels to 1.02.
- **`baseFrequency: 0.8` → `1.6`.** Grain coarseness scales with render
  density. The tile is 260 CSS px, so at DSF 2 it rasterises to 520 device px
  and each noise feature spans ~2.5 device px — big enough to read as smear
  rather than texture. Doubling the frequency restores roughly one device pixel
  per noise cell at 2×. **If the ship density ever changes, this value has to
  track it.**

Measure it, do not eyeball it: crop a flat patch of ground at native resolution
and read stddev and range. Then crop the URL and the lockup and upscale with
`Image.NEAREST` — nearest-neighbour shows you the real pixels, where resampling
hides the defect behind its own softening.

`text-rendering: geometricPrecision` was also removed. It disables hinting and
uses fractional glyph advances, which helps animated type and hurts a static
raster at 17px. Verified to move no geometry at all — paper, headline and URL
column extents were byte-identical before and after.

### 2. Type size

If the grain is already quiet and the card still reads soft, the cause is type
size, and no amount of resolution will touch it.

Discord renders a large embed **inline at roughly 400 CSS px wide** — the card is
being shown at about a third of its design size. (The ~1712px figure above is the
*expanded* view you get after clicking, which is a different and much rarer
case.) So every type size in the design divides by three:

| element | design | at 400px inline |
|---|---|---|
| headline | 74px | 24.7px |
| `IQ Vote` wordmark | 26px | 8.7px |
| `iqvote.vercel.app` | 17px | 5.7px |
| card heading | 24px | 8.0px |
| card body copy | 16px | 5.3px |
| podium numerals | 18px | 6.0px |
| points | 22px | 7.3px |
| `pts` / rank labels | 13px | 4.3px |

Those figures are *after* the legibility pass, and most of them are still under
8px — because a 1200px-wide composition physically cannot make eight distinct
text elements legible at 400px. Only the headline survives at that size, which
is what a headline is for. The pass raised every sub-22px element by ~20–30%
linear, which is decisive at the expanded and desktop-client widths and a real
but partial improvement in the small inline thumbnail.

If full legibility in the 400px inline thumbnail is ever the requirement, the fix
is fewer and larger elements — a genuinely simpler card — not more pixels.

One counter-intuitive rule from this pass: **as a small uppercase label gets
bigger, its letter-spacing should come down.** The `LIVE` chip and the rank
labels were carrying 0.14em and 0.085em, which is tracking doing the job size
should be doing; wide tracking is what makes small uppercase text smear into a
grey band when it is downscaled. They are now 0.10em and 0.065em.

Dimensions matter: keep the 1.91:1 ratio. Off-ratio images get cropped
unpredictably per platform.

## Busting social caches

Platforms cache the scraped image hard, and Discord is the worst case — it
caches the page embed *and* re-hosts the image on its own proxy, with no public
purge tool. Changing bytes at the same URL will not dislodge it.

So the image URL carries a version query: `og-image.png?v=4`, set in **both**
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

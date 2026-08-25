/**
 * OG image source of truth — 1200×630.
 *
 * Rendered to public/og-image.png (see docs/og-image.md). Preview at
 * /og-image-preview.
 *
 * Design notes
 * - Field hues are a deepened form of --primary from src/index.css, so the
 *   ground is the brand's own hue rather than a new colour identity. One calm
 *   two-stop linear pass — deliberately no radial blooms.
 * - The card interior uses the app's LIGHT-theme tokens, so it reads as a real
 *   product surface rather than decoration.
 * - Every selector is scoped under .og-canvas: this component renders inside
 *   the running app, so it must not inherit from — or leak into — app CSS.
 * - Contrast is measured, not estimated. Worst pair on the card is 5.10:1
 *   (muted text on the champion step face); everything else is higher.
 * - Type sizes are set against a legibility floor, not chosen for the 1200px
 *   view. Discord shows a large embed inline at ~400px, so everything here
 *   divides by three when it is actually read. Nothing but the headline is
 *   allowed to shrink for composition's sake, and small uppercase labels carry
 *   *less* tracking as they grow — wide tracking is what smears them when
 *   downscaled. See docs/og-image.md for the measured table.
 */

const css = `
.og-canvas {
  /* The app's own dark brand surface: --card and --foreground from the .dark
     block of src/index.css. AuthPage's brand rail is card + .bg-grid, so this
     ground is quoted from the app rather than invented for the OG image. */
  --og-ground:   #1b2430;
  --og-grid-ink: 249, 251, 246;
  --og-grid-pink: 231, 0, 117;
  --og-primary:  #e70075;
  --og-ink:      #0f172a;
  --og-ink-mid:  #334155;
  --og-ink-soft: #475264;
  --og-paper:    #fbf7f9;
  --og-medal-1:  #e4b53e;
  --og-medal-2:  #c2c6cf;
  --og-medal-3:  #d99a6c;

  position: relative;
  width: 1200px;
  height: 630px;
  overflow: hidden;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  -webkit-font-smoothing: antialiased;
  text-rendering: geometricPrecision;
  /* The app sets line-height: 1.5 on body; this component is authored against
     tight metrics, so every text element pins its own value below. */
  line-height: normal;
  background-color: var(--og-ground);
  /* src/index.css .bg-grid — 1px lines at 6% foreground, 44px pitch. AuthPage
     runs it at opacity-60, so the effective alpha here is 0.06 * 0.6 = 0.036.
     The minor grid is anchored on the content box's top-left corner (64px 54px)
     so the pattern reads as designed-in rather than as arbitrary tiling. */
  background-image:
    /* Pink majors on every 4th rule of the app grid — the second tier is this
       image's own, and it is the only place brand pink enters the ground: a
       lattice, not a wash. Offset half a cell (+88px) off the minor grid so a
       pink rule never lands on a content edge; grazing the logo or the cap
       line of the headline reads as a glitch. Crossing behind the type does
       not — the glyphs interrupt the rule, which is the intent. */
    linear-gradient(rgba(var(--og-grid-pink), 0.18) 1px, transparent 1px),
    linear-gradient(90deg, rgba(var(--og-grid-pink), 0.18) 1px, transparent 1px),
    linear-gradient(rgba(var(--og-grid-ink), 0.036) 1px, transparent 1px),
    linear-gradient(90deg, rgba(var(--og-grid-ink), 0.036) 1px, transparent 1px);
  background-size: 176px 176px, 176px 176px, 44px 44px, 44px 44px;
  background-position: 152px 142px, 152px 142px, 64px 54px, 64px 54px;
}
.og-canvas *,
.og-canvas *::before,
.og-canvas *::after { margin: 0; padding: 0; box-sizing: border-box; border: 0; }

/* Film grain — what stops a flat fill from reading as a flat fill. The
   feComponentTransfer slope is a contrast amplifier: raw feTurbulence sits in
   a narrow band around mid-grey and disappears entirely once blended. */
.og-canvas::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%27260%27%20height%3D%27260%27%3E%3Cfilter%20id%3D%27n%27%20color-interpolation-filters%3D%27sRGB%27%3E%3CfeTurbulence%20type%3D%27fractalNoise%27%20baseFrequency%3D%270.8%27%20numOctaves%3D%274%27%20stitchTiles%3D%27stitch%27%2F%3E%3CfeColorMatrix%20type%3D%27saturate%27%20values%3D%270%27%2F%3E%3CfeComponentTransfer%3E%3CfeFuncR%20type%3D%27linear%27%20slope%3D%273%27%20intercept%3D%27-1%27%2F%3E%3CfeFuncG%20type%3D%27linear%27%20slope%3D%273%27%20intercept%3D%27-1%27%2F%3E%3CfeFuncB%20type%3D%27linear%27%20slope%3D%273%27%20intercept%3D%27-1%27%2F%3E%3C%2FfeComponentTransfer%3E%3C%2Ffilter%3E%3Crect%20width%3D%27260%27%20height%3D%27260%27%20filter%3D%27url%28%23n%29%27%2F%3E%3C%2Fsvg%3E");
  background-repeat: repeat;
  opacity: 0.45;
  /* soft-light, not overlay: overlay resolves to 2*base*source, so on a base
     this dark it caps the grain at a ~11-level spread no matter the opacity,
     and screen lifts the ground mean 4-9 levels off the token. soft-light is
     the only blend here with amplitude to spare, which is what lets this sit
     at .45 -- quiet texture, ~16-level spread, ground still #1b2430. */
  mix-blend-mode: soft-light;
  pointer-events: none;
}

.og-stage {
  position: absolute;
  inset: 0;
  z-index: 1;
  padding: 54px 64px 58px;
  display: flex;
  flex-direction: column;
}

/* 1 — top rail: lockup left, URL anchoring the right corner */
.og-rail { display: flex; align-items: center; justify-content: space-between; height: 46px; }
.og-lockup { display: flex; align-items: center; gap: 13px; }
.og-lockup img { width: 40px; height: 46px; display: block; }
.og-lockup span { font-size: 26px; font-weight: 700; letter-spacing: -0.014em; line-height: 1.2; color: #fff; }
.og-url {
  font-size: 17px;
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: -0.006em;
  color: rgba(255, 255, 255, 0.88);
}

/* 2 — headline: size carries it, not weight */
.og-canvas h1 {
  margin-top: 20px;
  font-size: 74px;
  font-weight: 600;
  line-height: 1.04;
  letter-spacing: -0.033em;
  color: #fff;
  text-wrap: nowrap;
}

/* 3 — the product artifact, in a double-bezel shell */
.og-shell {
  margin-top: auto;
  width: 100%;
  padding: 10px;
  border-radius: 36px;
  background: rgba(255, 255, 255, 0.10);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.22);
}
.og-card {
  height: 242px;
  border-radius: 26px;
  background: var(--og-paper);
  padding: 28px 30px 26px;
  display: flex;
  align-items: stretch;
  gap: 48px;
  box-shadow:
    0 1px 1px rgba(2, 6, 12, 0.20),
    0 4px 8px rgba(2, 6, 12, 0.22),
    0 12px 24px rgba(2, 6, 12, 0.26),
    0 28px 56px rgba(2, 6, 12, 0.32);
}

.og-brief { flex: 1; display: flex; flex-direction: column; justify-content: center; }
.og-brief h2 { font-size: 24px; font-weight: 600; letter-spacing: -0.016em; line-height: 1.2; color: var(--og-ink); }
.og-brief p {
  margin-top: 12px;
  max-width: 384px;
  font-size: 16px;
  font-weight: 400;
  line-height: 1.5;
  color: var(--og-ink-soft);
  text-wrap: balance;
}
.og-chip {
  align-self: flex-start;
  margin-top: 20px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 31px;
  padding: 0 14px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.05);
  box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.10);
  font-size: 12.5px;
  font-weight: 600;
  letter-spacing: 0.10em;
  text-transform: uppercase;
  line-height: 1;
  color: var(--og-ink-mid);
}
.og-chip i {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: var(--og-primary);
  box-shadow: 0 0 0 3px rgba(231, 0, 117, 0.18);
}

/* The podium: 1st centred and tallest, flanked by 2nd and 3rd. */
.og-stand { width: 552px; display: flex; flex-direction: column; justify-content: flex-end; }
.og-podium { display: flex; align-items: flex-end; gap: 24px; }
.og-step {
  flex: 1;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 14px 14px 0 0;
}
.og-s1 {
  height: 158px;
  background: rgba(231, 0, 117, 0.22);
  box-shadow: inset 0 0 0 1px rgba(231, 0, 117, 0.42), inset 0 3px 0 var(--og-primary);
}
.og-s2 {
  height: 126px;
  background: rgba(15, 23, 42, 0.055);
  box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.11), inset 0 1px 0 rgba(255, 255, 255, 0.7);
}
.og-s3 {
  height: 102px;
  background: rgba(15, 23, 42, 0.045);
  box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.095), inset 0 1px 0 rgba(255, 255, 255, 0.7);
}

.og-medal {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  line-height: 1;
  color: var(--og-ink);
  box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.45);
}
.og-m1 { background: var(--og-medal-1); }
.og-m2 { background: var(--og-medal-2); }
.og-m3 { background: var(--og-medal-3); }

.og-pts { font-size: 22px; font-weight: 700; letter-spacing: -0.016em; line-height: 1.15; color: var(--og-ink); }
.og-pts small { font-size: 13px; font-weight: 500; letter-spacing: 0; color: var(--og-ink-soft); margin-left: 4px; }

.og-floor { height: 1px; background: rgba(15, 23, 42, 0.16); }
.og-ranks { margin-top: 9px; display: flex; gap: 24px; }
.og-ranks span {
  flex: 1;
  text-align: center;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.065em;
  text-transform: uppercase;
  line-height: 1.2;
  color: var(--og-ink-soft);
}
`;

export default function OgImage() {
  return (
    <div className="og-canvas">
      <style>{css}</style>

      <div className="og-stage">
        <div className="og-rail">
          <div className="og-lockup">
            <img src="/og-assets/og-logo-mono.png" alt="" />
            <span>IQ Vote</span>
          </div>
          <span className="og-url">iqvote.vercel.app</span>
        </div>

        <h1>
          Employee of the Month,
          <br />
          decided by the team
        </h1>

        <div className="og-shell">
          <div className="og-card">
            <div className="og-brief">
              <h2>This month&rsquo;s podium</h2>
              <p>Every teammate ranks their top three. Standings update the moment voting closes.</p>
              <div className="og-chip">
                <i />
                Live
              </div>
            </div>

            <div className="og-stand">
              <div className="og-podium">
                <div className="og-step og-s2">
                  <div className="og-medal og-m2">2</div>
                  <div className="og-pts">
                    3<small>pts</small>
                  </div>
                </div>
                <div className="og-step og-s1">
                  <div className="og-medal og-m1">1</div>
                  <div className="og-pts">
                    5<small>pts</small>
                  </div>
                </div>
                <div className="og-step og-s3">
                  <div className="og-medal og-m3">3</div>
                  <div className="og-pts">
                    2<small>pts</small>
                  </div>
                </div>
              </div>
              <div className="og-floor" />
              <div className="og-ranks">
                <span>Runner-up</span>
                <span>Champion</span>
                <span>Third place</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

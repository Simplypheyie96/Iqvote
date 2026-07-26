# Skills Cheat Sheet — Complete

Everything installed, grouped by job. Type `/skill-name` in chat, or say "use the skill-name skill".

Namespaced entries (`plugin:name`) come from plugins — type them with the prefix.

**Contents**
[**How to prompt with skills**](#how-to-prompt-with-skills) · [Start here](#start-here) · [Whole pages](#whole-pages--site-types) · [Look packs](#look-packs-aesthetic-systems) · [Fundamentals](#design-fundamentals) · [Layout details](#layout--structural-details) · [Effects](#effects--backgrounds) · [Animation](#animation) · [GSAP](#gsap) · [Scroll](#scroll-storytelling) · [3D](#3d--threejs) · [Games](#games) · [Sound](#sound--audio) · [Making images](#making-images) · [Slides & video](#slides--video) · [Non-web](#non-web--native) · [Frameworks](#frameworks--libraries) · [Tooling](#build-tooling--infra) · [Testing](#testing--browser-automation) · [Audits](#audits--quality) · [Engineering process](#engineering-process) · [UX research](#ux-research--product-thinking) · [Web research](#web-research--scraping-firecrawl) · [Writing](#writing--social) · [Support](#customer-support) · [Meta](#meta--skill-authoring) · [Plugins](#plugin-skills) · [MCP & external tools](#mcp-servers--external-tools) · [Built-ins](#built-in-claude-code-skills)

---

# How to prompt with skills

## If you read nothing else

1. **You don't have to know the skill.** Describe the problem, then ask Claude to *name* the skill and wait for your yes.
2. **One look skill at a time.** Two aesthetic packs fight each other and produce mush.
3. **Give each skill a job and a boundary** — "GSAP for the pinned section only."
4. **Say what "done" means.** Otherwise Claude decides, and it decides too early.
5. **Write two or three "don'ts."** They do more work than a paragraph of description.

---

## When you don't know what you need

This is the normal case. Don't guess — use one of these three moves.

### Move 1 — Make Claude pick, then confirm

The habit that fixes most bad output. Describe the mess in your own words and hand the selection back:

```
Here's what I'm dealing with: [describe it badly, that's fine —
what's broken, what you want instead, what you've tried].

Don't build yet. Read design-skills-cheatsheet.md, tell me which
1–3 skills fit and why, and what you'd do with each. I'll confirm
before you start.
```

This is better than trusting a silent pick, because you see the choice before it costs you a build. If the reasoning sounds wrong, you catch it in one line instead of after 200 lines of code.

### Move 2 — Use a router skill

| Skill | Use when |
|---|---|
| `/ui-skills-root` | "Which UI skills apply here?" Picks the smallest useful set for you. |
| `/layers-orient` | Something's wrong with the *product*, not the code. Finds your bottleneck layer. |
| `/improve` | Point it at a codebase; get back prioritized, self-contained plans. |
| `/improve-animations` | Same, but for motion. |
| `/find-animation-opportunities` | "Should anything here animate?" — it also says what shouldn't. |
| `/animation-vocabulary` | You can describe the effect but can't name it. Gives you the technical term to search on. |

> **Not `/ask-matt`.** It reads like a general router but it isn't — it's Matt Pocock's *engineering* flow, and 9 of the 20 skills it points to aren't installed, including its whole spine (`/to-spec` → `/to-tickets` → `/implement`). It will route you to things that don't exist. See [Engineering process](#engineering-process) for the parts that do work.

### Move 3 — Route by symptom

Say the symptom out loud and read across.

| What you'd actually say | Start with |
|---|---|
| "It looks generic / AI-made." | `/redesign-existing-projects`, then one look pack |
| "It looks fine but feels cheap." | `/better-ui` → `/beautiful-shadows` → `/better-typography` |
| "It's cramped / crowded." | `/baseline-ui`, then `refactoring-ui-skills:04-apply-consistent-spacing` |
| "I don't know what to look at first." | `refactoring-ui-skills:01-establish-visual-hierarchy` |
| "The colors are off." | `/better-colors` |
| "It's static and boring." | `/find-animation-opportunities` *before* any animation skill |
| "The animation feels janky." | `/60fps-animation` or `/fixing-motion-performance` |
| "I want it to feel expensive." | `/high-end-visual-design` or `/emil-design-eng` |
| "I have a reference I like." | `/web-clone` or `/firecrawl-website-design-clone` |
| "I don't know what to build yet." | `superpowers:brainstorming` |
| "I know what to build, it's big." | `superpowers:writing-plans` |
| "It's broken and I can't tell why." | `superpowers:systematic-debugging` or `/diagnosing-bugs` |
| "Is this actually finished?" | `superpowers:verification-before-completion` |
| "Is this any good?" | `/web-quality-audit` or `/web-design-guidelines` |
| "Can everyone use it?" | `/fixing-accessibility` |

---

## The stacking formula

Skills fall into four roles. Take one from each, in this order.

| Order | Role | Job | Examples |
|---|---|---|---|
| 1 | **Process** | Decides *how* the work happens. Gates everything. | `superpowers:brainstorming`, `/design-first-ui-prompting`, `/tdd` |
| 2 | **System** | The look. **One only.** | `/dark-glass-clean-layout`, `/swiss-design`, `/orange-clean-paper-saas` |
| 3 | **Technique** | One specific mechanism. | `/gsap-scrolltrigger`, `/masked-reveal`, `/progressive-blur` |
| 4 | **QA** | Checks the result before handoff. | `/web-design-guidelines`, `/fixing-accessibility`, `/review-animations` |

**Never stack two look packs.** They're complete systems — color, type scale, surfaces, spacing. Two of them average into something that looks like neither. Want a blend? Pick one as the base and describe the borrowed part in words: *"`/swiss-design` as the base, but frosted panels on the pricing cards only."*

**Three to five skills is the ceiling.** Past that, the early instructions get diluted by the later ones.

**Mechanical note:** the CLI only autocompletes a `/` at the very start of your message. Lead with one slash, name the rest in prose — Claude still picks them up.

---

## Template — one skill

The failure mode is under-specifying and letting the skill fill gaps with its defaults.

**Weak**

```
/landing-page make me a landing page for my prediction app
```

**Strong**

```
/landing-page

Product: [what it is, in one line]
Audience: [who, what device, what constraints they have]
Single offer: [the one action the page exists to get]
Sections: [list them yourself] — nothing else.
Tone: [two adjectives] Not: [the tone you keep getting]
Stack: [framework + CSS] Must hold at [min width].
Deliver: [exact files]. Write real copy — no lorem, no "[Your headline here]".
Don't: [2–3 banned patterns]
```

The order is deliberate: **product → audience → the one offer → your section list → tone → stack → deliverable → hard nos.** The "Don't" line does the most work, because it blocks the defaults the skill would otherwise reach for.

---

## Template — several skills

```
/superpowers:brainstorming

Use these skills, in this order, each with a specific job:

1. superpowers:brainstorming — pin the concept with me FIRST.
   Ask your questions, wait for my answers, do NOT write code this turn.
2. [look pack] — the visual system for the whole thing.
   This is the only look skill; don't blend anything else in.
3. [technique] — for [specific section] ONLY.
   Everything else uses plain CSS transitions.
4. [QA skill] — run it over the finished build and fix what it flags
   before you hand back.

Build: [what, for whom]
Sections: [list]
Stack: [framework, CSS, libs] — [min width]
Done = [the 2–3 conditions that make this actually finished]
```

Four things make this work:

- **Each skill has a job**, not just a mention — "for the pinned section ONLY" stops a technique skill from taking over the page.
- **The first skill is a gate** — "do not write code this turn" is what stops Claude bulldozing from plan straight into build, so you never get to steer.
- **Boundaries are explicit** — "this is the only look skill" prevents drift.
- **"Done =" is defined** — otherwise Claude stops when the result looks plausible.

---

## Framing rules that change the output most

**Scope every skill.** Skills are greedy — they apply themselves to everything unless told where to stop. *"`/glassmorphism` on the nav and modals only; cards stay flat."*

**Put the gate first and make it block.** Process skills only work if you say "don't build yet."

**List the sections yourself.** If you don't, you get the default six-section SaaS page every time.

**Write the "don't" line.** Two or three banned patterns beats three paragraphs of positive description.

**Define done.** "Builds clean, passes the a11y skill, works at 360px" gives Claude something to verify against.

**Restate the stack when iterating.** By turn 5 the skill from turn 1 has faded. *"Same stack as before — dark-glass-clean-layout + gsap-scrolltrigger — now redo pricing."*

---

## When the output is wrong

Don't start over. Name what happened and re-scope.

| What went wrong | Say this |
|---|---|
| Generic despite the look pack | "You didn't apply [skill]. Show me which of its rules you used, then redo." |
| Right look, wrong feel | "Keep the system. Change [one specific thing]. Nothing else moves." |
| Too much animation | "Remove all motion except [one thing]. Re-read `/find-animation-opportunities`." |
| It built before you were ready | "Stop. Back to `superpowers:brainstorming`. Don't write code until I say go." |
| Drifted over several turns | "Re-read the stack: [skills]. Audit what you built against them and list the violations." |
| Claimed done, isn't | "Run `superpowers:verification-before-completion` and show me the evidence." |

**The general fix:** you don't need to know the right skill. You need to describe the symptom precisely and make Claude name its choice before it spends a build on it.

---

## Start here

| Skill | What it does |
|---|---|
| `/frontend-design` | General design-engineering baseline. Safe default for any UI work. |
| `/design` | General design entry point. |
| `/design-first-ui-prompting` | Design-first, spec-driven prompt structure before you generate UI. |
| `/design-lab` | Interviews you, generates 5 distinct UI variations, collects feedback. |
| `/prototype` | Throwaway prototype to answer one design question. |
| `/ui-skills-root` | Selects the smallest useful UI-skills context via CLI. |
| `/pick-ui-library` | Picks the right library for a task (number inputs, OTP, etc.). |
| `/image-to-code` | Generates a visual reference image first, then builds to it. |
| `/budge` | Single-property CSS/Tailwind visual tweaks in Next.js App Router. |

**Taste / house-style overrides**

| Skill | What it does |
|---|---|
| `/high-end-visual-design` | Design like a high-end agency — exact fonts, spacing, shadows, card structure. |
| `/emil-design-eng` | Emil Kowalski's philosophy on UI polish, component design, animation decisions. |
| `/bencium-innovative-ux-designer` | Distinctive, production-grade interfaces with high design quality. |
| `/design-taste-frontend` | Senior UI/UX engineer persona; overrides default LLM biases, metric-based enforcement. |
| `/design-taste-frontend-v1` | Original v1 of the above, preserved for projects depending on exact behavior. |
| `/gpt-taste` | Elite UX/UI + GSAP motion engineer; randomized layout variance. |
| `/stitch-design-taste` | Generates agent-friendly DESIGN.md enforcing a semantic design system. |
| `/ui-ux-pro-max` | Local searchable DB — 84 styles, 192 color palettes, web + mobile. |
| `/frontend-ui-engineering` | Production-quality accessible, responsive UI. |
| `/full-output-enforcement` | Bans placeholder/truncated code; forces complete output. |

---

## Whole pages & site types

| Skill | What it does |
|---|---|
| `/landing-page` | High-converting single-offer landing page. |
| `/compact-landing` | Compact, distinctive landing pages without repeating one template. |
| `/pricing-page` | High-converting SaaS pricing page — structure, plan design, copy. |
| `/product-proof-saas` | SaaS/AI landing pages built around a real workflow or interface demo. |
| `/operational-enterprise-ai` | Enterprise AI / automation / security / ops product pages. |
| `/editorial-portfolio-chapters` | Creative-studio, photographer, artist, portfolio sites. |
| `/editorial-service-booking` | Appointment-based sites — salons, spas, clinics, studios. |
| `/documentary-brutalist-agency` | Agency, production studio, architecture, culture sites. |
| `/agency-grid-layout-minimal` | Minimal agency system — editorial grid, oversized type. |
| `/redesign-existing-projects` | Audits an existing site, removes generic AI patterns, upgrades to premium. |
| `/web-clone` | Website cloning/recreation methodology. |
| `/firecrawl-website-design-clone` | Extracts a live site's design system into an agent-ready DESIGN.md. |
| `/interface-design` | Dashboards, admin panels, SaaS apps, settings, data interfaces. |
| `/efecto-web-design` | Build web pages/app UIs on the Efecto canvas with JSX + Tailwind. |

---

## Look packs (aesthetic systems)

Complete design systems — colors, type, surfaces, components — in one voice.

**Light / minimal**

| Skill | Look |
|---|---|
| `/clean-minimal-beige-light-mode` | Warm neutral shells, quiet process grids, restrained accents. |
| `/minimalist-ui` | Editorial, warm monochrome, typographic contrast, flat bento grids. |
| `/orange-clean-paper-saas` | Paper-toned SaaS, warm neutrals, orange accent signals. |
| `/light-mode-paper-technical` | Warm paper surfaces, dark outer framing, subtle diagonals. |
| `/blue-cloudy-clean-modern` | Luminous blue sky atmosphere, soft drifting cloud light. |
| `/book-serif-index` | Archival book-reader — serif pages, mono index nav, aged paper. |
| `/swiss-design` | Swiss International Style system in Tailwind. |
| `/editorial-tech` | Editorial magazine composition + precision product-tech detailing. |
| `/apple-design` | Apple's interface restraint and fluid physical motion, for web. |

**Dark / glass / premium**

| Skill | Look |
|---|---|
| `/glass-dark-ui` | Dark glassmorphism with readable contrast and gradient borders. |
| `/dark-glass-clean-layout` | Frosted premium shells, clean multi-column workspace structure. |
| `/blue-laser-clean-glass-layout` | Dark glass + thin blue laser atmosphere. |
| `/glass-dark-mode-clock` | Frosted shells, soft beam grids, circular calibration dials. |
| `/dark-blue-contrasting-clean` | Strong contrast, cobalt gradient feature blocks, crisp frames. |
| `/mesh-gradient-dark-blue-clean` | Futuristic premium dark-blue mesh gradients. |
| `/dither-laser-dark-mode` | Near-black surfaces, ordered-dither texture, laser accents. |
| `/tech-green-dark-mode-modern` | Matte-black surfaces, emerald signal accents, mono detailing. |
| `/funky-purple-container-tech` | Layered rounded shells, fuchsia-purple accents. |
| `/framed-tech-dark-border-gradient` | Border-gradient shells, asymmetric grid panels, mono labels. |
| `/bright-green-tech-system-webgl` | Bright-green technical system, hard-framed dark surfaces, WebGL. |

**Structural / technical / raw**

| Skill | Look |
|---|---|
| `/industrial-brutalist-ui` | Swiss print + military terminal. Rigid grids, raw mechanics. |
| `/technical-wireframe-info-layout` | Monochrome wireframe, exploded 3D structure, connector annotations. |
| `/split-layout-technical` | Dual panels, fine frame lines, mono metadata. |
| `/nested-container-clean-agency` | Outer editorial shell with inset dark panels. |
| `/image-first-grid-layout` | Full-bleed photography, structural guide lines, anchored content. |
| `/skeuomorphic-ui` | Layered gradients, stacked inner/outer shadows, reflective glass. |
| `/high-contrast-skeuomorphic-clean` | Molded dark surfaces with crisp light separation. |
| `/solar-duotone-bold` | Iconify Solar Duotone Bold icon style. |

---

## Design fundamentals

| Skill | What it does |
|---|---|
| `/better-typography` | Choosing fonts through spacing, wrapping, accessibility. |
| `/better-colors` | OKLCH palettes — convert, generate, check contrast. |
| `/oklch-skill` | Same OKLCH toolkit (duplicate of the above). |
| `/beautiful-shadows` | Exact Tailwind arbitrary shadow utilities for layered elevation. |
| `/better-ui` | Design-engineering principles for polished interfaces. |
| `/make-interfaces-feel-better` | Same principles, phrased for review passes. |
| `/baseline-ui` | Fast "deslop" — fixes spacing, hierarchy, typography, small layout bugs. |
| `refactoring-ui-skills:meta-refactor-ui` | Full assessment against all 10 Refactoring UI principles. |

The 10 Refactoring UI skills individually: `01-establish-visual-hierarchy` · `02-apply-typography-scale` · `03-build-color-palette` · `04-apply-consistent-spacing` · `05-design-button-hierarchy` · `06-eliminate-visual-clutter` · `07-design-empty-states` · `08-use-shadows-appropriately` · `09-manage-color-contrast` · `10-group-related-elements` (all prefixed `refactoring-ui-skills:`)

---

## Layout & structural details

| Skill | What it does |
|---|---|
| `/framed-grid-layout` | Thin boundary lines, L-shaped corner brackets, subtle diagonals. |
| `/nested-container-frames` | Container-in-container layout system. |
| `/container-lines` | Vertical container-size guide lines with mini corner squares. |
| `/corner-diagonals` | Diagonal-cut corners and chamfered edges on buttons, cards, panels. |
| `/number-details` | Decorative 01, 02, 03 numeric markers. |
| `/css-border-gradient` | Subtle gradient-border treatments for premium surfaces. |
| `/css-alpha-masking` | Edge fades via linear-gradient `mask-image`. |
| `/pseudo-elements` | Pseudo-element best practices + View Transitions API audit. |
| `/build-primitive` | Build foundational UI primitives from scratch when no Base UI primitive exists. |
| `/company-logos` | Iconify Simple Icons logos (64×64) instead of text logos. |

---

## Effects & backgrounds

| Skill | Effect |
|---|---|
| `/glassmorphism` | Frosted glass / Apple-style blur surfaces. |
| `/progressive-blur` | Layered CSS backdrop-filter blur for depth. |
| `/beam-glow-states` | Loading, processing, selected, focus, pressed states. npm `border-beam` · [demo](https://beam.jakubantalik.com/) |
| `/thinking-orbs` | Accessible animated AI loading / agent-status indicators. npm `thinking-orbs` · [demo](https://orbs.jakubantalik.com/) |
| `/liquid-metal-border` | Animated liquid-metal WebGL borders. npm `metal-fx` · [demo](https://metal.jakubantalik.com/) |
| `/gooey-blob-system` | SVG-filter blobs that merge into one fluid form. |
| `/ambient-section-particles` | Restrained particle atmosphere inside one section. |
| `/reveal-hover-effect` | Cursor-following spotlight revealing a second aligned image. |
| `/shaders-cursor-ripples` | Cursor-following fluid WebGPU distortion over an image. |
| `/marquee-loop` | Seamless infinite marquee via duplicated items. |
| `/webgl-laser` | Full-screen WebGL laser background, white-hot vertical core. |
| `/corner-lasers` | Corner-anchored laser beams with emitter node and bloom. |
| `/dither-background` | Procedural background with enlarged pixels, Bayer dithering. |
| `/atmosphere-background` | Drifting vertical light folds, screen-blended glow. |
| `/background-grid-webgl` | Perspective WebGL grid, fading lines, particle haze, forward drift. |
| `/globe-particles` | Luminous spherical particle core with orbital rings. |
| `/vantajs` | Animated WebGL backgrounds via Vanta.js. |
| `/unicorn-studio` | Embed and customize Unicorn Studio interactive animations. |
| `/webgl-landing-steering` | Steer WebGL-heavy landing pages toward a specific visual outcome. |
| `/webgl-3d-object` | Real 3D WebGL object — mesh depth, PBR material, lighting. |
| `/ascii-animation` | Terminal/CLI-style ASCII animations and intros. |

---

## Animation

**Decide what to animate**

| Skill | What it does |
|---|---|
| `/find-animation-opportunities` | Finds what *should* animate and rejects what shouldn't. |
| `/animation-vocabulary` | Turns a vague description of an effect into its exact technical name. |
| `/animation-systems` | Product-grade motion systems à la Stripe, Linear, Apple, Vercel. |
| `/interaction-design` | Microinteractions, transitions, user feedback patterns. |
| `/to-spring-or-not-to-spring` | Springs vs easing — correct timing-function selection. |

**Build it**

| Skill | What it does |
|---|---|
| `/micro-interaction` | Hover/press effects, toggles, switches. |
| `/transitions-dev` | Production CSS transitions — badges, dropdowns, modals. |
| `/animation-on-scroll` | IntersectionObserver scroll triggers, Tailwind-friendly. |
| `/page-transition-animation` | Page and route transitions. |
| `/svg-animation` | Animate SVG, line-draw, stroke effects. |
| `/morphing-icons` | Icons that morph into each other via SVG line transformation. |
| `/lottie-animation` | Play/control `.lottie` and `.json` animations. |
| `/text-to-lottie` | Create/edit/fix Lottie JSON for the Skia Skottie player. |
| `/mastering-animate-presence` | Framer Motion / Motion `AnimatePresence` exit + layout animations. |
| `/staggered-word-reveal` | Editorial word-by-word fade-and-rise reveals. |
| `/masked-reveal` | Masked staggered word reveals on scroll (GSAP ScrollTrigger). |

**Review & fix**

| Skill | What it does |
|---|---|
| `/improve-animations` | Senior motion audit of a codebase, prioritized. |
| `/review-animations` | Reviews motion against Emil Kowalski's craft bar. |
| `/12-principles-of-animation` | Audit against Disney's 12 principles, adapted for web. |
| `/60fps-animation` | Fix janky CSS animation, hit 60fps. |
| `/fixing-motion-performance` | Layout thrashing, compositor properties, scroll-linked perf. |
| `/optimize-web-animations` | Page perf profiling with focus on animation and memory leaks. |
| `/accessible-animation` | `prefers-reduced-motion` and motion a11y. |

---

## GSAP

| Skill | Scope |
|---|---|
| `/gsap` | General entry — add or debug GSAP animations. |
| `/gsap-core` | `gsap.to/from/fromTo`, easing, duration, stagger, defaults. |
| `/gsap-timeline` | Timelines, position parameter, nesting, playback. |
| `/gsap-scrolltrigger` | Scroll-linked animation, pinning, scrub, triggers. |
| `/gsap-plugins` | Registration, ScrollToPlugin, ScrollSmoother, Flip, Draggable. |
| `/gsap-utils` | `gsap.utils` — clamp, mapRange, interpolate, random, snap. |
| `/gsap-react` | `useGSAP`, refs, `gsap.context()`, cleanup. |
| `/gsap-frameworks` | Vue, Svelte and other non-React lifecycle/scoping/cleanup. |
| `/gsap-performance` | Transforms, avoiding layout thrash, `will-change`, batching. |
| `/gsap-web` | General "build a scroll animation / pin a section" entry. |
| `/gsap-scrolltrigger-storytelling` | Cinematic sticky product storytelling with progressive reveals. |

---

## Scroll storytelling

| Skill | What it does |
|---|---|
| `/cinematic-scroll-storytelling` | Lenis smooth scroll + GSAP ScrollTrigger cinematic landing pages. |
| `/cinematic-gsap-lenis-motion-system` | Premium GSAP + ScrollTrigger + Lenis motion system. |
| `/scroll-world-storytelling` | Turn an article or brand narrative into a cinematic scroll world. |
| `/scroll-progress-timeline` | Ordered process → data-driven vertical/horizontal scroll story. |
| `/scroll-scrubbed-visual-sequence` | Reversible pinned-stage transformations on normalized progress. |
| `/scroll-scrubbed-word-reveal` | Word-by-word reveal driven by scroll progress, links preserved. |

---

## 3D & Three.js

| Skill | Scope |
|---|---|
| `/threejs` | General — build or debug interactive 3D scenes. |
| `/threejs-fundamentals` | Scene, camera, renderer, Object3D hierarchy, coordinates. |
| `/threejs-geometry` | Built-in shapes, BufferGeometry, custom geometry, instancing. |
| `/threejs-materials` | PBR, basic, phong, shader materials. |
| `/threejs-lighting` | Light types, shadows, environment lighting. |
| `/threejs-textures` | Texture types, UV mapping, environment maps. |
| `/threejs-shaders` | GLSL, ShaderMaterial, uniforms, custom effects. |
| `/threejs-postprocessing` | EffectComposer, bloom, DOF, screen effects. |
| `/threejs-animation` | Keyframe, skeletal, morph targets, animation mixing. |
| `/threejs-interaction` | Raycasting, controls, mouse/touch input, object selection. |
| `/threejs-loaders` | GLTF, textures, models, async loading patterns. |
| `/globe-gl` | Globe.GL 3D globe data visualization. |
| `/cobejs` | Lightweight interactive globe with cobe. |
| `/matterjs` | 2D physics — Engine/World, Render/Runner, bodies. |

---

## Games

| Skill | What it does |
|---|---|
| `/build-isometric-arpg` | Build or extend a playable isometric action RPG. |
| `/author-game-levels` | Flat-world Three.js levels — movement, camera routes, collision. |
| `/design-game-encounters` | Arena layout, enemy composition, encounter pacing. |
| `/design-action-combat` | Attack timing, guard, readable tactical combat. |
| `/tune-enemy-ai` | Aggro, target selection, balancing, testing. |
| `/build-threejs-enemy-systems` | Data-driven enemy archetype and moveset systems. |
| `/build-game-camera-controls` | Isometric framing, follow behavior, orbit/zoom limits. |
| `/build-game-inventory` | Inventory, loot, equipment, tooltips, drag-drop, persistence. |
| `/build-game-audio-feedback` | Action sounds, combat layers, responsive audio. |
| `/create-game-vfx` | Attacks, impacts, damage feedback — readable and perf-safe. |
| `/build-hybrid-game-assets` | Plan/create/audit a hybrid asset pipeline. |
| `/build-mobile-threejs-games` | Touch movement, action controls, target selection on mobile web. |
| `/optimize-threejs-games` | Profile and fix frame-rate issues without regressing gameplay. |
| `/test-playable-web-games` | End-to-end testing with deterministic fixtures + real browser evidence. |
| `/ship-web-games` | Package, deploy, verify a playable web game. |

---

## Sound & audio

| Skill | What it does |
|---|---|
| `/sounds-on-the-web` | Audit UI code for audio feedback best practices. |
| `/generating-sounds-with-ai` | Audit Web Audio API code for synthesis best practices. |
| `/elevenlabs-tts` | Generate ElevenLabs TTS audio from scripts using local voice profiles. |

---

## Making images

Grouped by what you're producing.

**Design mockups & UI references** — pictures of interfaces, before any code exists

| Skill | Output |
|---|---|
| `/imagegen-frontend-web` | Premium, conversion-aware website design references. |
| `/imagegen-frontend-mobile` | App-native mobile screen concepts and full flows. |
| `/image-to-code` | Generates the reference image first, *then* builds the real thing to match. |

**Brand & campaign**

| Skill | Output |
|---|---|
| `/brandkit` | Brand-guidelines boards, logo systems, identity sheets. |
| `/generate-reference-inspired-brand-worlds` | Several original campaign worlds from one visual reference, with a dial for how close to the source. |

**Graphics, posters, social** — via the Efecto canvas

| Skill | Output |
|---|---|
| `/efecto-graphic-design` | Decks, pitch decks, event posters, email headers, blog images. |
| `/efecto-social-media` | Instagram posts and carousels, stories, YouTube thumbnails, TikTok. |

**Generative & art** — images made by code

| Skill | Output |
|---|---|
| `anthropic-skills:canvas-design` | Visual art as `.png` / `.pdf`, driven by design philosophy. |
| `anthropic-skills:algorithmic-art` | p5.js algorithmic art, seeded randomness, tunable parameters. |

**Sourcing instead of generating**

| Skill | Source |
|---|---|
| `/unsplash-asset-images` | Unsplash — avatars, headshots, product, editorial. |
| `/aura-asset-images` | Aura Assets (aura.build/assets), same job. |
| `/company-logos` | Iconify Simple Icons brand logos at 64×64. |
| `/solar-duotone-bold` | Iconify Solar Duotone Bold icon set. |

**Capturing images from things that already exist**

| Skill | Output |
|---|---|
| `/stitched-full-page-capture` | Full-page screenshots of lazy-loaded, scroll-animated, Framer, or WebGL pages. |
| `/html-to-interaction-prompts` | Screenshots + section crops + MP4 + prompts, assembled into an article. |
| `/video-to-superprompt` | Reference video → detailed recreation prompt. |

> **Gap worth knowing:** there's no general text-to-image skill here — nothing for "draw me an illustration of X." Everything above is either UI-shaped (`imagegen-*`), brand-shaped (`brandkit`), canvas-tool-driven (Efecto), or code-drawn (`canvas-design`, `algorithmic-art`). For a one-off illustration or photo, just ask directly — no skill needed.

---

## Slides & video

| Skill | What it does |
|---|---|
| `/frontend-slides` | Animation-rich HTML presentations, or convert from PowerPoint. |
| `/slide-wright` | Animated web presentations from a topic, notes, or outline. |
| `/slidev` | Developer slidedecks in Markdown + Vue with Slidev. |
| `/brag` | Turn the current project site into a shareable launch video (Hyperframes). |
| `/browser-video-recording` | Polished 60fps 4K browser screen-recording videos. |
| `/remotion-best-practices` | Best practices for Remotion. |
| `/video-to-superprompt` | Reference video → detailed recreation/inspiration prompt. |

---

## Non-web & native

| Skill | What it does |
|---|---|
| `/efecto-graphic-design` | Decks, posters, email headers, blog images on the Efecto canvas. |
| `/efecto-social-media` | Instagram posts/carousels/stories, YouTube thumbnails, TikTok. |
| `/swiftui-pro` | Review SwiftUI code for modern APIs, maintainability, performance. |
| `/swiftui-ui-patterns` | SwiftUI views/components — navigation and example-driven patterns. |
| `/react-native-best-practices` | RN perf — FPS, TTI, bundle size, memory leaks, re-renders. |
| `/performance-profiling` | Apple-platform profiling with Instruments, Xcode, MetricKit. |
| `/figma-plugin-builder` | Build Figma plugins — TypeScript, manifest, UI, Dev Mode, publish. |

---

## Frameworks & libraries

**Vue / Nuxt**

| Skill | Scope |
|---|---|
| `/vue` | Vue 3 Composition API, `script setup`, reactivity, built-ins. |
| `/vue-best-practices` | Composition API + TypeScript conventions. Use for any Vue task. |
| `/vue-options-api-best-practices` | Options API style — `data()`, methods, `this`. |
| `/vue-jsx-best-practices` | JSX in Vue — class vs className, plugin config. |
| `/vue-router-best-practices` | Vue Router 4 — guards, params, route-component lifecycle. |
| `/vue-pinia-best-practices` | Pinia store patterns and reactivity. |
| `/pinia` | Pinia official — defining stores, type-safe state. |
| `/vue-testing-best-practices` | Vitest, Vue Test Utils, component testing, mocking. |
| `/vue-debug-guides` | Runtime errors, warnings, async failures, SSR/hydration. |
| `/vueuse-functions` | Apply VueUse composables for concise Vue/Nuxt features. |
| `/create-adaptable-composable` | Library-grade composables accepting `MaybeRef` / `MaybeRefOrGetter`. |
| `/nuxt` | Nuxt SSR, auto-imports, file-based routing. |

**React & others**

| Skill | Scope |
|---|---|
| `/react-doctor` | Health check when finishing a feature or before committing React code. |
| `/react-router-framework-mode` | Full-stack React apps with React Router framework mode. |
| `/svelte-code-writer` | Svelte 5 docs lookup + code analysis CLI. Required for Svelte work. |

**UI libraries / CSS**

| Skill | Scope |
|---|---|
| `/tailwindcss` | Layout, typography, responsive, theming, component patterns. |
| `/shadcn` | Add, search, fix, debug, style, compose shadcn components. |
| `/daisyui` | daisyUI component library for Tailwind. |
| `/unocss` | UnoCSS atomic engine, superset of Tailwind. |

---

## Build tooling & infra

| Skill | Scope |
|---|---|
| `/vite` | Vite config, plugin API, SSR, Vite 8 Rolldown migration. |
| `/vitepress` | Documentation sites with VitePress. |
| `/tsdown` | Bundle TS/JS libraries with Rolldown. |
| `/turborepo` | Monorepo builds and task pipelines. |
| `/pnpm` | pnpm commands and strict dependency resolution. |
| `/antfu` | Anthony Fu's opinionated JS/TS tooling and conventions. |
| `/composio-cli` | Operate the Composio CLI — find tools, connect accounts, inspect schemas. |

---

## Testing & browser automation

| Skill | Scope |
|---|---|
| `/vitest` | Vitest unit testing, mocking, Jest-compatible API. |
| `/playwright-cli` | Browser automation and Playwright tests. |
| `/tdd` | Test-driven development — red/green/refactor. |

---

## Audits & quality

| Skill | What it checks |
|---|---|
| `/web-quality-audit` | Performance, accessibility, SEO, best practices — all in one. |
| `/web-design-guidelines` | UI code against the Web Interface Guidelines. |
| `/audit` | WCAG 2.2 issues — report mode or fix mode. |
| `/fixing-accessibility` | ARIA labels, keyboard nav, focus management, contrast. |
| `/wcag-audit-patterns` | WCAG 2.2 audits — automated + manual + remediation. |
| `/fixing-metadata` | Titles, meta descriptions, canonicals, Open Graph. |
| `/seo-audit` | Diagnose SEO issues on a site. |
| `/firecrawl-seo-audit` | SEO audit driven by live Firecrawl evidence. |
| `/improve` | Senior-advisor codebase survey → prioritized implementation plans. |
| `/improve-codebase-architecture` | Deepening opportunities as a visual HTML report, then grill through them. |
| `/thermo-nuclear-code-quality-review` | Very strict maintainability review — abstraction, giant files, spaghetti. |
| `/audit-verify-explain-grade-5` | Verify claims with evidence, then explain in plain language. |
| `/audit-reference-originality` | Check a design against its source references for plagiarism risk. |

---

## Engineering process

| Skill | What it does |
|---|---|
| `/diagnosing-bugs` | Diagnosis loop for hard bugs and performance regressions. |
| `/domain-modeling` | Pin down domain terminology and the model. |
| `/codebase-design` | Shared vocabulary for designing deep modules. |
| `/grill-with-docs` | Relentless interview to sharpen a plan; produces ADRs and a glossary. |
| `/triage` | Move issues and external PRs through a triage state machine. |
| `/setup-matt-pocock-skills` | Configure a repo for the engineering skills — tracker, triage labels. |
| `/ask-matt` | Router over the Matt Pocock engineering flow. **Half-broken — read below.** |

**About `/ask-matt`.** It's a router, but only over *this* set — Matt Pocock's engineering workflow. It is not a general "which skill should I use" helper, and it currently routes to 9 skills you don't have installed: `/grill-me`, `/handoff`, `/to-spec`, `/to-tickets`, `/implement`, `/wayfinder`, `/research`, `/teach`, `/writing-great-skills`. That includes the spine of the whole flow (`/to-spec` → `/to-tickets` → `/implement`), so following its advice will dead-end.

What's actually installed and works: `/grill-with-docs`, `/domain-modeling`, `/codebase-design`, `/diagnosing-bugs`, `/triage`, `/tdd`, `/setup-matt-pocock-skills`. For planning and execution use `superpowers:brainstorming` → `superpowers:writing-plans` → `superpowers:executing-plans` instead — that chain is fully installed.

---

## UX research & product thinking

The **Layers of Product Design** framework — load `/layers-intro` first.

| Skill | Layer |
|---|---|
| `/layers-intro` | Orientation. Load this first. |
| `/layers-orient` | Diagnostic across all seven layers — finds your bottleneck. |
| `/layers-domain` | Domain concepts, terminology conflicts, bounded contexts. |
| `/layers-observed-behaviour` | Plan research, synthesize into confidence-rated findings. |
| `/layers-user-needs` | Elicit and prioritize needs, pains, desires. |
| `/layers-product-strategy` | Connect opportunities to business outcomes and solution bets. |
| `/layers-conceptual-model` | Objects, relationships, states, vocabulary — independent of UI. |
| `/layers-interaction-flow` | Places, affordances, edge cases, failure paths. |
| `/layers-surface` | Audit the surface against the layers below. |

Also: `/daily-ui-inspiration-capture` — recurring daily UI inspiration capture.

---

## Web research & scraping (Firecrawl)

**Core operations:** `/firecrawl` · `/firecrawl-scrape` · `/firecrawl-crawl` · `/firecrawl-map` · `/firecrawl-search` · `/firecrawl-parse` · `/firecrawl-interact` · `/firecrawl-download` · `/firecrawl-monitor` · `/firecrawl-agent` · `/firecrawl-workflows`

**Build it into an app:** `/firecrawl-build` · `/firecrawl-build-onboarding` · `/firecrawl-build-scrape` · `/firecrawl-build-search` · `/firecrawl-build-interact`

**Research outcomes**

| Skill | Deliverable |
|---|---|
| `/firecrawl-deep-research` | Deep multi-source research run. |
| `/firecrawl-research-papers` | Find and synthesize papers, whitepapers, PDFs, technical reports. |
| `/firecrawl-research-index` | Semantic search over papers answering a research query. |
| `/firecrawl-market-research` | Market, financial, earnings, industry metrics. |
| `/firecrawl-competitive-intel` | Competitor pricing, features, changelogs, product changes. |
| `/firecrawl-lead-gen` | Structured lead lists from prospect databases and directories. |
| `/firecrawl-lead-research` | Pre-meeting lead intelligence briefs. |
| `/firecrawl-company-directories` | Company lists from YC, Crunchbase, Product Hunt, etc. |
| `/firecrawl-knowledge-base` | Local reference docs / RAG-ready chunks from web content. |
| `/firecrawl-knowledge-ingest` | Ingest authenticated or JS-heavy docs portals. |
| `/firecrawl-dashboard-reporting` | Pull metrics from analytics dashboards and internal tools. |
| `/firecrawl-qa` | Exploratory QA of a live site with scrape evidence. |
| `/firecrawl-demo-walkthrough` | Structured UX/product walkthrough of a product's key flows. |
| `/firecrawl-shop` | Cross-web product research → shopping recommendation. |

---

## Writing & social

| Skill | What it does |
|---|---|
| `/write-like-meng-on-x` | Write/rewrite X posts in Meng To's voice. |
| `/x-bookmark-quote-posts` | Turn recent X bookmarks into source-backed quote-post drafts. |

---

## Customer support

| Skill | What it does |
|---|---|
| `/customer-email-draft-threads` | Gmail triage with mandatory full-thread read-back before replying. |
| `/customer-support-verification` | Verify support work against the case flow and thread evidence. |
| `/handle-saas-account-cases` | Account/entitlement access issues, unsupported-platform cases. |
| `/handle-saas-billing-cases` | Cancellations, unpaid/failed-payment cases. |

---

## Meta & skill authoring

| Skill | What it does |
|---|---|
| `/article-prompts-to-skills` | Convert an article or prompt pack into reusable skills. |
| `/html-to-interaction-prompts` | HTML page → screenshot-backed article of interaction prompts. |

---

# Plugin skills

## superpowers — process discipline

| Skill | When |
|---|---|
| `superpowers:brainstorming` | Before any creative work. Required first step for new features. |
| `superpowers:writing-plans` | You have a spec, before touching code. |
| `superpowers:executing-plans` | Execute a written plan in a separate session with review checkpoints. |
| `superpowers:subagent-driven-development` | Execute plan tasks in the current session via subagents. |
| `superpowers:dispatching-parallel-agents` | 2+ independent tasks with no shared state. |
| `superpowers:test-driven-development` | Any feature or bugfix, before implementation code. |
| `superpowers:systematic-debugging` | Any bug or test failure, before proposing fixes. |
| `superpowers:requesting-code-review` | Completing tasks or before merging. |
| `superpowers:receiving-code-review` | Before implementing review feedback. |
| `superpowers:verification-before-completion` | Before claiming work is complete or passing. |
| `superpowers:using-git-worktrees` | Feature work needing isolation from your workspace. |
| `superpowers:finishing-a-development-branch` | Implementation done, deciding how to integrate. |
| `superpowers:writing-skills` | Creating or editing skills. |
| `superpowers:using-superpowers` | How to find and use skills (loads automatically). |

Commands: `/superpowers:brainstorm` · `/superpowers:write-plan` · `/superpowers:execute-plan`

## Vercel / Next.js (47 skills)

**Framework & UI:** `nextjs` · `react-best-practices` · `shadcn` · `geist` · `geistdocs` · `swr` · `turbopack` · `turborepo` · `satori` · `json-render` · `v0-dev` · `micro` · `ncc` · `next-forge`

**AI:** `ai-sdk` · `ai-elements` · `ai-gateway` · `chat-sdk` · `ai-generation-persistence` · `vercel-agent` · `workflow`

**Platform:** `vercel-cli` · `vercel-api` · `deployments-cicd` · `env-vars` · `vercel-functions` · `routing-middleware` · `runtime-cache` · `cron-jobs` · `vercel-queues` · `vercel-sandbox` · `vercel-services` · `vercel-storage` · `vercel-flags` · `vercel-firewall` · `observability` · `marketplace` · `bootstrap`

**Integrations:** `auth` · `payments` · `cms` · `email` · `sign-in-with-vercel`

**Verification:** `agent-browser` · `agent-browser-verify` · `verification` · `investigation-mode`

Prefix all with `vercel:` (or `87b8d0f6bb0a:`). Commands: `/vercel:deploy` · `/vercel:env` · `/vercel:status` · `/vercel:bootstrap` · `/vercel:marketplace`

## Anthropic document & artifact skills

Prefix `anthropic-skills:` or `9d2f1ae18723:`

| Skill | What it does |
|---|---|
| `docx` | Create, read, edit Word documents. |
| `xlsx` | Any task where a spreadsheet is the main input or output. |
| `pptx` | Any task involving a `.pptx` file. |
| `pdf` | Anything with PDF files — read, fill, extract, generate. |
| `doc-coauthoring` | Structured workflow for co-authoring documentation. |
| `internal-comms` | Internal communications in standard formats. |
| `canvas-design` | Visual art as `.png` and `.pdf` using design philosophy. |
| `algorithmic-art` | p5.js algorithmic art with seeded randomness. |
| `brand-guidelines` | Apply Anthropic's official brand colors and typography. |
| `theme-factory` | Style artifacts (slides, docs, HTML) with a theme. |
| `web-artifacts-builder` | Elaborate multi-component claude.ai HTML artifacts. |
| `frontend-design` | Distinctive, intentional visual design for new UI. |
| `webapp-testing` | Interact with and test local web apps via Playwright. |
| `mcp-builder` | Build high-quality MCP servers. |
| `skill-creator` | Create, modify, improve, and measure skills. |
| `claude-api` | Claude API / Anthropic SDK reference. |
| `slack-gif-creator` | Animated GIFs optimized for Slack. |

Also under `anthropic-skills:`: `/morning` · `/schedule` · `/consolidate-memory` · `/setup-cowork`

## Other single-purpose plugins

| Skill | What it does |
|---|---|
| `figma:implement-design` | Figma design → production code with 1:1 fidelity. |
| `figma:create-design-system-rules` | Generate design system rules for your codebase. |
| `figma:code-connect-components` | Connect Figma components to code components. |
| `impeccable:impeccable` | Design, redesign, critique, audit, polish, clarify, distill. |
| `playground:playground` | Interactive single-file HTML playgrounds. |
| `frontend-design:frontend-design` | Distinctive production-grade frontend interfaces. |
| `claude-code-setup:claude-automation-recommender` | Recommend hooks, subagents, skills, plugins, MCPs for a codebase. |
| `posthog:posthog-instrumentation` | Add PostHog analytics instrumentation automatically. |
| `pdf-viewer:` | `open` · `view-pdf` · `annotate` · `fill-form` · `sign` |
| `cowork-plugin-management:` | `create-cowork-plugin` · `cowork-plugin-customizer` |

## Dev workflow plugins

`/code-review:code-review` · `/feature-dev:feature-dev` · `/pr-review-toolkit:review-pr` · `/ralph-loop:ralph-loop` · `/ralph-loop:cancel-ralph` · `/ralph-loop:help`

## Role packs

**engineering:** `architecture` · `code-review` · `debug` · `deploy-checklist` · `documentation` · `incident-response` · `standup` · `system-design` · `tech-debt` · `testing-strategy`

**design:** `design-critique` · `accessibility-review` · `design-system` · `design-handoff` · `user-research` · `research-synthesis` · `ux-copy`

**product-management:** `write-spec` · `roadmap-update` · `sprint-planning` · `metrics-review` · `competitive-brief` · `stakeholder-update` · `synthesize-research` · `product-brainstorming` · `brainstorm`

**marketing:** `campaign-plan` · `content-creation` · `draft-content` · `email-sequence` · `brand-review` · `competitive-brief` · `performance-report` · `seo-audit`

**customer-support:** `ticket-triage` · `draft-response` · `customer-research` · `customer-escalation` · `kb-article`

**human-resources:** `interview-prep` · `draft-offer` · `onboarding` · `performance-review` · `comp-analysis` · `org-planning` · `people-report` · `policy-lookup` · `recruiting-pipeline`

**legal:** `review-contract` · `triage-nda` · `compliance-check` · `legal-risk-assessment` · `legal-response` · `signature-request` · `vendor-check` · `meeting-briefing` · `brief`

---

# MCP servers & external tools

Not skills — these are live tool connections and outside sites. Skills are *knowledge*; MCP servers are *hands*. Name the server in your prompt ("use efecto to…", "pull a component from originkit") and Claude reaches for its tools.

## Connected MCP servers

| Server | What it gives Claude | Invoke with |
|---|---|---|
| **efecto** | 68 design tools — artboards, JSX/Tailwind layouts, brand kits, image search, PNG/SVG export, "open in v0". Designs render live in your browser. | "use **efecto** to design…" |
| **originkit** | Component library — list and pull ready-made components into a build. [originkit.dev](https://originkit.dev) | "check **originkit** for a…" |
| **pencil** | Editor for `.pen` design files (encrypted — only Pencil tools can read them). | "in **pencil**…" |
| **paper** | Paper Design — HTML writing surface. Runs locally on port 29979. | "use **paper** to…" |

Companion skills for Efecto: `/efecto-web-design` · `/efecto-graphic-design` · `/efecto-social-media`

Check what's connected: `claude mcp list`. Re-add originkit if it ever drops (token is in `~/.claude.json`, not repeated here):

```
claude mcp add originkit https://mcp.originkit.dev/mcp --transport http --header "Authorization: Bearer <token>" --scope user
```

## External sites (no MCP — you drive these, then bring the output back)

| Site | What it's for | Pairs with |
|---|---|---|
| [ascii-magic.com](https://www.ascii-magic.com/) | Image/video → ASCII art. Dither engine, text-to-ASCII, dither animation builder, gradient shader, backgrounds. | `/ascii-animation`, `/dither-background`, `/dither-laser-dark-mode` |
| [beam.jakubantalik.com](https://beam.jakubantalik.com/) | Live demo + docs for `border-beam`. | `/beam-glow-states` |
| [orbs.jakubantalik.com](https://orbs.jakubantalik.com/) | Live demo + docs for `thinking-orbs`. | `/thinking-orbs` |
| [metal.jakubantalik.com](https://metal.jakubantalik.com/) | Live demo + docs for `metal-fx` liquid metal shader. | `/liquid-metal-border` |

The three npm packages are installed **per project**, not globally — run this in each new project that needs them:

```
npm install thinking-orbs border-beam metal-fx
```

---

# Built-in Claude Code skills

| Skill | What it does |
|---|---|
| `/dataviz` | Required before writing any chart, graph, dashboard, or plot code. |
| `/artifact-design` | Design guidance for published Artifacts. |
| `/artifact-capabilities` | Runtime capabilities for Artifacts — live data, shared state, self-update. |
| `/claude-api` | Claude API reference — model IDs, pricing, streaming, tool use, caching. |
| `/simplify` | Reuse, simplification, efficiency cleanups on changed code. |
| `/review` | General code review. |
| `/security-review` | Security-focused review. |
| `/run` | Launch and drive this project's app to see a change working. |
| `/init` | Initialize a project for Claude Code. |
| `/loop` | Run a prompt or slash command on a recurring interval. |
| `/schedule` | Create/manage scheduled cloud agents (cron routines). |
| `/update-config` | Configure the harness via settings.json — hooks, permissions, env vars. |
| `/keybindings-help` | Customize keyboard shortcuts. |
| `/fewer-permission-prompts` | Build a permission allowlist from your transcript history. |

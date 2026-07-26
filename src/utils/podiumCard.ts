/**
 * The shareable podium card.
 *
 * A purpose-built export layout drawn straight onto a canvas — deliberately
 * NOT a screenshot of the leaderboard. The live screen changes shape with the
 * viewport and the theme; a card that announces a result to the whole company
 * has to look identical every time it is generated, on any device.
 *
 * Nothing here reads or computes standings. It is handed the three entries the
 * leaderboard has already ranked and draws them.
 */

export type CardTheme = 'light' | 'dark';
export type CardSize = 'landscape' | 'square';

export interface PodiumPerson {
  name: string;
  role?: string;
  points: number;
  imageUrl?: string;
}

export interface PodiumCardInput {
  people: PodiumPerson[]; // in rank order: [1st, 2nd, 3rd]
  title: string;
  subtitle: string;
  logoSrc: string;
}

/**
 * The IQ.wiki tokens converted to sRGB, frozen here on purpose.
 *
 * The exported PNG has no stylesheet and no `.dark` class to read from, and it
 * must not drift when someone edits a token for the app's own surfaces — a card
 * posted in Slack in March should still match one posted in July. Ratios below
 * are measured against this card's own background.
 */
const PALETTE = {
  light: {
    bg: '#FFFFFF',
    surface: '#F9FAFB',
    fg: '#0F172A', //      17.9:1
    mutedFg: '#475569', //  7.6:1
    border: '#E4E7EB',
    plinth: '#EFF1F4',
    // The lit top face of the block. It has to read as the same material as
    // the front face with light falling on it, so it is the same hue a few
    // steps up in value — not a different grey.
    plinthLit: '#F8F9FB',
    accent: '#FF5CAA',
    accentText: '#C9237C', // 5.2:1
    accentWash: 'rgba(255, 92, 170, 0.10)',
    accentWashLit: 'rgba(255, 92, 170, 0.17)',
    accentLine: 'rgba(255, 92, 170, 0.45)',
    glow: 'rgba(255, 92, 170, 0.16)',
  },
  dark: {
    bg: '#17202B',
    surface: '#1B2430',
    fg: '#FAFCF8', //      15.9:1
    mutedFg: '#D2D2D2', // 10.9:1
    border: '#39414B',
    plinth: '#272D38',
    plinthLit: '#343D4A',
    accent: '#FF1A88',
    accentText: '#FF1A88', // 4.5:1
    accentWash: 'rgba(255, 26, 136, 0.14)',
    accentWashLit: 'rgba(255, 26, 136, 0.22)',
    accentLine: 'rgba(255, 26, 136, 0.45)',
    glow: 'rgba(255, 26, 136, 0.20)',
  },
} as const;

/** Fills, never text. Each carries the dark glyph: 9.2 / 9.2 / 7.0. */
const MEDALS = ['#E2B33F', '#B4BBC6', '#D4946C'] as const;
const MEDAL_FG = '#0F172A';

/** What each block is called, and the award that sits on it. */
const AWARD_LABELS = ['CHAMPION', 'RUNNER-UP', 'THIRD PLACE'] as const;
const AWARD_ICONS = ['crown', 'trophy', 'award'] as const;
type AwardIcon = (typeof AWARD_ICONS)[number];

/**
 * Every measurement of both cards, in CSS pixels before the density multiplier.
 *
 * `plinth` and `avatar` are indexed by podium position (1st, 2nd, 3rd), which is
 * what makes the tiering real: the winner stands on the tallest block and is the
 * largest face on the card, rather than being labelled as the winner.
 */
const LAYOUTS = {
  landscape: {
    w: 1200,
    h: 675,
    pad: 64,
    brandY: 46,
    brandSize: 40,
    wordmark: 23,
    titleY: 148,
    titleSize: 48,
    subY: 184,
    subSize: 19,
    floorY: 604,
    colW: 250,
    colGap: 20,
    plinth: [146, 110, 82],
    avatar: [112, 94, 94],
    nameSize: [26, 22, 22],
    roleSize: 16,
    pointsSize: [36, 30, 30],
    awardTile: 34,
    awardPad: 14,
    labelSize: 12,
    footY: 644,
  },
  square: {
    w: 1080,
    h: 1080,
    pad: 72,
    brandY: 70,
    brandSize: 46,
    wordmark: 26,
    titleY: 264,
    titleSize: 60,
    subY: 308,
    subSize: 23,
    floorY: 960,
    colW: 300,
    colGap: 24,
    plinth: [250, 190, 142],
    avatar: [158, 130, 130],
    nameSize: [32, 27, 27],
    roleSize: 19,
    pointsSize: [46, 37, 37],
    awardTile: 44,
    awardPad: 18,
    labelSize: 15,
    footY: 1008,
  },
} as const;

/** Podium positions left-to-right: 2nd, 1st, 3rd. */
const COLUMN_ORDER = [1, 0, 2] as const;

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number | [number, number, number, number],
) {
  const [tl, tr, br, bl] = typeof r === 'number' ? [r, r, r, r] : r;
  ctx.beginPath();
  ctx.moveTo(x + tl, y);
  ctx.lineTo(x + w - tr, y);
  ctx.arcTo(x + w, y, x + w, y + tr, tr);
  ctx.lineTo(x + w, y + h - br);
  ctx.arcTo(x + w, y + h, x + w - br, y + h, br);
  ctx.lineTo(x + bl, y + h);
  ctx.arcTo(x, y + h, x, y + h - bl, bl);
  ctx.lineTo(x, y + tl);
  ctx.arcTo(x, y, x + tl, y, tl);
  ctx.closePath();
}

/** Trims to the available width and appends an ellipsis. No name is ever cut mid-glyph. */
function fit(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let out = text;
  while (out.length > 1 && ctx.measureText(`${out}…`).width > maxWidth) {
    out = out.slice(0, -1);
  }
  return `${out.trimEnd()}…`;
}

function loadImage(src: string, crossOrigin = false): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    if (crossOrigin) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    // A photo that won't load, or one served without CORS headers, must not
    // take the whole card down — that person falls back to their initials.
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function initialsOf(name: string) {
  return (name || '?')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function font(weight: number, size: number) {
  return `${weight} ${size}px Inter, system-ui, -apple-system, sans-serif`;
}

/**
 * The three award glyphs — crown, trophy, ribbon — drawn as paths rather than
 * pulled from the icon font. The screen gets these from lucide; a canvas has no
 * DOM to render an SVG into, and rasterising one would mean shipping the icon
 * set twice. They are described in a 0–1 box and scaled to `size`, so the same
 * source works for the landscape tile and the larger square one.
 */
function drawAward(
  ctx: CanvasRenderingContext2D,
  kind: AwardIcon,
  cx: number,
  cy: number,
  size: number,
  color: string,
) {
  const x0 = cx - size / 2;
  const y0 = cy - size / 2;
  const px = (u: number) => x0 + u * size;
  const py = (v: number) => y0 + v * size;
  const poly = (pts: [number, number][]) => {
    ctx.beginPath();
    pts.forEach(([u, v], i) => (i ? ctx.lineTo(px(u), py(v)) : ctx.moveTo(px(u), py(v))));
    ctx.closePath();
    ctx.fill();
  };
  const box = (u: number, v: number, w: number, h: number) =>
    ctx.fillRect(px(u), py(v), w * size, h * size);

  ctx.save();
  ctx.fillStyle = color;

  if (kind === 'crown') {
    poly([
      [0.06, 0.74],
      [0.06, 0.26],
      [0.3, 0.5],
      [0.5, 0.18],
      [0.7, 0.5],
      [0.94, 0.26],
      [0.94, 0.74],
    ]);
    box(0.06, 0.8, 0.88, 0.1);
  } else if (kind === 'trophy') {
    ctx.beginPath();
    ctx.moveTo(px(0.26), py(0.12));
    ctx.lineTo(px(0.74), py(0.12));
    ctx.lineTo(px(0.74), py(0.34));
    ctx.quadraticCurveTo(px(0.74), py(0.62), px(0.5), py(0.62));
    ctx.quadraticCurveTo(px(0.26), py(0.62), px(0.26), py(0.34));
    ctx.closePath();
    ctx.fill();
    box(0.44, 0.6, 0.12, 0.18);
    box(0.28, 0.78, 0.44, 0.11);
  } else {
    ctx.beginPath();
    ctx.arc(px(0.5), py(0.38), 0.27 * size, 0, Math.PI * 2);
    ctx.fill();
    poly([
      [0.34, 0.6],
      [0.26, 0.94],
      [0.5, 0.78],
      [0.74, 0.94],
      [0.66, 0.6],
    ]);
  }

  ctx.restore();
}

/**
 * Draws the card into `canvas` at `density`× pixel density and resolves once
 * every photo has either loaded or been given up on.
 */
export async function drawPodiumCard(
  canvas: HTMLCanvasElement,
  input: PodiumCardInput,
  theme: CardTheme,
  size: CardSize,
  density = 2,
): Promise<void> {
  const L = LAYOUTS[size];
  const C = PALETTE[theme];
  const people = input.people.slice(0, 3);

  canvas.width = L.w * density;
  canvas.height = L.h * density;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.scale(density, density);
  ctx.textBaseline = 'alphabetic';

  // Inter is a webfont; without this the first render falls back to a system
  // face and every measurement taken for truncation is wrong.
  if (document.fonts?.ready) {
    try {
      await document.fonts.load(font(600, 48));
      await document.fonts.ready;
    } catch {
      /* fall back to whatever is available */
    }
  }

  const [logo, ...photos] = await Promise.all([
    loadImage(input.logoSrc),
    ...people.map((p) => (p.imageUrl ? loadImage(p.imageUrl, true) : Promise.resolve(null))),
  ]);

  /* ---- Canvas ------------------------------------------------------- */
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, L.w, L.h);

  // A single soft light behind the winner. It is the only decoration on the
  // card and it points at the one thing the card is about.
  const glowX = L.w / 2;
  const glowY = L.floorY - L.plinth[0] - L.avatar[0] * 0.6;
  const glow = ctx.createRadialGradient(glowX, glowY, 0, glowX, glowY, L.w * 0.42);
  glow.addColorStop(0, C.glow);
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, L.w, L.h);

  /* ---- Brand -------------------------------------------------------- */
  if (logo) {
    ctx.drawImage(logo, L.pad, L.brandY, L.brandSize, L.brandSize);
  }
  ctx.fillStyle = C.fg;
  ctx.font = font(600, L.wordmark);
  ctx.textAlign = 'left';
  ctx.fillText('IQ Vote', L.pad + L.brandSize + 14, L.brandY + L.brandSize * 0.68);

  /* ---- Title -------------------------------------------------------- */
  ctx.textAlign = 'center';
  ctx.fillStyle = C.fg;
  ctx.font = font(600, L.titleSize);
  ctx.fillText(fit(ctx, input.title, L.w - L.pad * 2), L.w / 2, L.titleY);

  ctx.fillStyle = C.mutedFg;
  ctx.font = font(500, L.subSize);
  ctx.fillText(fit(ctx, input.subtitle, L.w - L.pad * 2), L.w / 2, L.subY);

  /* ---- Podium ------------------------------------------------------- */
  const columns = COLUMN_ORDER.filter((rankIdx) => rankIdx < people.length);
  const totalW = columns.length * L.colW + (columns.length - 1) * L.colGap;
  const startX = (L.w - totalW) / 2;

  columns.forEach((rankIdx, col) => {
    const person = people[rankIdx];
    const photo = photos[rankIdx];
    const x = startX + col * (L.colW + L.colGap);
    const cx = x + L.colW / 2;
    const plinthH = L.plinth[rankIdx];
    const plinthTop = L.floorY - plinthH;
    const isFirst = rankIdx === 0;

    /* Plinth. The block IS the ranking — it is drawn, not described.
       Same shape as the block on the leaderboard: a lit top face raked back
       in perspective sitting on a flat front face, so the podium reads as a
       solid object rather than three bars of different heights. `depth` and
       `topInset` are the projection of the screen's
       `perspective(420px) rotateX(58deg)` at this column width. */
    const depth = Math.round(L.colW * 0.085);
    const topInset = Math.round(L.colW * 0.05);
    const blockTop = plinthTop - depth;
    const edge = isFirst ? C.accentLine : C.border;

    ctx.beginPath();
    ctx.moveTo(x + topInset, blockTop);
    ctx.lineTo(x + L.colW - topInset, blockTop);
    ctx.lineTo(x + L.colW, plinthTop);
    ctx.lineTo(x, plinthTop);
    ctx.closePath();
    ctx.fillStyle = isFirst ? C.accentWashLit : C.plinthLit;
    ctx.fill();
    ctx.strokeStyle = edge;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = isFirst ? C.accentWash : C.plinth;
    ctx.fillRect(x, plinthTop, L.colW, plinthH);
    // The shared edge is already drawn by the top face, so the front face is
    // outlined on three sides only — otherwise that line doubles and reads
    // as a seam across the middle of one solid block.
    ctx.beginPath();
    ctx.moveTo(x + 0.5, plinthTop);
    ctx.lineTo(x + 0.5, L.floorY);
    ctx.lineTo(x + L.colW - 0.5, L.floorY);
    ctx.lineTo(x + L.colW - 0.5, plinthTop);
    ctx.strokeStyle = edge;
    ctx.stroke();

    /* The award, on the face of the block it was won on. */
    const tile = L.awardTile;
    const tileCy = plinthTop + L.awardPad + tile / 2;
    roundRect(ctx, cx - tile / 2, plinthTop + L.awardPad, tile, tile, Math.round(tile * 0.28));
    ctx.fillStyle = MEDALS[rankIdx];
    ctx.fill();
    drawAward(ctx, AWARD_ICONS[rankIdx], cx, tileCy, tile * 0.55, MEDAL_FG);

    ctx.textAlign = 'center';
    ctx.fillStyle = isFirst ? C.accentText : C.mutedFg;
    ctx.font = font(600, L.labelSize);
    ctx.letterSpacing = `${(L.labelSize * 0.11).toFixed(2)}px`;
    ctx.fillText(AWARD_LABELS[rankIdx], cx, tileCy + tile / 2 + 12 + L.labelSize * 0.8);
    ctx.letterSpacing = '0px';

    /* Everything above the block, stacked upward from its top edge. */
    const pointsSize = L.pointsSize[rankIdx];
    const nameSize = L.nameSize[rankIdx];
    const pointsY = blockTop - Math.round(pointsSize * 0.62);
    const roleY = pointsY - Math.round(pointsSize * 1.05);
    const nameY = roleY - Math.round(nameSize * 1.12);
    const avatarSize = L.avatar[rankIdx];
    const avatarTop = nameY - Math.round(nameSize * 1.35) - avatarSize;

    ctx.fillStyle = isFirst ? C.accentText : C.fg;
    ctx.font = font(700, pointsSize);
    ctx.fillText(`${person.points} pts`, cx, pointsY);

    ctx.fillStyle = C.mutedFg;
    ctx.font = font(500, L.roleSize);
    if (person.role) {
      ctx.fillText(fit(ctx, person.role, L.colW - 16), cx, roleY);
    }

    ctx.fillStyle = C.fg;
    ctx.font = font(600, nameSize);
    ctx.fillText(fit(ctx, person.name, L.colW - 12), cx, nameY);

    /* Avatar */
    const ax = cx - avatarSize / 2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, avatarTop + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.fillStyle = C.plinth;
    ctx.fillRect(ax, avatarTop, avatarSize, avatarSize);
    if (photo) {
      // Cover, not stretch — a portrait crops to the circle rather than squashing.
      const scale = Math.max(avatarSize / photo.width, avatarSize / photo.height);
      const dw = photo.width * scale;
      const dh = photo.height * scale;
      ctx.drawImage(photo, cx - dw / 2, avatarTop + avatarSize / 2 - dh / 2, dw, dh);
    } else {
      ctx.fillStyle = C.mutedFg;
      ctx.font = font(600, Math.round(avatarSize * 0.32));
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(initialsOf(person.name), cx, avatarTop + avatarSize / 2);
      ctx.textBaseline = 'alphabetic';
    }
    ctx.restore();

    ctx.beginPath();
    ctx.arc(cx, avatarTop + avatarSize / 2, avatarSize / 2 - 1, 0, Math.PI * 2);
    ctx.strokeStyle = isFirst ? C.accent : C.border;
    ctx.lineWidth = isFirst ? 3 : 2;
    ctx.stroke();

    /* Medal, on the rim of the face it belongs to. The disc sits inside a
       hairline of the card background — against a white page the gold is
       about 1.9:1 and its edge would otherwise vanish. */
    const mr = Math.round(avatarSize * 0.2);
    const mx = cx + avatarSize * 0.34;
    const my = avatarTop + avatarSize * 0.86;
    ctx.beginPath();
    ctx.arc(mx, my, mr + 3, 0, Math.PI * 2);
    ctx.fillStyle = C.bg;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(mx, my, mr, 0, Math.PI * 2);
    ctx.fillStyle = MEDALS[rankIdx];
    ctx.fill();
    ctx.fillStyle = MEDAL_FG;
    ctx.font = font(700, Math.round(mr * 1.15));
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(rankIdx + 1), mx, my + 0.5);
    ctx.textBaseline = 'alphabetic';
  });

  /* ---- Floor -------------------------------------------------------- */
  ctx.fillStyle = C.border;
  ctx.fillRect(L.pad, L.floorY, L.w - L.pad * 2, 1);

  /* ---- Footer ------------------------------------------------------- */
  ctx.textAlign = 'center';
  ctx.fillStyle = C.mutedFg;
  ctx.font = font(500, size === 'square' ? 18 : 16);
  ctx.fillText('Chosen by the team at BrainDAO', L.w / 2, L.footY);
}

export function podiumCardFilename(subtitle: string, size: CardSize) {
  const slug = subtitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `iq-vote-podium-${slug || 'standings'}-${size}.png`;
}

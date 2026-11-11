/**
 * Phase 1: Figma Extraction
 *
 * Parses a Figma URL, calls the REST API, walks the node tree,
 * and returns a flat array of structured blocks with layout,
 * color, typography, and dimension data.
 *
 * Based on AIUXMirror logic — same traversal, same output shape.
 */

// ── Paint helpers ────────────────────────────────────────────

function toHex(ch) {
  return Math.round(ch * 255)
    .toString(16)
    .padStart(2, '0');
}

function rgbaToString(c) {
  if (c.a < 0.99) {
    const r = Math.round(c.r * 255);
    const g = Math.round(c.g * 255);
    const b = Math.round(c.b * 255);
    return `rgba(${r}, ${g}, ${b}, ${parseFloat(c.a.toFixed(2))})`;
  }
  return `#${toHex(c.r)}${toHex(c.g)}${toHex(c.b)}`;
}

function solidColor(paints) {
  if (!paints) return null;
  for (const p of paints) {
    if (p.type === 'SOLID' && p.visible !== false && p.color) {
      return rgbaToString(p.color);
    }
  }
  return null;
}

function gradientValue(paints) {
  if (!paints) return null;
  for (const p of paints) {
    if (p.visible === false || !p.gradientStops?.length) continue;
    const stops = p.gradientStops
      .map(s => `${rgbaToString(s.color)} ${Math.round(s.position * 100)}%`)
      .join(', ');
    if (p.type === 'GRADIENT_LINEAR') {
      let angle = 135;
      if (p.gradientHandlePositions?.length >= 2) {
        const dx =
          p.gradientHandlePositions[1].x - p.gradientHandlePositions[0].x;
        const dy =
          p.gradientHandlePositions[1].y - p.gradientHandlePositions[0].y;
        angle = Math.round(((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360);
      }
      return `linear-gradient(${angle}deg, ${stops})`;
    }
    if (p.type === 'GRADIENT_RADIAL') {
      return `radial-gradient(circle, ${stops})`;
    }
  }
  return null;
}

function hasImageFill(paints) {
  return paints?.some(p => p.type === 'IMAGE' && p.visible !== false) ?? false;
}

function dropShadowValue(effects) {
  if (!effects?.length) return null;
  const drops = effects.filter(
    s => s.type === 'DROP_SHADOW' && s.visible !== false
  );
  if (!drops.length) return null;
  return drops
    .map(s => {
      const c = s.color ?? {r: 0, g: 0, b: 0, a: 0.1};
      const col = rgbaToString({...c, a: c.a ?? 0.1});
      return `${s.offset?.x ?? 0}px ${s.offset?.y ?? 4}px ${s.radius ?? 8}px ${s.spread ?? 0}px ${col}`;
    })
    .join(', ');
}

// ── URL parser ───────────────────────────────────────────────

export function parseFigmaUrl(raw) {
  let u;
  try {
    u = new URL(raw.trim());
  } catch {
    throw new Error('Invalid URL');
  }
  if (!u.hostname.includes('figma.com')) throw new Error('Not a Figma URL');

  const seg = /\/(?:file|design|proto)\/([a-zA-Z0-9_-]+)/.exec(u.pathname);
  if (!seg) throw new Error('URL must contain /file/, /design/, or /proto/');

  const rawId = u.searchParams.get('node-id');
  if (!rawId)
    throw new Error(
      'Missing ?node-id — right-click a frame → Copy link to selection'
    );

  return {
    fileKey: seg[1],
    frameId: decodeURIComponent(rawId).replace(/-/g, ':')
  };
}

// ── Figma API call ───────────────────────────────────────────

export async function fetchFigmaFrame(url, token) {
  const {fileKey, frameId} = parseFigmaUrl(url);

  const endpoint =
    `https://api.figma.com/v1/files/${fileKey}/nodes` +
    `?ids=${encodeURIComponent(frameId)}&geometry=paths`;

  const resp = await fetch(endpoint, {
    headers: {'X-Figma-Token': token}
  });

  if (resp.status === 401 || resp.status === 403) {
    throw new Error('Token rejected — check your Figma personal access token');
  }
  if (!resp.ok) {
    throw new Error(`Figma API returned ${resp.status} ${resp.statusText}`);
  }

  const body = await resp.json();
  const entry = body.nodes[frameId];
  if (!entry?.document) {
    throw new Error(`Frame "${frameId}" not found in file "${fileKey}"`);
  }

  return {
    layer: entry.document,
    title: entry.document.name,
    fileKey,
    frameId
  };
}

// ── Node traversal ───────────────────────────────────────────

const CONTAINER_KINDS = new Set([
  'FRAME',
  'COMPONENT',
  'COMPONENT_SET',
  'INSTANCE',
  'GROUP'
]);
const GLYPH_KINDS = new Set([
  'VECTOR',
  'ELLIPSE',
  'POLYGON',
  'STAR',
  'LINE',
  'BOOLEAN_OPERATION'
]);

// Returns true if the layer name definitively identifies it as an icon component.
// Safe to call BEFORE the layoutMode check because these naming conventions are
// unambiguous — an "Icon/arrow-right" or "sn-aix-icon/chevron" is always an icon,
// even when the component uses auto-layout for internal centering.
function isDefinitiveIconName(layer) {
  const name = layer.name.toLowerCase().trim();
  // Slash-notation families: "Icon/arrow-right", "sn-aix-icon/chevron-down", "Icons/..."
  if (
    name.includes('/') &&
    /^(icons?|glyph|sn-ai[ux]x?-icon)/.test(name.split('/')[0].trim())
  )
    return true;
  return false;
}

// Returns true if an INSTANCE/COMPONENT layer looks like an icon based on name or size.
// Only called for nodes that already failed the layoutMode check (no auto-layout).
function looksLikeIcon(layer) {
  const name = layer.name.toLowerCase();

  // Name contains "icon" as a word, or uses common icon prefix/suffix patterns
  if (/\bicon\b|^ic[-_]/.test(name)) return true;

  // Size-based: small, roughly square element (standard icon sizes: 12–40px)
  const bb = layer.absoluteBoundingBox;
  if (
    bb &&
    bb.width >= 8 &&
    bb.width <= 40 &&
    bb.height >= 8 &&
    bb.height <= 40
  ) {
    if (Math.abs(bb.width - bb.height) <= 4) return true;
  }

  return false;
}

function resolveRole(layer) {
  if (layer.type === 'TEXT') return 'label';
  if (layer.type === 'RECTANGLE') return 'shape';
  if (GLYPH_KINDS.has(layer.type)) return 'glyph';

  if (CONTAINER_KINDS.has(layer.type)) {
    // Definitive icon names (slash-notation) take priority over layoutMode —
    // icon components in Figma frequently use auto-layout for internal centering.
    if (
      (layer.type === 'INSTANCE' || layer.type === 'COMPONENT') &&
      isDefinitiveIconName(layer)
    ) {
      return 'glyph';
    }
    if (layer.layoutMode === 'HORIZONTAL') return 'row';
    if (layer.layoutMode === 'VERTICAL') return 'column';
    // No layoutMode — check name/size heuristics before falling back to surface
    if (
      (layer.type === 'INSTANCE' || layer.type === 'COMPONENT') &&
      looksLikeIcon(layer)
    ) {
      return 'glyph';
    }
    return 'surface';
  }

  const n = layer.name.toLowerCase();
  if (/\bbtn\b|button/.test(n)) return 'trigger';
  if (/input|textfield|textbox/.test(n)) return 'field';
  if (/select|dropdown|combobox/.test(n)) return 'picker';
  return 'unknown';
}

function walkLayer(layer, depth, out) {
  if (layer.visible === false || layer.type === 'SLICE') return;

  const role = resolveRole(layer);
  const bb = layer.absoluteBoundingBox;

  // Dimensions
  const dims = {};
  if (bb?.width > 0) dims.w = Math.round(bb.width);
  if (bb?.height > 0) dims.h = Math.round(bb.height);

  // Palette (colors, borders, radius, shadows)
  const palette = {};
  if (hasImageFill(layer.fills)) {
    palette.imagePlaceholder = true;
  } else {
    const grad = gradientValue(layer.fills);
    if (grad) palette.gradient = grad;
    else {
      const bg = solidColor(layer.fills);
      if (bg) palette.bg = bg;
    }
  }
  const border = solidColor(layer.strokes);
  if (border) palette.border = border;
  if ((layer.strokeWeight ?? 0) > 0) palette.borderWidth = layer.strokeWeight;
  if (layer.cornerRadius > 0) {
    palette.radius = layer.cornerRadius;
  } else if (layer.rectangleCornerRadii) {
    const [tl, tr, br, bl] = layer.rectangleCornerRadii;
    if (tl || tr || br || bl) palette.radii = [tl, tr, br, bl];
  }
  if (layer.opacity != null && layer.opacity < 0.99) {
    palette.opacity = parseFloat(layer.opacity.toFixed(2));
  }
  const shadow = dropShadowValue(layer.effects);
  if (shadow) palette.shadow = shadow;

  // Flow (flex layout props)
  const flow = {};
  if ((layer.itemSpacing ?? 0) > 0) flow.gap = layer.itemSpacing;
  const pt = layer.paddingTop ?? 0;
  const pr = layer.paddingRight ?? 0;
  const pb = layer.paddingBottom ?? 0;
  const pl = layer.paddingLeft ?? 0;
  if (pt || pr || pb || pl) flow.padding = [pt, pr, pb, pl];
  if (layer.layoutWrap === 'WRAP') flow.wrap = true;
  if (layer.clipsContent) flow.overflow = 'hidden';
  if (layer.layoutGrow === 1) flow.grow = true;

  const PACK = {
    MIN: 'start',
    MAX: 'end',
    CENTER: 'center',
    SPACE_BETWEEN: 'between',
    STRETCH: 'stretch',
    BASELINE: 'baseline'
  };
  if (layer.primaryAxisAlignItems)
    flow.justify = PACK[layer.primaryAxisAlignItems] ?? 'start';
  if (layer.counterAxisAlignItems)
    flow.align = PACK[layer.counterAxisAlignItems] ?? 'start';

  // Typography
  const typo = {};
  if (layer.type === 'TEXT' && layer.style) {
    const s = layer.style;
    if (s.fontSize) typo.size = s.fontSize;
    if (s.fontWeight) typo.weight = s.fontWeight;
    if (s.fontFamily) typo.family = s.fontFamily;
    if (s.lineHeightPx && s.fontSize)
      typo.lineHeight = +(s.lineHeightPx / s.fontSize).toFixed(2);
    if (s.letterSpacing && Math.abs(s.letterSpacing) > 0.01)
      typo.tracking = s.letterSpacing;
    if (s.textAlignHorizontal) typo.align = s.textAlignHorizontal.toLowerCase();
    if (s.textCase && s.textCase !== 'ORIGINAL')
      typo.transform = s.textCase.toLowerCase();
    if (s.textDecoration && s.textDecoration !== 'NONE')
      typo.decoration = s.textDecoration.toLowerCase();
    const fc = solidColor(layer.fills);
    if (fc) typo.color = fc;
  }

  const block = {
    id: layer.id,
    name: layer.name,
    type: layer.type,
    role,
    depth,
    ...(Object.keys(dims).length && {dims}),
    ...(Object.keys(palette).length && {palette}),
    ...(Object.keys(flow).length && {flow}),
    ...(Object.keys(typo).length && {typo}),
    ...(layer.type === 'TEXT' &&
      layer.characters != null && {content: layer.characters})
  };

  out.push(block);

  // Glyph nodes (icons) are leaf elements — don't walk into their internal vector paths
  if (role === 'glyph') return;

  // Recurse children
  const kids = (layer.children ?? []).filter(
    c => c.visible !== false && c.type !== 'SLICE'
  );
  for (const kid of kids) {
    walkLayer(kid, depth + 1, out);
  }
}

export function extractBlocks(rootLayer) {
  const blocks = [];
  walkLayer(rootLayer, 0, blocks);
  return blocks;
}

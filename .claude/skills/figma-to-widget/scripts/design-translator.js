/**
 * Phase 2: Design Translator
 *
 * Takes raw Figma blocks from Phase 1 and deterministically maps them
 * to Tailwind classes, DaisyUI patterns, CSS custom properties, and
 * aiux-icon matches.
 *
 * This is the key layer that makes the LLM's job trivially easy —
 * by the time Claude sees the blueprint, all the mapping decisions
 * are already made.
 */

// ── Tailwind spacing scale ───────────────────────────────────
// px:    0  4   8  12  16  20  24  32  40  48  64  80  96
// scale: 0  1   2   3   4   5   6   8  10  12  16  20  24

const SPACING_PX = [0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128];
const SPACING_SCALE = [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32];

export function pxToScale(px) {
  let closest = 0;
  let minDist = Infinity;
  SPACING_PX.forEach((val, i) => {
    const dist = Math.abs(px - val);
    if (dist < minDist) {
      minDist = dist;
      closest = SPACING_SCALE[i];
    }
  });
  return closest;
}

// ── Font size mapping ────────────────────────────────────────

const FONT_SIZE_MAP = [
  [12, 'text-xs'],
  [14, 'text-sm'],
  [16, 'text-base'],
  [18, 'text-lg'],
  [20, 'text-xl'],
  [24, 'text-2xl'],
  [30, 'text-3xl']
];

export function mapFontSize(px) {
  if (!px) return 'text-sm';
  let best = 'text-sm',
    minDist = Infinity;
  for (const [size, cls] of FONT_SIZE_MAP) {
    const d = Math.abs(px - size);
    if (d < minDist) {
      minDist = d;
      best = cls;
    }
  }
  return best;
}

// ── Font weight mapping ──────────────────────────────────────

const WEIGHT_MAP = [
  [100, 'font-thin'],
  [200, 'font-light'],
  [300, 'font-light'],
  [400, 'font-normal'],
  [500, 'font-medium'],
  [600, 'font-semibold'],
  [700, 'font-bold'],
  [800, 'font-extrabold']
];

export function mapFontWeight(w) {
  if (!w || w === 400) return '';
  let best = 'font-normal',
    minDist = Infinity;
  for (const [weight, cls] of WEIGHT_MAP) {
    const d = Math.abs(w - weight);
    if (d < minDist) {
      minDist = d;
      best = cls;
    }
  }
  return best;
}

// ── Border radius mapping ────────────────────────────────────

const RADIUS_MAP = [
  [0, 'rounded-none'],
  [2, 'rounded-sm'],
  [4, 'rounded'],
  [6, 'rounded-md'],
  [8, 'rounded-lg'],
  [12, 'rounded-xl'],
  [16, 'rounded-2xl'],
  [24, 'rounded-3xl'],
  [9999, 'rounded-full']
];

export function mapRadius(r) {
  if (!r) return '';
  if (r >= 100) return 'rounded-full';
  let best = 'rounded',
    minDist = Infinity;
  for (const [px, cls] of RADIUS_MAP) {
    const d = Math.abs(r - px);
    if (d < minDist) {
      minDist = d;
      best = cls;
    }
  }
  return best;
}

// ── Shadow mapping ───────────────────────────────────────────

export function mapShadow(shadowStr) {
  if (!shadowStr) return '';
  // Extract the blur radius to gauge intensity
  const blurMatch = /\d+px\s+\d+px\s+(\d+)px/.exec(shadowStr);
  const blur = blurMatch ? parseInt(blurMatch[1]) : 8;
  if (blur <= 2) return 'shadow-sm';
  if (blur <= 4) return 'shadow';
  if (blur <= 8) return 'shadow-md';
  if (blur <= 12) return 'shadow-lg';
  if (blur <= 20) return 'shadow-xl';
  return 'shadow-2xl';
}

// ── Color mapping ────────────────────────────────────────────
// Maps hex colors → Tailwind/DaisyUI semantic classes or CSS vars

const BG_COLOR_MAP = {
  '#ffffff': 'bg-base-100',
  '#000000': 'bg-black',
  '#f9fafb': 'bg-base-200',
  '#f3f4f6': 'bg-base-300',
  '#e5e7eb': 'bg-base-300',
  '#d1d5db': 'bg-base-300',
  '#fef2f2': 'bg-error/10',
  '#fef3c7': 'bg-warning/10',
  '#dcfce7': 'bg-success/10',
  '#ecfeff': 'bg-info/10',
  '#f5f3ff': 'bg-purple-100',
  '#fffbeb': 'bg-warning/10'
};

const TEXT_COLOR_MAP = {
  '#ffffff': 'text-white',
  '#1f2937': 'text-base-content',
  '#374151': 'text-base-content',
  '#6b7280': 'text-base-content/60',
  '#9ca3af': 'text-base-content/40',
  '#d1d5db': 'text-base-content/30'
};

// CSS custom properties for theme-aware colors — fallback for unmapped hex values.
// Only covers colors not already handled by BG_COLOR_MAP or TEXT_COLOR_MAP.
const CSS_VAR_MAP = {
  '#1f2937': 'var(--color-base-content, #1f2937)'
};

export function mapBgColor(hex) {
  if (!hex) return {twClass: '', cssVar: null};
  const lower = hex.toLowerCase();
  const twClass = BG_COLOR_MAP[lower] || '';
  const cssVar = !twClass ? CSS_VAR_MAP[lower] || null : null;
  return {twClass, cssVar, raw: !twClass && !cssVar ? hex : null};
}

export function mapTextColor(hex) {
  if (!hex) return {twClass: '', cssVar: null};
  const lower = hex.toLowerCase();
  const twClass = TEXT_COLOR_MAP[lower] || '';
  const cssVar = !twClass ? CSS_VAR_MAP[lower] || null : null;
  return {twClass, cssVar, raw: !twClass && !cssVar ? hex : null};
}

// ── Opacity mapping ──────────────────────────────────────────

const OPACITY_STEPS = [0, 5, 10, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90, 100];

export function mapOpacity(value) {
  if (value == null || value >= 0.99) return '';
  const pct = Math.round(value * 100);
  const snapped = OPACITY_STEPS.reduce((a, b) =>
    Math.abs(b - pct) < Math.abs(a - pct) ? b : a
  );
  return `opacity-${snapped}`;
}

// ── Icon matching ────────────────────────────────────────────
// Maps Figma layer names to aiux-icon names from the catalog

const ICON_KEYWORDS = {
  'arrow-right': 'arrow-right',
  'arrow-left': 'arrow-left',
  'arrow-up': 'arrow-up',
  'arrow-down': 'arrow-down',
  arrow: 'arrow-right',
  back: 'arrow-left',
  forward: 'arrow-right',
  close: 'close',
  x: 'close',
  dismiss: 'close',
  cancel: 'close',
  search: 'magnifying-glass',
  find: 'magnifying-glass',
  settings: 'gear',
  setting: 'gear',
  config: 'gear',
  cog: 'gear',
  user: 'circle-user',
  profile: 'circle-user',
  person: 'circle-user',
  avatar: 'circle-user',
  home: 'home',
  house: 'home',
  bell: 'bell',
  notification: 'bell',
  alert: 'bell',
  mail: 'envelope',
  email: 'envelope',
  message: 'envelope',
  edit: 'pencil',
  pencil: 'pencil',
  write: 'pencil',
  delete: 'trash',
  trash: 'trash',
  remove: 'trash',
  add: 'plus',
  plus: 'plus',
  new: 'plus',
  create: 'plus',
  check: 'circle-check',
  success: 'circle-check',
  done: 'circle-check',
  complete: 'circle-check',
  warning: 'triangle-exclamation',
  warn: 'triangle-exclamation',
  caution: 'triangle-exclamation',
  info: 'circle-info',
  information: 'circle-info',
  error: 'circle-close',
  fail: 'circle-close',
  star: 'star',
  favorite: 'star',
  fav: 'star',
  rate: 'star',
  heart: 'heart',
  like: 'heart',
  love: 'heart',
  lock: 'lock',
  secure: 'lock',
  locked: 'lock',
  unlock: 'unlock',
  unlocked: 'unlock',
  calendar: 'calendar',
  date: 'calendar',
  schedule: 'calendar',
  clock: 'clock',
  time: 'clock',
  timer: 'clock',
  download: 'download',
  upload: 'upload',
  filter: 'filter',
  sort: 'sort-ascending',
  menu: 'menu',
  hamburger: 'menu',
  nav: 'menu',
  refresh: 'arrow-clockwise',
  reload: 'arrow-clockwise',
  sync: 'sync',
  save: 'save',
  copy: 'clipboard',
  clipboard: 'clipboard',
  share: 'share',
  link: 'link',
  url: 'link',
  phone: 'phone',
  call: 'phone',
  chat: 'chat',
  comment: 'comment',
  discuss: 'chat',
  document: 'document',
  doc: 'document',
  file: 'document',
  paper: 'document',
  // Task / work concepts → checklist/clipboard icons
  task: 'checklist',
  tasks: 'checklist',
  todo: 'checklist',
  todos: 'checklist',
  'to-do': 'checklist',
  'action-item': 'checklist',
  'work-item': 'user-clipboard',
  assignment: 'user-clipboard',
  assigned: 'user-clipboard',
  approve: 'clipboard-check',
  approval: 'clipboard-check',
  incident: 'triangle-exclamation',
  request: 'user-clipboard',
  folder: 'folder',
  image: 'image',
  photo: 'image',
  picture: 'image',
  play: 'play',
  start: 'play',
  pause: 'pause',
  stop: 'stop',
  'chevron-right': 'chevron-right',
  'chevron-left': 'chevron-left',
  'chevron-down': 'chevron-down',
  'chevron-up': 'chevron-up',
  chevron: 'chevron-right',
  caret: 'caret-down',
  expand: 'expand',
  eye: 'eye',
  view: 'eye',
  visible: 'eye',
  show: 'eye',
  'eye-off': 'eye-slash',
  hide: 'eye-slash',
  hidden: 'eye-slash',
  bookmark: 'bookmark',
  pin: 'thumbtack',
  tag: 'tag',
  label: 'tag',
  fire: 'fire',
  hot: 'fire',
  trending: 'fire',
  lightning: 'lightning',
  flash: 'lightning',
  bolt: 'lightning',
  sparkle: 'ai-sparkle',
  ai: 'ai-sparkle',
  magic: 'ai-sparkle',
  robot: 'bot',
  bot: 'bot',
  globe: 'globe',
  world: 'globe',
  web: 'globe',
  map: 'map-pin',
  location: 'map-pin',
  cart: 'shopping-cart',
  shop: 'shopping-cart',
  basket: 'shopping-cart',
  money: 'currency',
  dollar: 'currency',
  payment: 'currency',
  key: 'key',
  shield: 'shield-check',
  security: 'shield-check',
  bug: 'bug',
  code: 'code',
  dev: 'code',
  terminal: 'console',
  database: 'database',
  db: 'database',
  data: 'database',
  cloud: 'cloud',
  'thumbs-up': 'thumbs-up',
  'thumb-up': 'thumbs-up',
  'thumbs-down': 'thumbs-down',
  'thumb-down': 'thumbs-down',
  chart: 'chart-bar-vertical',
  graph: 'chart-line',
  analytics: 'analytics-center',
  dashboard: 'dashboard-dial',
  inbox: 'inbox',
  attach: 'paperclip',
  attachment: 'paperclip',
  'external-link': 'arrow-up-right',
  more: 'more-horizontal',
  dots: 'more-horizontal',
  ellipsis: 'more-horizontal',
  drag: 'drag-dots',
  reorder: 'drag-dots',
  help: 'circle-question',
  question: 'circle-question',
  // Workflow / process
  workflow: 'workflow',
  process: 'workflow',
  flow: 'workflow',
  change: 'change',
  changes: 'change',
  // Status concepts
  overdue: 'clock',
  urgent: 'triangle-exclamation',
  critical: 'circle-exclamation',
  attention: 'triangle-exclamation',
  pending: 'ongoing',
  progress: 'ongoing',
  'in-progress': 'ongoing',
  // External / navigation
  external: 'external-action',
  'open-new': 'external-action',
  'expand-external': 'external-action',
  // People
  team: 'user-group',
  group: 'user-group',
  members: 'user-group',
  agent: 'headset',
  support: 'headset',
  // Catalog / knowledge
  catalog: 'catalog',
  knowledge: 'book-open',
  kb: 'book-open',
  // Dashboard
  gauge: 'dashboard-dial'
};

export function matchIcon(layerName) {
  // Slash-notation: "Icon/arrow-right", "aiux-icon/chevron-down/20"
  // → extract the most-specific segment (last slash part) and try it first
  if (layerName.includes('/')) {
    const segments = layerName.split('/');
    for (let i = segments.length - 1; i >= 0; i--) {
      const seg = segments[i]
        .toLowerCase()
        .replace(/[_\\]/g, '-')
        .replace(/[^a-z0-9-]/g, '');
      if (!seg || /^\d+$/.test(seg)) continue; // skip empty or pure-number size suffixes
      if (ICON_KEYWORDS[seg]) return ICON_KEYWORDS[seg];
      // Also try words within this segment
      const segWords = seg.split('-');
      for (const w of segWords) {
        if (w.length >= 2 && ICON_KEYWORDS[w]) return ICON_KEYWORDS[w];
      }
    }
  }

  const lower = layerName
    .toLowerCase()
    .replace(/[_/\\]/g, '-')
    .replace(/[^a-z0-9-\s]/g, ' ');

  // Try exact compound match first (e.g. "arrow-right")
  const kebab = lower.trim().replace(/\s+/g, '-');
  if (ICON_KEYWORDS[kebab]) return ICON_KEYWORDS[kebab];

  // Try each word
  const words = lower.split(/[\s-]+/);
  for (const word of words) {
    if (word.length < 2) continue;
    if (ICON_KEYWORDS[word]) return ICON_KEYWORDS[word];
  }

  return null;
}

// ── DaisyUI pattern detection ────────────────────────────────

const DAISY_PATTERNS = [
  [/\bbtn\b|button/i, 'btn'],
  [/badge|tag|chip|pill/i, 'badge'],
  [/card/i, 'card'],
  [/avatar/i, 'avatar'],
  [/toggle|switch/i, 'toggle'],
  [/\binput\b|textfield|text-field/i, 'input'],
  [/alert|toast|notification-bar/i, 'alert'],
  [/modal|dialog|overlay/i, 'modal'],
  [/\btab\b|\btabs\b/i, 'tabs'],
  [/dropdown|select|combobox/i, 'dropdown'],
  [/progress|loading-bar/i, 'progress'],
  [/tooltip|popover/i, 'tooltip'],
  [/checkbox/i, 'checkbox'],
  [/radio/i, 'radio'],
  [/menu|nav-item/i, 'menu'],
  [/table|data-grid/i, 'table'],
  [/breadcrumb/i, 'breadcrumbs'],
  [/stat|kpi|metric/i, 'stat'],
  [/collapse|accordion|expandable/i, 'collapse']
];

export function detectDaisyPattern(name) {
  const lower = name.toLowerCase();
  for (const [regex, pattern] of DAISY_PATTERNS) {
    if (regex.test(lower)) return pattern;
  }
  return null;
}

// ── Padding mapper ───────────────────────────────────────────

export function mapPadding(arr) {
  if (!arr) return '';
  const [t, r, b, l] = arr;
  // All equal
  if (t === r && r === b && b === l) return `p-${pxToScale(t)}`;
  // Symmetric
  if (t === b && l === r) return `py-${pxToScale(t)} px-${pxToScale(l)}`;
  // Fallback to uniform (best available without pt-*/pr-*/pb-*/pl-*)
  // Use py + px if close enough, otherwise use p- with average
  const avgV = (t + b) / 2,
    avgH = (l + r) / 2;
  return `py-${pxToScale(avgV)} px-${pxToScale(avgH)}`;
}

// ── Main translator ──────────────────────────────────────────

export function translateBlock(block) {
  const tw = []; // Tailwind classes for the template
  const cssProps = {}; // CSS properties for static styles
  const notes = []; // Human-readable notes for the prompt

  // ── Layout ──
  if (block.role === 'row') tw.push('flex', 'flex-row');
  if (block.role === 'column') tw.push('flex', 'flex-col');

  // ── Flow properties ──
  if (block.flow) {
    if (block.flow.gap) tw.push(`gap-${pxToScale(block.flow.gap)}`);
    if (block.flow.padding) tw.push(mapPadding(block.flow.padding));
    if (block.flow.wrap) tw.push('flex-wrap');
    if (block.flow.grow) tw.push('flex-1');
    if (block.flow.justify && block.flow.justify !== 'start')
      tw.push(`justify-${block.flow.justify}`);
    if (block.flow.align && block.flow.align !== 'start')
      tw.push(`items-${block.flow.align}`);
    if (block.flow.overflow === 'hidden') tw.push('overflow-hidden');
  }

  // ── Background ──
  if (block.palette) {
    if (block.palette.gradient) {
      cssProps.background = block.palette.gradient;
      notes.push('gradient → static styles');
    } else if (block.palette.bg) {
      const {twClass, cssVar, raw} = mapBgColor(block.palette.bg);
      if (twClass) tw.push(twClass);
      else if (cssVar) cssProps.background = cssVar;
      else if (raw) {
        // Text/label elements use color, not background-color
        if (block.role === 'label') cssProps['color'] = raw;
        else cssProps['background-color'] = raw;
      }
    }

    if (block.palette.imagePlaceholder) {
      tw.push('bg-base-300');
      notes.push('image placeholder');
    }

    // Border
    if (block.palette.border) {
      tw.push('border', 'border-solid');
      const lower = block.palette.border.toLowerCase();
      if (lower === '#e5e7eb' || lower === '#d1d5db')
        tw.push('border-base-300');
      else cssProps['border-color'] = block.palette.border;
    }
    if (block.palette.borderWidth && block.palette.borderWidth > 1) {
      tw.push(`border-${Math.min(Math.round(block.palette.borderWidth), 8)}`);
    }

    // Radius
    if (block.palette.radius) tw.push(mapRadius(block.palette.radius));
    if (block.palette.radii)
      tw.push(mapRadius(Math.max(...block.palette.radii)));

    // Shadow
    if (block.palette.shadow) {
      const shadowClass = mapShadow(block.palette.shadow);
      if (shadowClass) tw.push(shadowClass);
    }

    // Opacity
    if (block.palette.opacity != null) {
      const opClass = mapOpacity(block.palette.opacity);
      if (opClass) tw.push(opClass);
    }
  }

  // ── Typography ──
  if (block.typo) {
    if (block.typo.size) tw.push(mapFontSize(block.typo.size));
    if (block.typo.weight) {
      const wCls = mapFontWeight(block.typo.weight);
      if (wCls) tw.push(wCls);
    }
    if (block.typo.align === 'center') tw.push('text-center');
    if (block.typo.align === 'right') tw.push('text-right');
    if (block.typo.transform === 'upper') tw.push('uppercase');
    if (block.typo.transform === 'lower') tw.push('lowercase');
    if (block.typo.decoration === 'underline') tw.push('underline');
    if (block.typo.decoration === 'strikethrough') tw.push('line-through');

    if (block.typo.color) {
      const {twClass, cssVar, raw} = mapTextColor(block.typo.color);
      if (twClass) tw.push(twClass);
      else if (cssVar) cssProps.color = cssVar;
      else if (raw) cssProps.color = raw;
    }
  }

  // ── Icon detection ──
  let iconMatch = null;
  if (block.role === 'glyph') {
    iconMatch = matchIcon(block.name);
  }

  // ── DaisyUI pattern ──
  const daisyPattern = detectDaisyPattern(block.name);

  // ── Size hint ──
  let sizeHint = null;
  if (block.dims) {
    const {w, h} = block.dims;
    if (w && h && w === h && w <= 48) {
      // Square small element — likely icon container
      sizeHint = `w-${pxToScale(w)} h-${pxToScale(h)}`;
    }
  }

  return {
    ...block,
    tailwind: tw.filter(Boolean).join(' '),
    cssProps: Object.keys(cssProps).length ? cssProps : null,
    iconMatch,
    daisyPattern,
    sizeHint,
    notes
  };
}

export function translateDesign(blocks) {
  return blocks.map(translateBlock);
}

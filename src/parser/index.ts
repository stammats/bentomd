import yaml from 'js-yaml';
import type {
  Deck,
  GlobalConfig,
  Palette,
  Slide,
  SlideOptions,
  ContentModule,
  FontConfig,
} from '../types/index.js';

/** All known layout names — used for bare-word detection in {attrs} and item parsing */
const KNOWN_LAYOUTS = new Set([
  'cover', 'section', 'default', 'bento',
  'features', 'chart', 'stats', 'timeline', 'comparison',
  'grid', 'three-column', 'image-left', 'image-right',
  'table', 'quote', 'image', 'two-column',
]);

/** Layouts that parse ### items into structured data */
const LIST_LAYOUTS = new Set([
  'features', 'chart', 'stats', 'timeline', 'comparison',
  'bento', 'grid', 'three-column', 'image-left', 'image-right',
  'default',
]);


// ============================================================
// Theme + Style system for bento cells
// ============================================================

interface CellTheme {
  background: string;
  color: string;
  border?: string;
}

// ---------------------------------------------------------------------------
// Color Themes — preset palettes
// ---------------------------------------------------------------------------

interface ThemePalette {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  muted: string;
}

const THEME_PRESETS: Record<string, ThemePalette> = {
  default: { primary: '#0984e3', secondary: '#6c5ce7', background: '#ffffff', surface: '#dfe6e9', text: '#2d3436', muted: '#636e72' },
  ocean:   { primary: '#00cec9', secondary: '#0984e3', background: '#ffffff', surface: '#dfe6e9', text: '#2d3436', muted: '#636e72' },
  sunset:  { primary: '#e17055', secondary: '#fdcb6e', background: '#ffffff', surface: '#ffeaa7', text: '#2d3436', muted: '#636e72' },
  forest:  { primary: '#00b894', secondary: '#00cec9', background: '#ffffff', surface: '#dfe6e9', text: '#2d3436', muted: '#636e72' },
  berry:   { primary: '#6c5ce7', secondary: '#e84393', background: '#ffffff', surface: '#dfe6e9', text: '#2d3436', muted: '#636e72' },
  mono:    { primary: '#2d3436', secondary: '#636e72', background: '#ffffff', surface: '#dfe6e9', text: '#2d3436', muted: '#636e72' },
};

// ---------------------------------------------------------------------------
// Cell Styles — how cells are painted
// ---------------------------------------------------------------------------

type CellStyle = 'mixed' | 'tint' | 'solid' | 'outline' | 'white' | 'mono';

function generateCellThemes(palette?: Palette, style?: string): CellTheme[] {
  const primary = palette?.primary ?? '#0984e3';
  const secondary = palette?.secondary ?? '#6c5ce7';
  const surface = palette?.surface ?? '#dfe6e9';
  const text = palette?.text ?? '#2d3436';
  const accents = [primary, secondary, '#00b894', '#e17055', '#00cec9', '#fdcb6e'];
  const cellStyle = (style ?? 'mixed') as CellStyle;

  // Helper: ensure text color has sufficient contrast against background.
  // Uses WCAG relative luminance to guarantee ≥ 3:1 contrast ratio.
  function ensureContrast(bg: string, fg: string): string {
    const lum = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;
      const toLinear = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
    };
    const L1 = lum(bg);
    const L2 = lum(fg);
    const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    if (ratio >= 3) return fg;
    // Darken or lighten fg to meet 3:1
    if (L1 > 0.5) {
      // Light bg → darken text
      for (let s = 0.1; s <= 0.9; s += 0.05) {
        const darker = shadeColor(fg, s);
        const r2 = (lum(bg) + 0.05) / (lum(darker) + 0.05);
        if (r2 >= 3) return darker;
      }
      return '#000000';
    } else {
      // Dark bg → lighten text
      for (let s = 0.1; s <= 0.9; s += 0.05) {
        const lighter = tintColor(fg, s);
        const r2 = (lum(lighter) + 0.05) / (lum(bg) + 0.05);
        if (r2 >= 3) return lighter;
      }
      return '#ffffff';
    }
  }

  switch (cellStyle) {
    case 'tint':
      return accents.map((c) => {
        const bg = tintColor(c, 0.82);
        const fg = shadeColor(c, 0.65);
        return { background: bg, color: ensureContrast(bg, fg) };
      });

    case 'solid':
      return accents.map((c) => {
        // Same hue family for harmony.
        // Only truly bright colors (yellow etc.) get dark text.
        // Everything else gets a light tint of the same hue.
        const fg = needsDarkText(c) ? shadeColor(c, 0.7) : tintColor(c, 0.85);
        return { background: c, color: ensureContrast(c, fg) };
      });

    case 'outline': {
      // All cells use primary for border and text — unified, calm look.
      const slideBg = palette?.background ?? '#ffffff';
      const outlineFg = isDarkHex(slideBg)
        ? tintColor(primary, 0.3)
        : shadeColor(primary, 0.5);
      // Return multiple entries so round-robin still works, but all identical
      return accents.map(() => ({
        background: 'transparent',
        color: outlineFg,
        border: primary,
      }));
    }

    case 'white': {
      // All cells white bg, text is primary or text color — no random accents.
      const whiteFg = ensureContrast('#ffffff', text);
      return accents.map(() => ({
        background: '#ffffff',
        color: whiteFg,
      }));
    }

    case 'mono': {
      // All tint variations of primary — no solid cell that creates unintended emphasis.
      // Gentle gradient from lighter to slightly deeper tints for rhythm.
      const tints = [0.82, 0.88, 0.75, 0.92];
      return tints.map((t) => {
        const bg = tintColor(primary, t);
        const fg = shadeColor(primary, 0.65);
        return { background: bg, color: ensureContrast(bg, fg) };
      });
    }

    case 'mixed':
    default: {
      const pairs = [
        { bright: tintColor(primary, 0.78), dark: shadeColor(primary, 0.7) },
        { bright: tintColor(secondary, 0.78), dark: shadeColor(secondary, 0.7) },
        { bright: '#fce4b8', dark: '#4a2e06' },
        { bright: '#c5dde8', dark: '#12303e' },
        { bright: '#f5c6c6', dark: '#561818' },
        { bright: '#c2e0c6', dark: '#143520' },
      ];
      const themes: CellTheme[] = [];
      for (const pair of pairs) {
        themes.push({ background: pair.bright, color: ensureContrast(pair.bright, pair.dark) });
        themes.push({ background: pair.dark, color: ensureContrast(pair.dark, pair.bright) });
      }
      return themes;
    }
  }
}

/**
 * Resolve theme preset into palette. User's palette overrides preset values.
 */
function resolveTheme(themeName?: string, userPalette?: Palette): Palette {
  const preset = THEME_PRESETS[themeName ?? 'default'] ?? THEME_PRESETS.default;
  const resolved: Palette = {
    primary: userPalette?.primary ?? preset.primary,
    secondary: userPalette?.secondary ?? preset.secondary,
    background: userPalette?.background ?? preset.background,
    surface: userPalette?.surface ?? preset.surface,
    text: userPalette?.text ?? preset.text,
    muted: userPalette?.muted ?? preset.muted,
  };

  // Auto-adjust text colors when background is dark and user didn't set text/muted
  if (resolved.background && isDarkHex(resolved.background)) {
    if (!userPalette?.text) resolved.text = '#f1f5f9';
    if (!userPalette?.muted) resolved.muted = '#94a3b8';
    if (!userPalette?.surface) resolved.surface = '#334155';
  }

  return resolved;
}

/** Check if a hex color is dark — used for slide background auto-detection */
function isDarkHex(hex: string): boolean {
  if (!hex.startsWith('#')) return false;
  return hexLuminance(hex) < 0.4;
}

/** Relative luminance of a hex color */
function hexLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * For solid/mono cell themes: should text be light or dark?
 * Only truly bright colors (yellow, light green) get dark text.
 * Mid-tones (teal, green, coral) get light text for harmony.
 */
function needsDarkText(hex: string): boolean {
  return hexLuminance(hex) > 0.55;
}

/** Mix a color with white by ratio (0=original, 1=white) */
function tintColor(hex: string, ratio: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const tr = Math.round(r + (255 - r) * ratio);
  const tg = Math.round(g + (255 - g) * ratio);
  const tb = Math.round(b + (255 - b) * ratio);
  return `#${tr.toString(16).padStart(2, '0')}${tg.toString(16).padStart(2, '0')}${tb.toString(16).padStart(2, '0')}`;
}

/** Mix a color with black by ratio (0=original, 1=black) */
function shadeColor(hex: string, ratio: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const tr = Math.round(r * (1 - ratio));
  const tg = Math.round(g * (1 - ratio));
  const tb = Math.round(b * (1 - ratio));
  return `#${tr.toString(16).padStart(2, '0')}${tg.toString(16).padStart(2, '0')}${tb.toString(16).padStart(2, '0')}`;
}



// ============================================================
// Markdown Item Parser
// ============================================================

/** Heading pattern: ### :icon: Title text {modifiers} */
const MD_HEADING_RE = /^###\s+(.+)$/;
const ICON_RE = /^:([a-z0-9-]+):\s*/;
const MODIFIERS_RE = /\s*\{([^}]+)\}\s*$/;
const IMAGE_RE = /^!\[([^\]]*)\]\(([^)]+)\)/;

interface ParsedMdHeading {
  icon?: string;
  title: string;
  modifiers: Set<string>;
  modifierString: string;
}

function parseMdHeading(line: string): ParsedMdHeading | null {
  const match = line.match(MD_HEADING_RE);
  if (!match) return null;

  let rest = match[1].trim();
  let icon: string | undefined;
  const modifiers = new Set<string>();
  let modifierString = '';

  // Extract {modifiers} from end
  const modMatch = rest.match(MODIFIERS_RE);
  if (modMatch) {
    modifierString = modMatch[1].trim();
    for (const m of modifierString.split(/\s+/)) modifiers.add(m);
    rest = rest.slice(0, modMatch.index).trim();
  }

  // Extract :icon: from start
  const iconMatch = rest.match(ICON_RE);
  if (iconMatch) {
    icon = iconMatch[1];
    rest = rest.slice(iconMatch[0].length).trim();
  }

  return { icon, title: rest, modifiers, modifierString };
}

/**
 * Split content into blocks at ### headings.
 * Returns array of { headingLine, bodyLines }.
 */
function splitMdItems(content: string): { heading: string; body: string[] }[] {
  const lines = content.split('\n');
  const items: { heading: string; body: string[] }[] = [];
  let current: { heading: string; body: string[] } | null = null;

  for (const line of lines) {
    if (MD_HEADING_RE.test(line)) {
      if (current) items.push(current);
      current = { heading: line, body: [] };
    } else if (current) {
      current.body.push(line);
    }
  }
  if (current) items.push(current);

  return items;
}

/**
 * Parse Markdown items into ContentModule[] based on layout type.
 * Returns null if content doesn't contain ### headings.
 */
function parseMarkdownItems(
  content: string,
  layout: string,
  options: SlideOptions,
  palette?: Palette,
  style?: string,
): { items: ContentModule[]; rawItems: Record<string, unknown>[] } | null {
  if (!content.match(/^###\s/m)) return null;

  const blocks = splitMdItems(content);
  if (blocks.length === 0) return null;

  // Generate cell themes for bento and auto-bento layouts
  const bentoLayouts = new Set(['bento', 'default', 'features', 'stats', 'comparison', 'three-column', 'image-left', 'image-right', 'grid']);
  const cellThemes = bentoLayouts.has(layout) ? generateCellThemes(palette, style) : undefined;

  const rawItems: Record<string, unknown>[] = [];

  for (let idx = 0; idx < blocks.length; idx++) {
    const { heading, body } = blocks[idx];
    const parsed = parseMdHeading(heading);
    if (!parsed) continue;

    const bodyText = body.map((l) => l.trim()).filter(Boolean);
    const item = buildItem(layout, parsed, bodyText, idx);

    // Apply cell theme for bento (unless user set background manually)
    if (cellThemes && !item.background) {
      const theme = cellThemes[idx % cellThemes.length];
      item.background = theme.background;
      item.color = theme.color;
      if (theme.border) item.border = theme.border;
    }

    rawItems.push(item);
  }

  const items = rawItems.map(inferItemType);
  return { items, rawItems };
}

/**
 * Build a raw item object from parsed Markdown heading + body, based on layout type.
 */
function buildItem(
  layout: string,
  h: ParsedMdHeading,
  bodyLines: string[],
  index: number,
): Record<string, unknown> {
  switch (layout) {
    case 'timeline':
      return buildTimelineItem(h, bodyLines);
    case 'chart':
      return buildChartItem(h, bodyLines);
    default:
      return buildBentoItem(h, bodyLines, index);
  }
}

function buildStatItem(h: ParsedMdHeading, bodyLines: string[]): Record<string, unknown> {
  const item: Record<string, unknown> = { value: h.title };
  if (h.icon) item.icon = h.icon;

  // First non-trend line = label
  const label = bodyLines.find((l) => !l.startsWith('+') && !l.startsWith('-') && !l.startsWith('↑') && !l.startsWith('↓'));
  if (label) item.label = label;

  // Line starting with +/- or ↑/↓ = trend
  const trend = bodyLines.find((l) => /^[+\-↑↓]/.test(l));
  if (trend) item.trend = trend;

  return item;
}

function buildFeatureItem(h: ParsedMdHeading, bodyLines: string[]): Record<string, unknown> {
  const item: Record<string, unknown> = { title: h.title };
  if (h.icon) item.icon = h.icon;

  const desc = bodyLines.filter((l) => !l.startsWith('-') && !l.startsWith('*')).join(' ').trim();
  if (desc) item.description = desc;

  // Check for link in modifiers
  const linkMod = [...h.modifiers].find((m) => m.startsWith('http') || m.startsWith('/'));
  if (linkMod) item.link = linkMod;

  return item;
}

function buildTimelineItem(h: ParsedMdHeading, bodyLines: string[]): Record<string, unknown> {
  const item: Record<string, unknown> = {};

  // Title format: "Date — Title" or "Date -- Title"
  const dashSplit = h.title.split(/\s*[—–]\s*|\s+--\s+/);
  if (dashSplit.length >= 2) {
    item.date = dashSplit[0].trim();
    item.title = dashSplit.slice(1).join(' — ').trim();
  } else {
    item.title = h.title;
  }

  if (h.modifiers.has('active')) item.active = true;

  const desc = bodyLines.join(' ').trim();
  if (desc) item.description = desc;

  return item;
}

function buildComparisonItem(h: ParsedMdHeading, bodyLines: string[]): Record<string, unknown> {
  const item: Record<string, unknown> = {};

  // Title format: "Label — $Price" or "Label — Price"
  const dashSplit = h.title.split(/\s*[—–]\s*|\s+--\s+/);
  if (dashSplit.length >= 2) {
    item.label = dashSplit[0].trim();
    item.price = dashSplit.slice(1).join(' — ').trim();
  } else {
    item.label = h.title;
  }

  if (h.modifiers.has('highlight')) item.highlight = true;

  // Bullet list = features
  const features = bodyLines
    .filter((l) => /^[-*]\s/.test(l))
    .map((l) => l.replace(/^[-*]\s+/, '').trim());
  if (features.length > 0) item.features = features;

  return item;
}

function buildChartItem(h: ParsedMdHeading, _bodyLines: string[]): Record<string, unknown> {
  // Title format: "Label: Value" or "Label — Value"
  const split = h.title.split(/:\s*|\s*[—–]\s*/);
  if (split.length >= 2) {
    const numVal = parseFloat(split[split.length - 1]);
    if (!isNaN(numVal)) {
      return { label: split.slice(0, -1).join(': ').trim(), value: numVal };
    }
  }
  // Fallback: title as label, try to parse as number
  const num = parseFloat(h.title);
  if (!isNaN(num)) return { label: '', value: num };
  return { label: h.title, value: 0 };
}

/** Extract a mermaid code block from body lines.
 * Returns the mermaid source if found, and the remaining lines without the block. */
function extractMermaidBlock(bodyLines: string[]): { mermaid: string | null; remaining: string[] } {
  const fullBody = bodyLines.join('\n');
  const mermaidRe = /^```mermaid\s*\n([\s\S]*?)^```/m;
  const match = fullBody.match(mermaidRe);
  if (!match) return { mermaid: null, remaining: bodyLines };

  const mermaidCode = match[1].trim();
  const withoutBlock = fullBody.replace(match[0], '').trim();
  const remaining = withoutBlock ? withoutBlock.split('\n') : [];
  return { mermaid: mermaidCode, remaining };
}

function buildBentoItem(
  h: ParsedMdHeading,
  bodyLines: string[],
  index: number,
): Record<string, unknown> {
  const item: Record<string, unknown> = {};

  if (h.icon) item.icon = h.icon;

  // Extract mermaid code block before other body processing
  const { mermaid, remaining: filteredBodyLines } = extractMermaidBlock(bodyLines);
  if (mermaid) item.mermaid = mermaid;

  const bodyLinesForText = mermaid ? filteredBodyLines : bodyLines;

  // Title is always stored as title.
  // **bold** parts in title will be rendered large (value-style) by bento-cell.
  item.title = h.title;

  // Check for image in body
  const imageLine = bodyLinesForText.find((l) => IMAGE_RE.test(l));
  if (imageLine) {
    const imgMatch = imageLine.match(IMAGE_RE);
    if (imgMatch) item.image = imgMatch[2];
  }

  // Non-image body text = description or label
  // Preserve newlines for markdown rendering (lists, tables, quotes)
  const textLines = bodyLinesForText.filter((l) => !IMAGE_RE.test(l));
  const text = textLines.join('\n').trim();

  // Body text is description (preserves markdown for lists, tables, etc.)
  if (text) item.description = text;

  // Modifiers → size, align
  const sizeKeywords = new Set(['sm', 'md', 'lg', 'wide', 'tall', 'hero', 'full']);
  for (const mod of h.modifiers) {
    if (sizeKeywords.has(mod)) {
      item.size = mod;
    } else if (mod === 'center') {
      item.align = 'center';
    }
  }

  return item;
}

// ============================================================
// YAML Item Parser (legacy, still supported)
// ============================================================

/**
 * Infer the ContentModule type from an item's fields.
 * If the item already has an explicit `type`, it is returned as-is.
 */
function inferItemType(item: Record<string, unknown>): ContentModule {
  if (item.type) {
    return item as unknown as ContentModule;
  }

  // StatItem: has `value` (string) + `label`
  if ('value' in item && 'label' in item && typeof item.value === 'string') {
    return { type: 'stat', ...item } as unknown as ContentModule;
  }

  // FeatureItem: has `icon` + `title` (no `value`)
  if ('icon' in item && 'title' in item && !('value' in item)) {
    return { type: 'feature', ...item } as unknown as ContentModule;
  }

  // ChartDataItem: has `label` + `value` (number)
  if ('label' in item && 'value' in item && typeof item.value === 'number') {
    return { type: 'chart-data', ...item } as unknown as ContentModule;
  }

  // ComparisonItem: has `label` + `features` (array)
  if ('label' in item && 'features' in item && Array.isArray(item.features)) {
    return { type: 'comparison', ...item } as unknown as ContentModule;
  }

  // TimelineItem: has `date` + `title`
  if ('date' in item && 'title' in item) {
    return { type: 'timeline', ...item } as unknown as ContentModule;
  }

  // BentoCell: has `size` or `image`
  if ('size' in item || 'image' in item) {
    return item as unknown as ContentModule;
  }

  // TextModule: has `content` as string
  if ('content' in item && typeof item.content === 'string' && Object.keys(item).length <= 2) {
    return { type: 'text', content: item.content as string } as ContentModule;
  }

  // TableModule: has `headers` + `rows`
  if ('headers' in item && 'rows' in item) {
    return { type: 'table', ...item } as unknown as ContentModule;
  }

  // GenericItem fallback
  return item as unknown as ContentModule;
}

function parseGlobalConfig(raw: Record<string, unknown>): GlobalConfig {
  const config: GlobalConfig = {};

  if (raw.theme != null) config.theme = String(raw.theme);
  if (raw.title != null) config.title = String(raw.title);
  if (raw.author != null) config.author = String(raw.author);
  if (raw.date != null) config.date = String(raw.date);
  if (raw.aspectRatio != null) config.aspectRatio = raw.aspectRatio as GlobalConfig['aspectRatio'];
  if (raw.lang != null) config.lang = String(raw.lang);
  if (raw.dir != null) config.dir = raw.dir as GlobalConfig['dir'];

  // Fonts — support `sans` as backward-compat alias for `body`
  if (raw.fonts != null && typeof raw.fonts === 'object') {
    const rawFonts = raw.fonts as Record<string, unknown>;
    const fonts: FontConfig = {};
    if (rawFonts.heading != null) fonts.heading = String(rawFonts.heading);
    if (rawFonts.body != null) fonts.body = String(rawFonts.body);
    if (rawFonts.mono != null) fonts.mono = String(rawFonts.mono);
    if (rawFonts.sans != null) {
      fonts.sans = String(rawFonts.sans);
      if (!fonts.body) fonts.body = fonts.sans;
    }
    config.fonts = fonts;
  }

  if (raw.palette != null) config.palette = raw.palette as GlobalConfig['palette'];
  if (raw.icons != null) config.icons = raw.icons as GlobalConfig['icons'];
  if (raw.logo != null) config.logo = raw.logo as GlobalConfig['logo'];
  if (raw.footer != null) config.footer = raw.footer as GlobalConfig['footer'];
  if (raw.defaults != null) config.defaults = raw.defaults as GlobalConfig['defaults'];
  if (raw.borderRadius != null) config.borderRadius = Number(raw.borderRadius);
  if (raw.fontSize != null) config.fontSize = Number(raw.fontSize);
  if (raw.style != null) config.style = String(raw.style);

  // Resolve theme preset → palette (user palette overrides preset)
  config.palette = resolveTheme(config.theme, config.palette);

  return config;
}



// ============================================================
// Inline attribute parser for ## headings
// ============================================================

const ATTR_ALIASES: Record<string, string> = { bg: 'background' };

interface ParsedSlideHeading {
  title: string | undefined;
  layout: string;
  options: SlideOptions;
}

/** Parse `## Title {cover, bg="photo.jpg", style=mono}` */
function parseSlideHeading(line: string): ParsedSlideHeading {
  const h2Match = line.match(/^##\s+(.*?)\s*$/);
  if (!h2Match) return { title: undefined, layout: 'default', options: {} };

  let raw = h2Match[1].trim();
  const options: SlideOptions = {};
  let layout = 'default';

  const attrMatch = raw.match(/\{([^}]*)\}\s*$/);
  if (attrMatch) {
    raw = raw.slice(0, attrMatch.index).trim();
    for (const token of attrMatch[1].split(',').map(t => t.trim()).filter(Boolean)) {
      const eqIdx = token.indexOf('=');
      if (eqIdx >= 0) {
        const key = token.slice(0, eqIdx).trim();
        let val = token.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        (options as Record<string, unknown>)[ATTR_ALIASES[key] ?? key] = val;
      } else if (KNOWN_LAYOUTS.has(token)) {
        layout = token;
      }
    }
  }

  const title = raw || undefined;

  // Auto-detect text color from background
  const bg = options.background as string | undefined;
  if (bg && !options.color) {
    if (bg.startsWith('http') || bg.startsWith('/') || bg.startsWith('.')) {
      options.color = '#ffffff';
      if (options.overlay === undefined) options.overlay = 0.4;
    } else if (bg.startsWith('#')) {
      options.color = isDarkHex(bg) ? '#ffffff' : '#2d3436';
    }
  }

  return { title, layout, options };
}

// ============================================================
// Global config extraction
// ============================================================

function extractGlobalConfig(source: string): { config: GlobalConfig; body: string } {
  const fmMatch = source.match(/^\s*---\s*\n([\s\S]*?)\n---\s*(?:\n|$)/);
  if (!fmMatch) return { config: parseGlobalConfig({}), body: source };
  const raw = (yaml.load(fmMatch[1].trim()) as Record<string, unknown>) || {};
  return { config: parseGlobalConfig(raw), body: source.slice(fmMatch[0].length) };
}

// ============================================================
// Slide parser — splits on ## headings
// ============================================================

function parseSlides(body: string, config: GlobalConfig): Slide[] {
  const lines = body.split('\n');
  const slides: Slide[] = [];

  interface Chunk { headingLine: string | null; bodyLines: string[] }
  const chunks: Chunk[] = [];
  let current: Chunk = { headingLine: null, bodyLines: [] };
  let inCode = false;

  for (const line of lines) {
    if (line.match(/^```/)) inCode = !inCode;
    if (!inCode && line.match(/^##\s/)) {
      if (current.headingLine !== null || current.bodyLines.some(l => l.trim())) {
        chunks.push(current);
      }
      current = { headingLine: line, bodyLines: [] };
    } else {
      current.bodyLines.push(line);
    }
  }
  if (current.headingLine !== null || current.bodyLines.some(l => l.trim())) {
    chunks.push(current);
  }

  for (const chunk of chunks) {
    const content = chunk.bodyLines.join('\n').trim();

    if (!chunk.headingLine) {
      if (!content) continue;
      slides.push({ layout: 'default', options: {}, content });
      continue;
    }

    const { title, layout, options } = parseSlideHeading(chunk.headingLine);
    if (title) options.heading = title;

    // Extract summary: text between ## heading and first ### item
    if (content && title) {
      const firstH3 = content.indexOf('###');
      if (firstH3 > 0) {
        const summaryText = content.substring(0, firstH3).trim();
        if (summaryText && !options.summary) options.summary = summaryText;
      }
    }

    const slide: Slide = { layout, options, content };

    if (content.match(/^###\s/m)) {
      const slideStyle = (options.style as string) ?? config.style;
      const mdResult = parseMarkdownItems(content, layout, options, config.palette, slideStyle);
      if (mdResult) {
        slide.items = mdResult.items;
        slide.rawItems = mdResult.rawItems;
      }
    }

    slides.push(slide);
  }

  return slides;
}

// ============================================================
// Main entry point
// ============================================================

export function parse(source: string): Deck {
  const { config, body } = extractGlobalConfig(source);
  return { config, slides: parseSlides(body, config) };
}

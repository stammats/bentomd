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

const LIST_LAYOUTS = new Set([
  'features',
  'chart',
  'stats',
  'timeline',
  'comparison',
  'bento',
  'grid',
]);

/** Keys that belong in SlideOptions rather than being left in frontmatter */
const SLIDE_OPTION_KEYS = new Set([
  'header', 'heading', 'summary', 'footer', 'pageNumber',
  'ratio', 'columns', 'valign', 'gap', 'background', 'overlay', 'align', 'style', 'color',
  'src', 'fit', 'position', 'caption',
  'type', 'title', 'showValues', 'showLegend', 'colors',
  'language', 'highlight',
  'direction',
]);

// ============================================================
// Cell theme generation for bento grid
// ============================================================

// ---------------------------------------------------------------------------
// Cell theme: bright/dark paired color system (Wise-inspired)
// ---------------------------------------------------------------------------
//
// Hand-tuned color pairs ordered warm/cool alternating.
// Each pair has a bright variant and a dark variant.
// Bright bg → dark text, dark bg → bright text.
// Internal contrast is guaranteed so mixing is safe.

interface CellTheme {
  background: string;
  color: string;
}

/** Default bright/dark pairs — warm/cool alternating, muted tones.
 *  Bright = soft pastel for bg, Dark = rich deep for bg.
 *  Warm and cool colors interleave so any subset looks balanced. */
const DEFAULT_PAIRS: { bright: string; dark: string }[] = [
  { bright: '#fce4b8', dark: '#5c3d0e' },  // Honey / warm
  { bright: '#c5dde8', dark: '#1a3a4a' },  // Slate Blue / cool
  { bright: '#f5c6c6', dark: '#6b2020' },  // Blush / warm
  { bright: '#c2e0c6', dark: '#1a4028' },  // Sage / cool
  { bright: '#e8d0f0', dark: '#3b1f50' },  // Mauve / warm
  { bright: '#b8ddd6', dark: '#1a3833' },  // Mint / cool
];

/**
 * Generate cell themes from palette.
 * If custom primary/secondary are set, derive pairs from them and mix with defaults.
 */
function generateCellThemes(palette?: {
  primary?: string; secondary?: string;
}): CellTheme[] {
  const primary = palette?.primary;
  const secondary = palette?.secondary;

  let pairs = [...DEFAULT_PAIRS];

  // If user set custom palette colors, prepend derived pairs
  if (primary && primary !== '#0984e3') {
    pairs.unshift({ bright: tintColor(primary, 0.65), dark: shadeColor(primary, 0.6) });
  }
  if (secondary && secondary !== '#6c5ce7') {
    pairs.splice(1, 0, { bright: tintColor(secondary, 0.65), dark: shadeColor(secondary, 0.6) });
  }

  // Generate themes: for each pair, bright-bg then dark-bg
  const themes: CellTheme[] = [];
  for (const pair of pairs) {
    themes.push({ background: pair.bright, color: pair.dark });
    themes.push({ background: pair.dark, color: pair.bright });
  }

  return themes;
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
): { items: ContentModule[]; rawItems: Record<string, unknown>[] } | null {
  if (!content.match(/^###\s/m)) return null;

  const blocks = splitMdItems(content);
  if (blocks.length === 0) return null;

  // Bento: generate harmonious cell themes from palette
  const cellThemes = layout === 'bento' ? generateCellThemes(palette) : undefined;

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
    case 'stats':
      return buildStatItem(h, bodyLines);
    case 'features':
      return buildFeatureItem(h, bodyLines);
    case 'timeline':
      return buildTimelineItem(h, bodyLines);
    case 'comparison':
      return buildComparisonItem(h, bodyLines);
    case 'chart':
      return buildChartItem(h, bodyLines);
    case 'bento':
      return buildBentoItem(h, bodyLines, index);
    default:
      return buildFeatureItem(h, bodyLines);
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

function buildBentoItem(
  h: ParsedMdHeading,
  bodyLines: string[],
  index: number,
): Record<string, unknown> {
  const item: Record<string, unknown> = {};

  if (h.icon) item.icon = h.icon;

  // Check if title looks like a value (starts with $, digit, or is a percentage)
  if (/^[\$€£¥]?\d/.test(h.title) || /^\d+[%kKmMbB+]/.test(h.title)) {
    // Split "12 Awards" → value: "12", label: "Awards"
    const valMatch = h.title.match(/^([\$€£¥]?[\d,.]+[%kKmMbB+]*)\s+(.+)$/);
    if (valMatch) {
      item.value = valMatch[1];
      item.label = valMatch[2];
    } else {
      item.value = h.title;
    }
  } else {
    item.title = h.title;
  }

  // Check for image in body
  const imageLine = bodyLines.find((l) => IMAGE_RE.test(l));
  if (imageLine) {
    const imgMatch = imageLine.match(IMAGE_RE);
    if (imgMatch) item.image = imgMatch[2];
  }

  // Non-image body text = description or label
  const textLines = bodyLines.filter((l) => !IMAGE_RE.test(l));
  const text = textLines.join(' ').trim();

  if (item.value) {
    // For value cells, body text is the label (unless label was already set from heading split)
    if (text && !item.label) item.label = text;
    else if (text && item.label) item.description = text;
  } else {
    // For title cells, body text is description
    if (text) item.description = text;
  }

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

  return config;
}

function extractSlideOptions(parsed: Record<string, unknown>): SlideOptions {
  const options: SlideOptions = {};
  for (const key of Object.keys(parsed)) {
    if (key === 'layout') continue;
    if (SLIDE_OPTION_KEYS.has(key)) {
      (options as Record<string, unknown>)[key] = parsed[key];
    }
  }
  return options;
}

export function parse(source: string): Deck {
  // Split by lines that are exactly `---`
  const blocks = source.split(/^---$/m);

  let config: GlobalConfig = {};
  const slides: Slide[] = [];

  // Find the global config block: first non-empty block without `layout`
  let i = 0;

  // Skip leading empty block (before first ---)
  if (blocks.length > 0 && blocks[0].trim() === '') {
    i = 1;
  }

  // Parse global config from first meaningful block
  if (i < blocks.length) {
    const trimmed = blocks[i].trim();
    if (trimmed && !trimmed.match(/^layout\s*:/m)) {
      const raw = (yaml.load(trimmed) as Record<string, unknown>) || {};
      config = parseGlobalConfig(raw);
      i++;
    }
  }

  // Process remaining blocks in pairs: (frontmatter, content)
  while (i < blocks.length) {
    const frontmatterBlock = blocks[i]?.trim() ?? '';
    const contentBlock = blocks[i + 1]?.trim() ?? '';

    // If this block looks like frontmatter (has layout:), pair it with next block as content
    if (frontmatterBlock.match(/^layout\s*:/m)) {
      const parsed = yaml.load(frontmatterBlock) as Record<string, unknown> | null;
      const layout = String(parsed?.layout ?? 'default');
      const options = extractSlideOptions(parsed ?? {});

      let content = contentBlock;
      let items: ContentModule[] | undefined;
      let rawItems: Record<string, unknown>[] | undefined;

      if (LIST_LAYOUTS.has(layout)) {
        const mdResult = parseMarkdownItems(content, layout, options, config.palette);
        if (mdResult) {
          items = mdResult.items;
          rawItems = mdResult.rawItems;
        }
      }

      const slide: Slide = { layout, options, content };
      if (items) {
        slide.items = items;
        slide.rawItems = rawItems;
      }
      slides.push(slide);
      i += 2;
    } else if (frontmatterBlock === '') {
      // Empty block, skip
      i++;
    } else {
      // Block without layout - treat as content-only slide with default layout
      const slide: Slide = {
        layout: 'default',
        options: {},
        content: frontmatterBlock,
      };
      slides.push(slide);
      i++;
    }
  }

  return { config, slides };
}

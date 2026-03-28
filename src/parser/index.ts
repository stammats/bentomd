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
  'three-column',
  'image-left',
  'image-right',
  'default',  // auto-bento: default with ### items
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

  switch (cellStyle) {
    case 'tint':
      return accents.map((c) => ({
        background: tintColor(c, 0.8),
        color: shadeColor(c, 0.4),
      }));

    case 'solid':
      return accents.map((c) => ({
        background: c,
        color: '#ffffff',
      }));

    case 'outline':
      return accents.map((c) => ({
        background: 'transparent',
        color: c,
        border: c,
      }));

    case 'white':
      return accents.map((c) => ({
        background: '#ffffff',
        color: c,
      }));

    case 'mono': {
      return [
        { background: tintColor(primary, 0.8), color: shadeColor(primary, 0.4) },
        { background: primary, color: '#ffffff' },
        { background: tintColor(primary, 0.9), color: shadeColor(primary, 0.3) },
        { background: shadeColor(primary, 0.3), color: tintColor(primary, 0.9) },
      ];
    }

    case 'mixed':
    default: {
      // Bright/dark pairs from primary + secondary + default accents
      const pairs = [
        { bright: tintColor(primary, 0.75), dark: shadeColor(primary, 0.55) },
        { bright: tintColor(secondary, 0.75), dark: shadeColor(secondary, 0.55) },
        { bright: '#fce4b8', dark: '#5c3d0e' },
        { bright: '#c5dde8', dark: '#1a3a4a' },
        { bright: '#f5c6c6', dark: '#6b2020' },
        { bright: '#c2e0c6', dark: '#1a4028' },
      ];
      const themes: CellTheme[] = [];
      for (const pair of pairs) {
        themes.push({ background: pair.bright, color: pair.dark });
        themes.push({ background: pair.dark, color: pair.bright });
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
  return {
    primary: userPalette?.primary ?? preset.primary,
    secondary: userPalette?.secondary ?? preset.secondary,
    background: userPalette?.background ?? preset.background,
    surface: userPalette?.surface ?? preset.surface,
    text: userPalette?.text ?? preset.text,
    muted: userPalette?.muted ?? preset.muted,
  };
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

    // If this block looks like frontmatter (has YAML-style key: value pairs)
    const looksLikeFrontmatter = frontmatterBlock.match(/^(layout|style|heading|summary|background|color|pageNumber|footer)\s*:/m);
    if (looksLikeFrontmatter) {
      const parsed = yaml.load(frontmatterBlock) as Record<string, unknown> | null;
      const layout = String(parsed?.layout ?? 'default');
      const options = extractSlideOptions(parsed ?? {});

      let content = contentBlock;
      let items: ContentModule[] | undefined;
      let rawItems: Record<string, unknown>[] | undefined;

      if (LIST_LAYOUTS.has(layout)) {
        const slideStyle = (options.style as string) ?? config.style;
        const mdResult = parseMarkdownItems(content, layout, options, config.palette, slideStyle);
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
      const content = frontmatterBlock;
      const options: SlideOptions = {};

      // Extract ## heading and body text before first ###
      const h2Match = content.match(/^##\s+(.+)$/m);
      if (h2Match) {
        options.heading = h2Match[1].trim();
        // Text between ## and first ### is the summary/body
        const h2End = (content.indexOf(h2Match[0]) + h2Match[0].length);
        const firstH3 = content.indexOf('\n###');
        if (firstH3 > h2End) {
          const bodyText = content.substring(h2End, firstH3).trim();
          if (bodyText) options.summary = bodyText;
        }
      }

      const slide: Slide = {
        layout: 'default',
        options,
        content,
      };

      // If it contains ### items, parse them for auto-bento
      if (content.match(/^###\s/m)) {
        const mdResult = parseMarkdownItems(content, 'default', options, config.palette, config.style);
        if (mdResult) {
          slide.items = mdResult.items;
          slide.rawItems = mdResult.rawItems;
        }
      }
      slides.push(slide);
      i++;
    }
  }

  return { config, slides };
}

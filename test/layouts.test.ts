import { describe, it, expect } from 'vitest';
import { renderSlide, layouts } from '../src/layouts/index.js';
import { coverRenderer } from '../src/layouts/cover.js';
import { defaultRenderer } from '../src/layouts/default.js';
import { featuresRenderer } from '../src/layouts/features.js';
import { twoColumnRenderer } from '../src/layouts/two-column.js';
import { renderIcon, buildPageStructure, escapeHtml } from '../src/layouts/base.js';
import type { Slide, GlobalConfig, RenderContext } from '../src/types/index.js';

const emptyConfig: GlobalConfig = {};

const defaultContext: RenderContext = {
  slideIndex: 0,
  totalSlides: 5,
  budget: {
    canvasWidth: 1920,
    canvasHeight: 1080,
    contentWidth: 1760,
    contentHeight: 840,
    bodyHeight: 608,
    chromeHeight: 232,
  },
};

describe('escapeHtml', () => {
  it('escapes HTML special characters', () => {
    expect(escapeHtml('<script>"alert&\'</script>')).toBe(
      '&lt;script&gt;&quot;alert&amp;&#39;&lt;/script&gt;'
    );
  });
});

describe('buildPageStructure', () => {
  it('renders 5-layer structure with all fields', () => {
    const slide: Slide = {
      layout: 'default',
      options: { header: 'Section 1', heading: 'My Title', summary: 'A summary', footer: true, pageNumber: true },
      content: '',
    };
    const config: GlobalConfig = { logo: { path: '/logo.png', height: 40 } };
    const html = buildPageStructure(slide, config, defaultContext, '<p>Body</p>');
    expect(html).toContain('data-layout="default"');
    expect(html).toContain('class="slide-header"');
    expect(html).toContain('<span>Section 1</span>');
    expect(html).toContain('class="slide-logo"');
    expect(html).toContain('src="/logo.png"');
    expect(html).toContain('height:40px');
    expect(html).toContain('<h1>My Title</h1>');
    expect(html).toContain('class="slide-summary"');
    expect(html).toContain('A summary');
    expect(html).toContain('class="slide-body"');
    expect(html).toContain('<p>Body</p>');
    expect(html).toContain('class="slide-footer"');
    expect(html).toContain('1 / 5');
  });

  it('renders footer template variables', () => {
    const slide: Slide = {
      layout: 'default',
      options: { footer: true },
      content: '',
    };
    const config: GlobalConfig = {
      title: 'Deck Title',
      author: 'Jane',
      date: '2026-01-01',
      footer: { left: '{author} - {date}', center: '{title}', right: '{slideNumber}/{totalSlides}' },
    };
    const ctx: RenderContext = { ...defaultContext, slideIndex: 2, totalSlides: 10 };
    const html = buildPageStructure(slide, config, ctx, '');
    expect(html).toContain('Jane - 2026-01-01');
    expect(html).toContain('Deck Title');
    expect(html).toContain('3/10');
  });

  it('omits footer when show is false and no page number', () => {
    const slide: Slide = {
      layout: 'default',
      options: {},
      content: '',
    };
    const html = buildPageStructure(slide, emptyConfig, defaultContext, '');
    expect(html).toContain('class="slide-footer"');
    // Footer content should be empty
    expect(html).toContain('<div class="slide-footer"></div>');
  });
});

describe('cover renderer', () => {
  it('produces correct HTML structure', () => {
    const slide: Slide = {
      layout: 'cover',
      options: { background: '#000', align: 'center' },
      content: '# Hello World',
    };
    const html = coverRenderer(slide, emptyConfig, defaultContext);
    expect(html).toContain('data-layout="cover"');
    expect(html).toContain('cover-body');
    expect(html).toContain('cover-align-center');
    expect(html).toContain('<h1>Hello World</h1>');
  });

  it('adds overlay for image backgrounds', () => {
    const slide: Slide = {
      layout: 'cover',
      options: { background: 'https://example.com/bg.jpg', overlay: 0.5 },
      content: '# Title',
    };
    const html = coverRenderer(slide, emptyConfig, defaultContext);
    expect(html).toContain('cover-overlay');
    expect(html).toContain('rgba(0,0,0,0.5)');
    expect(html).toContain("background-image: url('https://example.com/bg.jpg')");
  });

  it('defaults align to center', () => {
    const slide: Slide = {
      layout: 'cover',
      options: {},
      content: '# Title',
    };
    const html = coverRenderer(slide, emptyConfig, defaultContext);
    expect(html).toContain('cover-align-center');
  });

  it('applies color option for text color', () => {
    const slide: Slide = {
      layout: 'cover',
      options: { background: '#1e293b', color: '#ffffff' },
      content: '# Dark Slide',
    };
    const html = coverRenderer(slide, emptyConfig, defaultContext);
    expect(html).toContain('color: #ffffff');
    expect(html).toContain('background: #1e293b');
  });

  it('does not use 5-layer page structure', () => {
    const slide: Slide = {
      layout: 'cover',
      options: {},
      content: '# Title',
    };
    const html = coverRenderer(slide, emptyConfig, defaultContext);
    expect(html).not.toContain('slide-header');
    expect(html).not.toContain('slide-heading');
    expect(html).not.toContain('slide-footer');
  });
});

describe('default renderer', () => {
  it('renders markdown content with 5-layer structure', () => {
    const slide: Slide = {
      layout: 'default',
      options: { heading: 'My Heading' },
      content: '## Sub Heading\n\nSome **bold** text.',
    };
    const html = defaultRenderer(slide, emptyConfig, defaultContext);
    expect(html).toContain('data-layout="default"');
    expect(html).toContain('slide-heading');
    expect(html).toContain('<h1>My Heading</h1>');
    expect(html).toContain('slide-body');
    expect(html).toContain('<strong>bold</strong>');
  });

  it('auto-extracts h1 from content when no heading option', () => {
    const slide: Slide = {
      layout: 'default',
      options: {},
      content: '# Auto Heading\n\nBody text here.',
    };
    const html = defaultRenderer(slide, emptyConfig, defaultContext);
    expect(html).toContain('<h1>Auto Heading</h1>');
    // The h1 should be in slide-heading, not duplicated in body
    expect(html).toContain('class="slide-heading"');
    // Body should have the remaining content
    expect(html).toContain('Body text here.');
  });

  it('renders content without heading when none provided or found', () => {
    const slide: Slide = {
      layout: 'default',
      options: {},
      content: 'Just some paragraph text.',
    };
    const html = defaultRenderer(slide, emptyConfig, defaultContext);
    expect(html).toContain('data-layout="default"');
    expect(html).toContain('Just some paragraph text.');
  });
});

describe('features renderer', () => {
  it('creates correct number of cards', () => {
    const slide: Slide = {
      layout: 'features',
      options: { columns: 2, style: 'card' },
      content: '',
      items: [
        { icon: 'arrow-right', title: 'Feature 1', description: 'Desc 1' },
        { icon: 'check', title: 'Feature 2', description: 'Desc 2' },
        { icon: 'star', title: 'Feature 3', description: 'Desc 3' },
      ],
    };
    const html = featuresRenderer(slide, emptyConfig, defaultContext);
    expect(html).toContain('features-grid');
    expect(html).toContain('grid-template-columns: repeat(2, 1fr)');
    const cardCount = (html.match(/feature-card/g) || []).length;
    expect(cardCount).toBe(3);
  });

  it('renders icons within cards', () => {
    const slide: Slide = {
      layout: 'features',
      options: {},
      content: '',
      items: [{ icon: 'arrow-right', title: 'Go', description: 'Forward' }],
    };
    const html = featuresRenderer(slide, emptyConfig, defaultContext);
    expect(html).toContain('feature-icon');
    expect(html).toContain('<svg');
  });

  it('wraps card in link when link is provided', () => {
    const slide: Slide = {
      layout: 'features',
      options: {},
      content: '',
      items: [{ title: 'Link', link: 'https://example.com' }],
    };
    const html = featuresRenderer(slide, emptyConfig, defaultContext);
    expect(html).toContain('<a class="feature-card');
    expect(html).toContain('href="https://example.com"');
  });
});

describe('two-column renderer', () => {
  it('splits content by markers with 5-layer structure', () => {
    const slide: Slide = {
      layout: 'two-column',
      options: { ratio: '1:1', heading: 'Comparison' },
      content: '::left::\n# Left Side\n::right::\n# Right Side',
    };
    const html = twoColumnRenderer(slide, emptyConfig, defaultContext);
    expect(html).toContain('slide-heading');
    expect(html).toContain('<h1>Comparison</h1>');
    expect(html).toContain('column-left');
    expect(html).toContain('column-right');
    expect(html).toContain('<h1>Left Side</h1>');
    expect(html).toContain('<h1>Right Side</h1>');
  });

  it('uses .columns class with data-cols and data-ratio', () => {
    const slide: Slide = {
      layout: 'two-column',
      options: { ratio: '2:1' },
      content: '::left::\nA\n::right::\nB',
    };
    const html = twoColumnRenderer(slide, emptyConfig, defaultContext);
    expect(html).toContain('class="columns"');
    expect(html).toContain('data-cols="2"');
    expect(html).toContain('data-ratio="2:1"');
    expect(html).toContain('grid-template-columns:2fr 1fr');
  });

  it('applies gap and valign options', () => {
    const slide: Slide = {
      layout: 'two-column',
      options: { gap: 'lg', valign: 'center' },
      content: '::left::\nA\n::right::\nB',
    };
    const html = twoColumnRenderer(slide, emptyConfig, defaultContext);
    expect(html).toContain('gap:64px');
    expect(html).toContain('align-items:center');
  });

  it('falls back to even split without markers', () => {
    const slide: Slide = {
      layout: 'two-column',
      options: {},
      content: 'Line 1\nLine 2\nLine 3\nLine 4',
    };
    const html = twoColumnRenderer(slide, emptyConfig, defaultContext);
    expect(html).toContain('column-left');
    expect(html).toContain('column-right');
  });
});

describe('renderSlide', () => {
  it('falls back to default for unknown layout', () => {
    const slide: Slide = {
      layout: 'nonexistent',
      options: {},
      content: 'Fallback content',
    };
    const html = renderSlide(slide, emptyConfig);
    // Falls back to default layout via grid engine
    expect(html).toContain('data-layout="default"');
    expect(html).toContain('Fallback content');
  });

  it('accepts optional context parameter', () => {
    const slide: Slide = {
      layout: 'default',
      options: { pageNumber: true },
      content: 'Test',
    };
    const html = renderSlide(slide, emptyConfig, { ...defaultContext, slideIndex: 3, totalSlides: 8 });
    expect(html).toContain('4 / 8');
  });

  it('provides default context when none given', () => {
    const slide: Slide = {
      layout: 'cover',
      options: {},
      content: '# Hello',
    };
    const html = renderSlide(slide, emptyConfig);
    expect(html).toContain('data-layout="cover"');
  });
});

describe('renderIcon', () => {
  it('renders a known icon', () => {
    const svg = renderIcon('arrow-right');
    expect(svg).toContain('<svg');
    expect(svg).toContain('lucide');
  });

  it('returns empty string for unknown icon', () => {
    const svg = renderIcon('nonexistent-icon-xyz');
    expect(svg).toBe('');
  });
});

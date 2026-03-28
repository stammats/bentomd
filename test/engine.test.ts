import { describe, it, expect } from 'vitest';
import { renderSlideV2, layoutRegistry } from '../src/engine/index.js';
import { resolveSlide } from '../src/engine/slot-resolver.js';
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

describe('layoutRegistry', () => {
  it('contains all expected layouts', () => {
    const expected = [
      'cover', 'section', 'end', 'blank', 'default',
      'two-column', 'three-column', 'image', 'image-left', 'image-right',
      'features', 'stats', 'chart', 'table', 'quote',
      'code', 'comparison', 'timeline', 'bento',
    ];
    for (const name of expected) {
      expect(layoutRegistry).toHaveProperty(name);
    }
  });

  it('has layouts registered', () => {
    expect(Object.keys(layoutRegistry).length).toBeGreaterThanOrEqual(13);
  });
});

describe('grid engine: cover', () => {
  it('renders with hero module and no chrome', () => {
    const slide: Slide = {
      layout: 'cover',
      options: { background: '#1e293b' },
      content: '# Hello World\n## Subtitle',
    };
    const html = renderSlideV2(slide, emptyConfig, defaultContext);
    expect(html).toContain('data-layout="cover"');
    expect(html).toContain('slide-grid');
    expect(html).toContain('module-hero');
    expect(html).toContain('Hello World');
    expect(html).not.toContain('slide-header');
    expect(html).not.toContain('slide-footer');
  });

  it('applies background style', () => {
    const slide: Slide = {
      layout: 'cover',
      options: { background: '#1e293b', color: 'white' },
      content: '# Title',
    };
    const html = renderSlideV2(slide, emptyConfig, defaultContext);
    expect(html).toContain('background:#1e293b');
    expect(html).toContain('color:white');
  });
});

describe('grid engine: default', () => {
  it('renders with heading and richtext in 12-col grid', () => {
    const slide: Slide = {
      layout: 'default',
      options: {},
      content: '# My Title\n\nSome body text here.',
    };
    const html = renderSlideV2(slide, emptyConfig, defaultContext);
    expect(html).toContain('data-layout="default"');
    expect(html).toContain('grid-template-rows:auto 1fr');
    expect(html).toContain('grid-column:1 / span 12');
    expect(html).toContain('module-heading');
    expect(html).toContain('My Title');
    expect(html).toContain('module-richtext');
    expect(html).toContain('Some body text here');
  });

  it('includes header and footer chrome', () => {
    const slide: Slide = {
      layout: 'default',
      options: {},
      content: '# Test',
    };
    const html = renderSlideV2(slide, emptyConfig, defaultContext);
    expect(html).toContain('slide-header');
    expect(html).toContain('slide-footer');
  });
});

describe('grid engine: two-column', () => {
  it('splits content into left and right slots', () => {
    const slide: Slide = {
      layout: 'two-column',
      options: { ratio: '2:1' },
      content: '::left::\n## Left side\n::right::\n## Right side',
    };
    const html = renderSlideV2(slide, emptyConfig, defaultContext);
    expect(html).toContain('data-layout="two-column"');
    expect(html).toContain('Left side');
    expect(html).toContain('Right side');
  });

  it('adjusts column spans for 2:1 ratio', () => {
    const slide: Slide = {
      layout: 'two-column',
      options: { ratio: '2:1' },
      content: '::left::\nA\n::right::\nB',
    };
    const { layout } = resolveSlide(slide, emptyConfig, defaultContext);
    const left = layout.slots.find((s) => s.id === 'left');
    const right = layout.slots.find((s) => s.id === 'right');
    expect(left?.colSpan).toBe(8);
    expect(right?.colSpan).toBe(4);
  });
});

describe('grid engine: features (→ bento)', () => {
  it('renders as bento cells', () => {
    const slide: Slide = {
      layout: 'features',
      options: {},
      content: '',
      rawItems: [
        { icon: 'zap', title: 'Fast', description: 'Very fast' },
        { icon: 'shield', title: 'Secure', description: 'Very secure' },
      ],
    };
    const html = renderSlideV2(slide, emptyConfig, defaultContext);
    expect(html).toContain('bento-cell');
    expect(html).toContain('Fast');
    expect(html).toContain('Secure');
  });
});

describe('grid engine: stats (→ bento)', () => {
  it('renders as bento cells', () => {
    const slide: Slide = {
      layout: 'stats',
      options: {},
      content: '',
      rawItems: [
        { value: '99%', label: 'Uptime' },
        { value: '10M', label: 'Users' },
      ],
    };
    const html = renderSlideV2(slide, emptyConfig, defaultContext);
    expect(html).toContain('bento-cell');
    expect(html).toContain('99%');
    expect(html).toContain('10M');
  });
});

describe('grid engine: quote', () => {
  it('renders quote with minimal chrome', () => {
    const slide: Slide = {
      layout: 'quote',
      options: {},
      content: '> The best way to predict the future is to invent it.\n— Alan Kay',
    };
    const html = renderSlideV2(slide, emptyConfig, defaultContext);
    expect(html).toContain('module-quote');
    expect(html).toContain('predict the future');
    expect(html).toContain('Alan Kay');
    // Quote layout has minimal chrome (footer only, no header)
    expect(html).not.toContain('slide-header');
  });
});

describe('grid engine: page numbers', () => {
  it('renders page number when slide option is set', () => {
    const slide: Slide = {
      layout: 'default',
      options: { pageNumber: true },
      content: '# Test',
    };
    const html = renderSlideV2(slide, emptyConfig, { ...defaultContext, slideIndex: 3, totalSlides: 8 });
    expect(html).toContain('4 / 8');
  });

  it('renders page number from global config', () => {
    const config: GlobalConfig = { defaults: { pageNumber: true } };
    const slide: Slide = { layout: 'default', options: {}, content: '# Test' };
    const html = renderSlideV2(slide, config, { ...defaultContext, slideIndex: 1, totalSlides: 5 });
    expect(html).toContain('2 / 5');
  });
});

describe('slot resolver', () => {
  it('falls back to default layout for unknown names', () => {
    const slide: Slide = { layout: 'nonexistent', options: {}, content: 'Hello' };
    const { layout } = resolveSlide(slide, emptyConfig, defaultContext);
    expect(layout.name).toBe('default');
  });

  it('resolves bento layout from items', () => {
    const slide: Slide = {
      layout: 'bento',
      options: {},
      content: '',
      rawItems: [
        { span: '8:2', title: 'Big Cell' },
        { span: '4:1', title: 'Small Cell' },
        { span: '4:1', title: 'Another' },
      ],
    };
    const { layout } = resolveSlide(slide, emptyConfig, defaultContext);
    expect(layout.slots).toHaveLength(3);
  });
});

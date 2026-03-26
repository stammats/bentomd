import { describe, it, expect } from 'vitest';
import { statsRenderer } from '../src/layouts/stats.js';
import { chartRenderer } from '../src/layouts/chart.js';
import { tableRenderer } from '../src/layouts/table.js';
import { quoteRenderer } from '../src/layouts/quote.js';
import { sectionRenderer } from '../src/layouts/section.js';
import { imageRenderer } from '../src/layouts/image.js';
import { featuresRenderer } from '../src/layouts/features.js';
import { layoutRegistry as layouts } from '../src/engine/definitions.js';
import type { Slide, GlobalConfig } from '../src/types/index.js';

const emptyConfig: GlobalConfig = {};

describe('stats renderer', () => {
  it('renders stat cards with values and labels', () => {
    const slide: Slide = {
      layout: 'stats',
      options: {},
      content: '',
      items: [
        { type: 'stat', value: '99.9%', label: 'Uptime', trend: '+0.1%' },
        { type: 'stat', value: '2.4M', label: 'Users' },
      ],
    };
    const html = statsRenderer(slide, emptyConfig);
    expect(html).toContain('data-layout="stats"');
    expect(html).toContain('stats-grid');
    expect(html).toContain('stat-value');
    expect(html).toContain('99.9%');
    expect(html).toContain('Uptime');
    expect(html).toContain('stat-trend-up');
    expect(html).toContain('+0.1%');
  });

  it('limits columns to max 4', () => {
    const slide: Slide = {
      layout: 'stats',
      options: { columns: 6 },
      content: '',
      items: [
        { type: 'stat', value: '1', label: 'A' },
        { type: 'stat', value: '2', label: 'B' },
        { type: 'stat', value: '3', label: 'C' },
        { type: 'stat', value: '4', label: 'D' },
        { type: 'stat', value: '5', label: 'E' },
        { type: 'stat', value: '6', label: 'F' },
      ],
    };
    const html = statsRenderer(slide, emptyConfig);
    expect(html).toContain('repeat(4, 1fr)');
  });

  it('renders icon when provided', () => {
    const slide: Slide = {
      layout: 'stats',
      options: {},
      content: '',
      items: [{ type: 'stat', value: '42', label: 'Answer', icon: 'star' }],
    };
    const html = statsRenderer(slide, emptyConfig);
    expect(html).toContain('stat-icon');
    expect(html).toContain('<svg');
  });

  it('marks negative trends as down', () => {
    const slide: Slide = {
      layout: 'stats',
      options: {},
      content: '',
      items: [{ type: 'stat', value: '10', label: 'X', trend: '-5%' }],
    };
    const html = statsRenderer(slide, emptyConfig);
    expect(html).toContain('stat-trend-down');
  });
});

describe('chart renderer', () => {
  it('renders bar chart by default', () => {
    const slide: Slide = {
      layout: 'chart',
      options: {},
      content: '',
      items: [
        { type: 'chart-data', label: 'Q1', value: 100 },
        { type: 'chart-data', label: 'Q2', value: 200 },
      ],
    };
    const html = chartRenderer(slide, emptyConfig);
    expect(html).toContain('data-layout="chart"');
    expect(html).toContain('chart-container');
    expect(html).toContain('<svg');
    expect(html).toContain('Q1');
    expect(html).toContain('Q2');
  });

  it('renders pie/donut chart', () => {
    const slide: Slide = {
      layout: 'chart',
      options: { type: 'pie' },
      content: '',
      items: [
        { type: 'chart-data', label: 'A', value: 60 },
        { type: 'chart-data', label: 'B', value: 40 },
      ],
    };
    const html = chartRenderer(slide, emptyConfig);
    expect(html).toContain('<circle');
    expect(html).toContain('stroke-dasharray');
  });

  it('renders line chart', () => {
    const slide: Slide = {
      layout: 'chart',
      options: { type: 'line' },
      content: '',
      items: [
        { type: 'chart-data', label: 'Jan', value: 10 },
        { type: 'chart-data', label: 'Feb', value: 20 },
        { type: 'chart-data', label: 'Mar', value: 15 },
      ],
    };
    const html = chartRenderer(slide, emptyConfig);
    expect(html).toContain('<polyline');
    expect(html).toContain('Jan');
  });

  it('shows chart title when provided', () => {
    const slide: Slide = {
      layout: 'chart',
      options: { title: 'Revenue' },
      content: '',
      items: [{ type: 'chart-data', label: 'X', value: 1 }],
    };
    const html = chartRenderer(slide, emptyConfig);
    expect(html).toContain('chart-title');
    expect(html).toContain('Revenue');
  });
});

describe('table renderer', () => {
  it('renders table from typed items', () => {
    const slide: Slide = {
      layout: 'table',
      options: {},
      content: '',
      items: [
        {
          type: 'table',
          headers: ['Name', 'Score'],
          rows: [
            ['Alice', '95'],
            ['Bob', '87'],
          ],
          caption: 'Test Results',
        },
      ],
    };
    const html = tableRenderer(slide, emptyConfig);
    expect(html).toContain('data-layout="table"');
    expect(html).toContain('slide-table');
    expect(html).toContain('<th>Name</th>');
    expect(html).toContain('<th>Score</th>');
    expect(html).toContain('<td>Alice</td>');
    expect(html).toContain('<td>87</td>');
    expect(html).toContain('table-caption');
    expect(html).toContain('Test Results');
  });

  it('parses markdown table from content', () => {
    const slide: Slide = {
      layout: 'table',
      options: {},
      content: '| A | B |\n|---|---|\n| 1 | 2 |\n| 3 | 4 |',
    };
    const html = tableRenderer(slide, emptyConfig);
    expect(html).toContain('<th>A</th>');
    expect(html).toContain('<td>1</td>');
    expect(html).toContain('<td>4</td>');
  });
});

describe('quote renderer', () => {
  it('renders quote from typed item', () => {
    const slide: Slide = {
      layout: 'quote',
      options: {},
      content: '',
      items: [
        {
          type: 'quote',
          text: 'The only way to do great work is to love what you do.',
          author: 'Steve Jobs',
          role: 'Apple CEO',
        },
      ],
    };
    const html = quoteRenderer(slide, emptyConfig);
    expect(html).toContain('data-layout="quote"');
    expect(html).toContain('quote-block');
    expect(html).toContain('quote-text');
    expect(html).toContain('great work');
    expect(html).toContain('quote-author');
    expect(html).toContain('Steve Jobs');
    expect(html).toContain('quote-role');
    expect(html).toContain('Apple CEO');
  });

  it('parses blockquote from markdown content', () => {
    const slide: Slide = {
      layout: 'quote',
      options: {},
      content: '> Be yourself; everyone else is already taken.\n\n— Oscar Wilde',
    };
    const html = quoteRenderer(slide, emptyConfig);
    expect(html).toContain('Be yourself');
    expect(html).toContain('Oscar Wilde');
  });

  it('renders quote mark character', () => {
    const slide: Slide = {
      layout: 'quote',
      options: {},
      content: '',
      items: [{ type: 'quote', text: 'Hello' }],
    };
    const html = quoteRenderer(slide, emptyConfig);
    expect(html).toContain('quote-mark');
    expect(html).toContain('\u201C');
  });
});

describe('section renderer', () => {
  it('renders full-slide section break', () => {
    const slide: Slide = {
      layout: 'section',
      options: {},
      content: '# Part Two\n## The Journey',
    };
    const html = sectionRenderer(slide, emptyConfig);
    expect(html).toContain('data-layout="section"');
    expect(html).toContain('section-body');
    expect(html).toContain('<h1>Part Two</h1>');
    expect(html).toContain('<h2>The Journey</h2>');
  });

  it('applies background color', () => {
    const slide: Slide = {
      layout: 'section',
      options: { color: '#1e293b' },
      content: '# Dark Section',
    };
    const html = sectionRenderer(slide, emptyConfig);
    expect(html).toContain('background:#1e293b');
  });
});

describe('image renderer', () => {
  it('renders image with options', () => {
    const slide: Slide = {
      layout: 'image',
      options: { src: 'photo.jpg', fit: 'contain', position: 'top', caption: 'A photo' },
      content: '',
    };
    const html = imageRenderer(slide, emptyConfig);
    expect(html).toContain('data-layout="image"');
    expect(html).toContain('image-container');
    expect(html).toContain('src="photo.jpg"');
    expect(html).toContain('object-fit:contain');
    expect(html).toContain('object-position:top');
    expect(html).toContain('image-caption');
    expect(html).toContain('A photo');
  });

  it('defaults to cover fit', () => {
    const slide: Slide = {
      layout: 'image',
      options: { src: 'img.png' },
      content: '',
    };
    const html = imageRenderer(slide, emptyConfig);
    expect(html).toContain('object-fit:cover');
  });
});

describe('features renderer (updated)', () => {
  it('uses feature-desc class', () => {
    const slide: Slide = {
      layout: 'features',
      options: {},
      content: '',
      items: [{ icon: 'star', title: 'Feature', description: 'A description' }],
    };
    const html = featuresRenderer(slide, emptyConfig);
    expect(html).toContain('feature-desc');
  });

  it('uses icon size 32 by default', () => {
    const slide: Slide = {
      layout: 'features',
      options: {},
      content: '',
      items: [{ icon: 'arrow-right', title: 'Go' }],
    };
    const html = featuresRenderer(slide, emptyConfig);
    expect(html).toContain('width="32"');
    expect(html).toContain('height="32"');
  });
});

describe('layout registry', () => {
  it('includes all module renderers', () => {
    expect(layouts).toHaveProperty('stats');
    expect(layouts).toHaveProperty('chart');
    expect(layouts).toHaveProperty('table');
    expect(layouts).toHaveProperty('quote');
    expect(layouts).toHaveProperty('section');
    expect(layouts).toHaveProperty('image');
    expect(layouts).toHaveProperty('features');
  });
});

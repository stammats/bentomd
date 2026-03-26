import { describe, it, expect } from 'vitest';
import { parse } from '../src/parser/index.js';

describe('parse', () => {
  it('parses global config', () => {
    const source = `---
theme: dark
title: My Deck
author: Alice
aspectRatio: "16:9"
---

---
layout: cover
---

Hello`;

    const deck = parse(source);
    expect(deck.config.theme).toBe('dark');
    expect(deck.config.title).toBe('My Deck');
    expect(deck.config.author).toBe('Alice');
    expect(deck.config.aspectRatio).toBe('16:9');
  });

  it('parses global config with new fields (logo, footer, defaults, lang, dir)', () => {
    const source = `---
theme: dark
title: My Deck
lang: ja
dir: ltr
logo:
  path: /logo.svg
  position: top-right
  height: 40
footer:
  left: "© 2026"
  center: My Company
  right: Confidential
  show: true
defaults:
  header: Default Header
  footer: true
  pageNumber: true
  layout: default
---

---
layout: cover
---

Hello`;

    const deck = parse(source);
    expect(deck.config.lang).toBe('ja');
    expect(deck.config.dir).toBe('ltr');
    expect(deck.config.logo).toEqual({ path: '/logo.svg', position: 'top-right', height: 40 });
    expect(deck.config.footer).toEqual({
      left: '© 2026',
      center: 'My Company',
      right: 'Confidential',
      show: true,
    });
    expect(deck.config.defaults).toEqual({
      header: 'Default Header',
      footer: true,
      pageNumber: true,
      layout: 'default',
    });
  });

  it('parses fonts with heading/body and sans backward compat', () => {
    const source = `---
fonts:
  heading: Inter
  body: Roboto
  mono: Fira Code
---

---
layout: cover
---

Hello`;

    const deck = parse(source);
    expect(deck.config.fonts).toEqual({ heading: 'Inter', body: 'Roboto', mono: 'Fira Code' });
  });

  it('maps fonts.sans to fonts.body as backward compat', () => {
    const source = `---
fonts:
  sans: Helvetica
  mono: Courier
---

---
layout: cover
---

Hello`;

    const deck = parse(source);
    expect(deck.config.fonts!.sans).toBe('Helvetica');
    expect(deck.config.fonts!.body).toBe('Helvetica');
  });

  it('parses a single slide with default layout', () => {
    const source = `---
theme: default
---

---
layout: default
---

# Hello World`;

    const deck = parse(source);
    expect(deck.slides).toHaveLength(1);
    expect(deck.slides[0].layout).toBe('default');
    expect(deck.slides[0].content).toBe('# Hello World');
  });

  it('parses multiple slides', () => {
    const source = `---
title: Multi
---

---
layout: cover
---

# Title Slide

---
layout: section
---

# Section Slide

---
layout: default
---

Some content`;

    const deck = parse(source);
    expect(deck.slides).toHaveLength(3);
    expect(deck.slides[0].layout).toBe('cover');
    expect(deck.slides[1].layout).toBe('section');
    expect(deck.slides[2].layout).toBe('default');
    expect(deck.slides[2].content).toBe('Some content');
  });

  it('parses per-slide options (header, heading, summary)', () => {
    const source = `---
theme: default
---

---
layout: default
header: Page Header
heading: Main Heading
summary: A brief summary
footer: true
pageNumber: true
background: "#f0f0f0"
---

Body content`;

    const deck = parse(source);
    const opts = deck.slides[0].options;
    expect(opts.header).toBe('Page Header');
    expect(opts.heading).toBe('Main Heading');
    expect(opts.summary).toBe('A brief summary');
    expect(opts.footer).toBe(true);
    expect(opts.pageNumber).toBe(true);
    expect(opts.background).toBe('#f0f0f0');
  });

  it('parses features layout with items and infers FeatureItem type', () => {
    const source = `---
theme: default
---

---
layout: features
columns: 3
---

### :zap: Fast
Very fast

### :shield: Secure
Very secure`;

    const deck = parse(source);
    expect(deck.slides).toHaveLength(1);
    expect(deck.slides[0].layout).toBe('features');
    expect(deck.slides[0].options).toEqual({ columns: 3 });
    expect(deck.slides[0].items).toHaveLength(2);
    expect(deck.slides[0].items![0]).toEqual({
      type: 'feature',
      icon: 'zap',
      title: 'Fast',
      description: 'Very fast',
    });
    expect(deck.slides[0].items![1]).toEqual({
      type: 'feature',
      icon: 'shield',
      title: 'Secure',
      description: 'Very secure',
    });
  });

  it('infers StatItem type for items with string value + label', () => {
    const source = `---
theme: default
---

---
layout: stats
---

### 99.9%
Uptime

### 50ms
Latency`;

    const deck = parse(source);
    expect(deck.slides[0].items).toHaveLength(2);
    expect(deck.slides[0].items![0]).toEqual({
      type: 'stat',
      value: '99.9%',
      label: 'Uptime',
    });
    expect(deck.slides[0].items![1]).toEqual({
      type: 'stat',
      value: '50ms',
      label: 'Latency',
    });
  });

  it('infers ChartDataItem type for items with label + numeric value', () => {
    const source = `---
theme: default
---

---
layout: chart
---

### Q1: 100
### Q2: 200`;

    const deck = parse(source);
    expect(deck.slides[0].items).toHaveLength(2);
    expect(deck.slides[0].items![0]).toEqual({
      type: 'chart-data',
      label: 'Q1',
      value: 100,
    });
    expect(deck.slides[0].items![1]).toEqual({
      type: 'chart-data',
      label: 'Q2',
      value: 200,
    });
  });

  it('infers ComparisonItem type for items with label + features array', () => {
    const source = `---
theme: default
---

---
layout: comparison
---

### Basic — $10
- Feature A
- Feature B

### Pro — $20 {highlight}
- Feature A
- Feature B
- Feature C`;

    const deck = parse(source);
    expect(deck.slides[0].items).toHaveLength(2);
    expect(deck.slides[0].items![0]).toEqual({
      type: 'comparison',
      label: 'Basic',
      price: '$10',
      features: ['Feature A', 'Feature B'],
    });
    expect(deck.slides[0].items![1]).toEqual({
      type: 'comparison',
      label: 'Pro',
      price: '$20',
      features: ['Feature A', 'Feature B', 'Feature C'],
      highlight: true,
    });
  });

  it('infers TimelineItem type for items with date + title', () => {
    const source = `---
theme: default
---

---
layout: timeline
---

### 2024-01 — Launch
Product launched

### 2024-06 — Scale {active}`;

    const deck = parse(source);
    expect(deck.slides[0].items).toHaveLength(2);
    expect(deck.slides[0].items![0]).toEqual({
      type: 'timeline',
      date: '2024-01',
      title: 'Launch',
      description: 'Product launched',
    });
    expect(deck.slides[0].items![1]).toEqual({
      type: 'timeline',
      date: '2024-06',
      title: 'Scale',
      active: true,
    });
  });

  it('infers feature type from icon + title fields', () => {
    const source = `---
theme: default
---

---
layout: features
---

### :star: Custom`;

    const deck = parse(source);
    expect(deck.slides[0].items![0]).toEqual({
      type: 'feature',
      icon: 'star',
      title: 'Custom',
    });
  });

  it('stores rawItems for backward compat', () => {
    const source = `---
theme: default
---

---
layout: stats
---

### 42
Answer`;

    const deck = parse(source);
    expect(deck.slides[0].rawItems).toHaveLength(1);
    expect(deck.slides[0].rawItems![0]).toEqual({ value: '42', label: 'Answer' });
  });

  it('handles two-column layout with ::left:: and ::right:: markers', () => {
    const source = `---
theme: default
---

---
layout: two-column
---

::left::

Left content here

::right::

Right content here`;

    const deck = parse(source);
    expect(deck.slides).toHaveLength(1);
    expect(deck.slides[0].layout).toBe('two-column');
    expect(deck.slides[0].content).toContain('::left::');
    expect(deck.slides[0].content).toContain('::right::');
    expect(deck.slides[0].content).toContain('Left content here');
    expect(deck.slides[0].content).toContain('Right content here');
  });

  it('handles empty content', () => {
    const source = `---
theme: default
---

---
layout: cover
---
`;

    const deck = parse(source);
    expect(deck.slides).toHaveLength(1);
    expect(deck.slides[0].layout).toBe('cover');
    expect(deck.slides[0].content).toBe('');
  });

  it('handles minimal slide with just layout', () => {
    const source = `---
layout: blank
---
`;

    const deck = parse(source);
    // No global config block with theme/title, so first block with layout is a slide
    expect(deck.slides).toHaveLength(1);
    expect(deck.slides[0].layout).toBe('blank');
  });

  it('does not parse items for non-list layouts', () => {
    const source = `---
theme: default
---

---
layout: default
---

- bullet one
- bullet two`;

    const deck = parse(source);
    expect(deck.slides[0].items).toBeUndefined();
    expect(deck.slides[0].content).toContain('- bullet one');
  });

  it('returns empty config and slides for empty input', () => {
    const deck = parse('');
    expect(deck.config).toEqual({});
    expect(deck.slides).toEqual([]);
  });

  it('parses deck with cover and features slides using Markdown item syntax', () => {
    const source = `---
theme: dark
title: Old Deck
author: Bob
---

---
layout: cover
---

# Welcome

---
layout: features
columns: 2
---

### :star: Feature 1
Desc 1`;

    const deck = parse(source);
    expect(deck.config.theme).toBe('dark');
    expect(deck.config.title).toBe('Old Deck');
    expect(deck.slides).toHaveLength(2);
    expect(deck.slides[0].layout).toBe('cover');
    expect(deck.slides[1].layout).toBe('features');
    expect(deck.slides[1].items).toHaveLength(1);
    // rawItems preserves the built object (without inferred type)
    expect(deck.slides[1].rawItems![0]).not.toHaveProperty('type');
  });
});

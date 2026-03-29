import { describe, it, expect } from 'vitest';
import { parse } from '../src/parser/index.js';

describe('parse', () => {
  // ---- Global config ----

  it('parses global config', () => {
    const source = `---
theme: dark
title: My Deck
author: Alice
aspectRatio: "16:9"
---

## {cover}

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

## {cover}

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

## {cover}

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

## {cover}

Hello`;

    const deck = parse(source);
    expect(deck.config.fonts!.sans).toBe('Helvetica');
    expect(deck.config.fonts!.body).toBe('Helvetica');
  });

  it('returns default config and no slides for empty input', () => {
    const deck = parse('');
    expect(deck.config.palette).toBeDefined();
    expect(deck.slides).toEqual([]);
  });

  // ---- Slide splitting ----

  it('splits slides on ## headings', () => {
    const source = `---
title: Test
---

## Slide One

Hello world

## Slide Two

Goodbye world
`;
    const deck = parse(source);
    expect(deck.slides).toHaveLength(2);
    expect(deck.slides[0].options.heading).toBe('Slide One');
    expect(deck.slides[0].content).toContain('Hello world');
    expect(deck.slides[1].options.heading).toBe('Slide Two');
    expect(deck.slides[1].content).toContain('Goodbye world');
  });

  it('parses single slide with default layout', () => {
    const source = `---
theme: default
---

## Hello

# Hello World`;

    const deck = parse(source);
    expect(deck.slides).toHaveLength(1);
    expect(deck.slides[0].layout).toBe('default');
    expect(deck.slides[0].options.heading).toBe('Hello');
    expect(deck.slides[0].content).toContain('# Hello World');
  });

  it('parses multiple slides', () => {
    const source = `---
title: Multi
---

## {cover}

# Title Slide

## Section

# Section Slide

## Content

Some content`;

    const deck = parse(source);
    expect(deck.slides).toHaveLength(3);
    expect(deck.slides[0].layout).toBe('cover');
    expect(deck.slides[1].options.heading).toBe('Section');
    expect(deck.slides[2].options.heading).toBe('Content');
    expect(deck.slides[2].content).toBe('Some content');
  });

  it('does not split on ## inside code blocks', () => {
    const source = `---
title: Test
---

## Code Example

\`\`\`markdown
## This is not a slide
\`\`\`
`;
    const deck = parse(source);
    expect(deck.slides).toHaveLength(1);
    expect(deck.slides[0].options.heading).toBe('Code Example');
    expect(deck.slides[0].content).toContain('## This is not a slide');
  });

  // ---- Inline attributes ----

  it('parses inline attributes {cover, bg="..."}', () => {
    const source = `---
title: Test
---

## {cover, bg="#0f172a"}

# Big Title
`;
    const deck = parse(source);
    expect(deck.slides).toHaveLength(1);
    expect(deck.slides[0].layout).toBe('cover');
    expect(deck.slides[0].options.background).toBe('#0f172a');
    expect(deck.slides[0].options.color).toBe('#ffffff');
    expect(deck.slides[0].options.heading).toBeUndefined();
  });

  it('parses title with attributes', () => {
    const source = `---
title: Test
---

## Architecture {style=mono}

### :cloud: K8s
Auto scaling
`;
    const deck = parse(source);
    expect(deck.slides).toHaveLength(1);
    expect(deck.slides[0].options.heading).toBe('Architecture');
    expect(deck.slides[0].options.style).toBe('mono');
    expect(deck.slides[0].items).toBeDefined();
  });

  it('parses multiple attributes', () => {
    const source = `---
title: Test
---

## {cover, bg="#1a1a2e", align=left}

# Title
`;
    const deck = parse(source);
    expect(deck.slides[0].layout).toBe('cover');
    expect(deck.slides[0].options.background).toBe('#1a1a2e');
    expect(deck.slides[0].options.align).toBe('left');
    expect(deck.slides[0].options.color).toBe('#ffffff');
  });

  it('auto-detects light bg text color', () => {
    const source = `---
title: Test
---

## {cover, bg="#ffffff"}

# Title
`;
    const deck = parse(source);
    expect(deck.slides[0].options.color).toBe('#2d3436');
  });

  it('auto-detects image background with overlay', () => {
    const source = `---
title: Test
---

## {cover, bg="https://example.com/photo.jpg"}

# Title
`;
    const deck = parse(source);
    expect(deck.slides[0].options.background).toBe('https://example.com/photo.jpg');
    expect(deck.slides[0].options.color).toBe('#ffffff');
    expect(deck.slides[0].options.overlay).toBe(0.4);
  });

  // ---- Item parsing (### items) ----

  it('parses bento slides with ### items', () => {
    const source = `---
title: Test
theme: ocean
---

## Tech Stack {style=tint}

### :code: TypeScript
Full-stack type safety

### :database: PostgreSQL
ACID compliant

### :server: Node.js
Async I/O
`;
    const deck = parse(source);
    expect(deck.slides).toHaveLength(1);
    expect(deck.slides[0].options.heading).toBe('Tech Stack');
    expect(deck.slides[0].options.style).toBe('tint');
    expect(deck.slides[0].rawItems).toBeDefined();
    expect(deck.slides[0].rawItems!.length).toBe(3);
  });

  it('parses feature items with icon + title + description', () => {
    const source = `---
theme: default
---

## Features

### :zap: Fast
Very fast

### :shield: Secure
Very secure`;

    const deck = parse(source);
    expect(deck.slides[0].items).toHaveLength(2);
    expect(deck.slides[0].items![0]).toMatchObject({
      icon: 'zap',
      title: 'Fast',
      description: 'Very fast',
    });
    expect(deck.slides[0].items![1]).toMatchObject({
      icon: 'shield',
      title: 'Secure',
      description: 'Very secure',
    });
  });

  it('parses stat items with value + label', () => {
    const source = `---
theme: default
---

## Metrics

### 99.9%
Uptime

### 50ms
Latency`;

    const deck = parse(source);
    expect(deck.slides[0].items).toHaveLength(2);
    expect(deck.slides[0].items![0]).toMatchObject({
      title: '99.9%',
      description: 'Uptime',
    });
  });

  it('parses chart data items with label: value', () => {
    const source = `---
theme: default
---

## Revenue {chart}

### Q1: 100
### Q2: 200`;

    const deck = parse(source);
    expect(deck.slides[0].items).toHaveLength(2);
    expect(deck.slides[0].items![0]).toEqual({
      type: 'chart-data',
      label: 'Q1',
      value: 100,
    });
  });

  it('parses comparison items', () => {
    const source = `---
theme: default
---

## Plans

### Basic — $10
- Feature A
- Feature B

### Pro — $20 {highlight}
- Feature A
- Feature B
- Feature C`;

    const deck = parse(source);
    expect(deck.slides[0].items).toHaveLength(2);
    expect(deck.slides[0].items![0]).toMatchObject({ title: 'Basic — $10' });
    expect(deck.slides[0].items![1]).toMatchObject({ title: 'Pro — $20' });
  });

  it('parses timeline items with date + title', () => {
    const source = `---
theme: default
---

## History {timeline}

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

  it('stores rawItems', () => {
    const source = `---
theme: default
---

## Stats

### 42
Answer`;

    const deck = parse(source);
    expect(deck.slides[0].rawItems).toHaveLength(1);
    expect(deck.slides[0].rawItems![0]).toMatchObject({ title: '42', description: 'Answer' });
  });

  it('does not parse items for slides without ### headings', () => {
    const source = `---
theme: default
---

## Simple

- bullet one
- bullet two`;

    const deck = parse(source);
    expect(deck.slides[0].items).toBeUndefined();
    expect(deck.slides[0].content).toContain('- bullet one');
  });

  it('extracts summary text between ## and first ###', () => {
    const source = `---
title: Test
---

## Overview

This is the summary

### :star: Item 1
Description`;

    const deck = parse(source);
    expect(deck.slides[0].options.heading).toBe('Overview');
    expect(deck.slides[0].options.summary).toBe('This is the summary');
  });

  // ---- Cover slides ----

  it('parses cover with no title (heading comes from body)', () => {
    const source = `---
title: Test
---

## {cover, bg="#0f172a"}

# Welcome
This is the subtitle
`;
    const deck = parse(source);
    expect(deck.slides[0].layout).toBe('cover');
    expect(deck.slides[0].options.heading).toBeUndefined();
    expect(deck.slides[0].content).toContain('# Welcome');
    expect(deck.slides[0].content).toContain('This is the subtitle');
  });

  // ---- Full deck ----

  it('parses a realistic full deck', () => {
    const source = `---
title: React Server Components
theme: ocean
style: tint
---

## {cover, bg="#0f172a"}

# React Server Components
実践投入して分かったこと

## 移行前の課題 {style=mono}

### :zap: バンドルサイズ **1.8MB**
SPAで肥大化

### :refresh-cw: データフェッチ **カオス**
useEffect + SWR が混在

### :alert-triangle: SEO **壊滅的**
CSRのみ

## {cover, bg="#0f172a"}

# ありがとうございました
`;
    const deck = parse(source);
    expect(deck.config.theme).toBe('ocean');
    expect(deck.config.style).toBe('tint');
    expect(deck.slides).toHaveLength(3);
    expect(deck.slides[0].layout).toBe('cover');
    expect(deck.slides[0].options.background).toBe('#0f172a');
    expect(deck.slides[1].options.heading).toBe('移行前の課題');
    expect(deck.slides[1].options.style).toBe('mono');
    expect(deck.slides[1].rawItems).toHaveLength(3);
    expect(deck.slides[2].layout).toBe('cover');
  });
});

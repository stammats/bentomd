# bentomd

Modular slide decks from Markdown. Built for the AI era.

Write presentations in plain Markdown with `###` syntax — bentomd handles layout, typography, and rendering automatically.

## Features

- **18 layouts** — cover, bento grid, stats, charts, image, code, timeline, comparison, and more
- **Swiss typography** — presentation-grade type scale, spacing, and grid system
- **Mermaid diagrams** — flowcharts, sequence diagrams, Gantt charts with automatic theming
- **Inline charts** — bar, pie, line charts from simple data notation
- **Zero config** — sensible defaults, override with YAML frontmatter when needed
- **Hot reload** — dev server with instant preview

## Quick Start

```bash
npm install -g bentomd
```

Create a `.bmd` file:

```markdown
---
layout: cover
---
# My Presentation
Subtitle here

---
layout: bento
---
### :zap: Fast
Build slides in seconds

### :palette: Beautiful
Swiss typography defaults

### :package: Portable
Single HTML output
```

Preview with hot reload:

```bash
bentomd dev slides.bmd
```

Build to static HTML:

```bash
bentomd build slides.bmd
```

## Layouts

| Layout | Description |
|--------|-------------|
| `cover` | Title slide with optional background |
| `default` | Heading + body text |
| `two-column` | Side-by-side content with ratio control |
| `three-column` | Three-column grid |
| `bento` | Bento grid with auto-packing |
| `stats` | Stat cards with icons and trends |
| `chart` | Bar, pie, line charts |
| `image` / `image-left` / `image-right` | Image layouts |
| `code` | Syntax-highlighted code blocks |
| `timeline` | Chronological events |
| `comparison` | Side-by-side comparison cards |
| `quote` | Pull quote with attribution |
| `features` | Feature card grid |
| `table` | Data tables |
| `section` / `end` | Section breaks and closing slides |

## Documentation

Visit the [documentation site](https://bentomd.dev) for guides, patterns, and examples.

## License

MIT

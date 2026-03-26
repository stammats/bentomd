# bentomd Desktop

A native Mac desktop editor for bentomd, built with Tauri v2 + Vite.

## Architecture

- **Frontend**: Vanilla JS + Vite, imports from the `bentomd` package at repo root
- **Backend**: Rust (Tauri v2) for native file system access
- **Window**: 1400x900, dark-themed split editor/preview

## Features

- Split-pane editor (left) + live preview (right)
- File open/save/save-as via native dialogs
- PDF export via print dialog
- 8 built-in themes (switchable in toolbar)
- Aspect ratio toggle (16:9 / 4:3)
- Resizable editor pane
- Keyboard shortcuts: Cmd+N, Cmd+O, Cmd+S, Shift+Cmd+S, Cmd+P

## Prerequisites

### 1. Install Rust

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

Restart your terminal after installation, then verify:

```bash
rustc --version
cargo --version
```

### 2. Install macOS system dependencies

Tauri requires Xcode Command Line Tools:

```bash
xcode-select --install
```

### 3. Install Node dependencies

From the `desktop/` directory:

```bash
npm install
```

This installs:
- `@tauri-apps/cli` — Tauri build tooling
- `@tauri-apps/api` — JS bindings for native APIs
- `vite` — frontend bundler
- `bentomd` — the bentomd library (linked from repo root via `file:..`)

## Running in development

From repo root:

```bash
npm run desktop:dev
```

Or from `desktop/`:

```bash
npm run tauri:dev
```

This starts:
1. Vite dev server on `http://localhost:1420`
2. Tauri app window loading from that dev server

## Building for distribution

First build the bentomd library:

```bash
# From repo root
npm run build
```

Then build the desktop app:

```bash
npm run desktop:build
```

The `.app` bundle will be in `desktop/src-tauri/target/release/bundle/macos/`.

## App icons

Generate icons from a 1024x1024 source image:

```bash
cd desktop
npx @tauri-apps/cli icon path/to/icon.png
```

## Project structure

```
desktop/
  index.html              — Entry HTML
  vite.config.js          — Vite config (port 1420, outputs to dist/)
  package.json            — JS dependencies
  src/
    main.js               — Editor app (vanilla JS)
    style.css             — Dark theme styles
  src-tauri/
    tauri.conf.json       — Tauri app config
    Cargo.toml            — Rust dependencies
    build.rs              — Tauri build script
    capabilities/
      default.json        — Permission grants (fs, dialog, shell)
    src/
      main.rs             — Rust entry point
      lib.rs              — Tauri commands (read_file, write_file)
    icons/                — App icons (see icons/README.md)
```

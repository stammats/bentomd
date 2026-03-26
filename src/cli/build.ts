import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'fs';
import { resolve } from 'path';
import { parse } from '../parser/index.js';
import { renderSlide } from '../layouts/index.js';
import { renderDeck } from '../renderer/index.js';

export async function buildCommand(file?: string, options?: { out?: string }) {
  const filePath = resolveFile(file);
  const outDir = resolve(options?.out || './dist');

  const source = readFileSync(filePath, 'utf-8');
  const deck = parse(source);
  const slideHtmls = deck.slides.map(s => renderSlide(s, deck.config));
  const html = renderDeck(slideHtmls, deck.config);

  mkdirSync(outDir, { recursive: true });
  writeFileSync(resolve(outDir, 'index.html'), html);
  console.log(`Built to ${outDir}/index.html`);
}

function resolveFile(file?: string): string {
  if (file) return resolve(file);
  const files = readdirSync(process.cwd()).filter(f => f.endsWith('.bmd'));
  if (files.length === 0) {
    console.error('No .bmd file found in current directory. Specify a file: bentomd build <file>');
    process.exit(1);
  }
  return resolve(files[0]);
}

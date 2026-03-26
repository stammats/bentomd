#!/usr/bin/env node
import { Command } from 'commander';
import { devCommand } from './dev.js';
import { buildCommand } from './build.js';

const program = new Command();
program
  .name('bentomd')
  .description('Modular slide decks from Markdown + YAML')
  .version('0.1.0');

program
  .command('dev [file]')
  .description('Start dev server with hot reload')
  .option('-p, --port <port>', 'Port number', '3000')
  .option('-o, --open', 'Open browser automatically')
  .action(devCommand);

program
  .command('build [file]')
  .description('Build to static HTML')
  .option('-o, --out <dir>', 'Output directory', './dist')
  .action(buildCommand);

program.parse();

import { createServer } from 'http';
import { readFileSync, readdirSync } from 'fs';
import { resolve } from 'path';
import { watch } from 'chokidar';
import { WebSocketServer } from 'ws';
import { parse } from '../parser/index.js';
import { renderSlide } from '../layouts/index.js';
import { renderDeck } from '../renderer/index.js';

export async function devCommand(file?: string, options?: { port?: string; open?: boolean }) {
  const filePath = resolveFile(file);
  const port = parseInt(options?.port || '3000');

  function buildHtml(): string {
    const source = readFileSync(filePath, 'utf-8');
    const deck = parse(source);
    const slideHtmls = deck.slides.map(s => renderSlide(s, deck.config));
    let html = renderDeck(slideHtmls, deck.config);
    html = html.replace('</body>', hmrClientScript() + '</body>');
    return html;
  }

  const server = createServer((req, res) => {
    try {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(buildHtml());
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end(String(err));
    }
  });

  const wss = new WebSocketServer({ server });

  const watcher = watch(filePath);
  watcher.on('change', () => {
    console.log('File changed, reloading...');
    wss.clients.forEach(client => {
      client.send('reload');
    });
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`\n  bentomd dev server running at:\n  http://localhost:${port}\n`);
    if (options?.open) {
      import('child_process').then(cp => {
        const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
        cp.exec(`${cmd} http://localhost:${port}`);
      });
    }
  });
}

function hmrClientScript(): string {
  return `<script>
(function() {
  const ws = new WebSocket('ws://' + location.host);
  ws.onmessage = function(e) {
    if (e.data === 'reload') location.reload();
  };
  ws.onclose = function() {
    setTimeout(() => location.reload(), 1000);
  };
})();
</script>`;
}

function resolveFile(file?: string): string {
  if (file) return resolve(file);
  const files = readdirSync(process.cwd()).filter(f => f.endsWith('.bmd'));
  if (files.length === 0) {
    console.error('No .bmd file found in current directory. Specify a file: bentomd dev <file>');
    process.exit(1);
  }
  return resolve(files[0]);
}

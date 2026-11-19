// Leonida Platinum — tiny static server for local testing only.
// Serves app/ at http://localhost:8080 (or $PORT). No dependencies.
// Run:  node serve.ts

import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const appDir = resolve(join(fileURLToPath(new URL('.', import.meta.url)), 'app'));
const port = Number(process.env.PORT || 8080);

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', 'http://localhost');
    let rel = decodeURIComponent(url.pathname);
    if (rel === '/') rel = '/index.html';
    const file = resolve(join(appDir, normalize(rel)));
    if (!file.startsWith(appDir)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }
    const info = await stat(file);
    if (!info.isFile()) throw new Error('not a file');
    res.writeHead(200, { 'content-type': types[extname(file)] || 'application/octet-stream' });
    createReadStream(file).pipe(res);
  } catch (_err) {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(port, () => {
  console.log('Leonida Platinum serving app/ at http://localhost:' + port);
});

// Leonida Platinum — a tiny static file server for local development.
// Serves app/ at its root so the guide can be opened in a browser:
//   node serve.ts [port]        (default port 8123, or $PORT)
// It supports GET and HEAD and serves only files under app/.

import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, normalize, sep } from 'node:path';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), 'app');
const PORT = Number(process.argv[2] || process.env.PORT || 8123);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
};

function contentType(path) {
  const dot = path.lastIndexOf('.');
  const ext = dot >= 0 ? path.slice(dot).toLowerCase() : '';
  return TYPES[ext] || 'application/octet-stream';
}

const server = createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { 'Content-Type': 'text/plain' });
    res.end('Method not allowed');
    return;
  }
  let pathname = '/';
  try {
    pathname = decodeURIComponent(new URL(req.url || '/', 'http://127.0.0.1').pathname);
  } catch {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end('Bad request');
    return;
  }
  if (pathname === '/') pathname = '/index.html';
  const file = normalize(join(ROOT, pathname));
  if (!file.startsWith(ROOT + sep) || !existsSync(file) || !statSync(file).isFile()) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
    return;
  }
  const size = statSync(file).size;
  res.writeHead(200, { 'Content-Type': contentType(file), 'Content-Length': size });
  if (req.method === 'GET') createReadStream(file).pipe(res);
  else res.end();
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('Serving app/ at http://127.0.0.1:' + PORT + '/');
});

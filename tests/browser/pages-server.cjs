// A tiny web server that behaves like GitHub Pages for the Stage 9 tests.
// Serves <dir> under <prefix> (default /ai-exam-survival; use / for a custom domain such as aiexamsurvival.com.tr).
// Any missing address gets 404.html with status 404 (as GitHub does).
// Usage: node pages-server.cjs <dir> <port> [prefix]
const http = require('http');
const fs = require('fs');
const path = require('path');

const DIR = path.resolve(process.argv[2]);
const PORT = Number(process.argv[3] || 4190);
const PREFIX = (process.argv[4] ?? '/ai-exam-survival').replace(/\/$/, '');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.txt': 'text/plain', '.png': 'image/png', '.ico': 'image/x-icon', '.json': 'application/json', '.woff2': 'font/woff2' };

function send(res, status, file) {
  res.writeHead(status, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}

http.createServer((req, res) => {
  const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const notFound = path.join(DIR, '404.html');
  if (PREFIX && urlPath === PREFIX) { res.writeHead(301, { Location: `${PREFIX}/` }); return res.end(); }
  if (!urlPath.startsWith(`${PREFIX}/`)) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('GitHub Pages: not found'); }
  let file = path.join(DIR, urlPath.slice(PREFIX.length));
  if (!file.startsWith(DIR)) { res.writeHead(400); return res.end(); }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (fs.existsSync(file)) return send(res, 200, file);
  if (fs.existsSync(notFound)) return send(res, 404, notFound);
  res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('GitHub Pages: not found');
}).listen(PORT, '127.0.0.1');

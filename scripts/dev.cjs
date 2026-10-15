const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const handler = require('../api/budget.js');
const root = path.resolve(__dirname, '..');
const allowed = { '/': ['index.html', 'text/html'], '/index.html': ['index.html', 'text/html'], '/app.js': ['app.js', 'text/javascript'], '/core.js': ['core.js', 'text/javascript'], '/styles.css': ['styles.css', 'text/css'] };
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/api/budget') {
    let raw = ''; let bytes = 0;
    req.on('data', chunk => { bytes += chunk.length; if (bytes <= 16000) raw += chunk; });
    req.on('end', () => {
      if (bytes > 16000) { res.writeHead(413, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ error: 'Request is too large.' })); }
      req.body = raw || undefined; handler(req, res);
    });
    return;
  }
  const asset = allowed[url.pathname];
  if (!asset) { res.writeHead(404); return res.end('Not found'); }
  res.writeHead(200, { 'Content-Type': asset[1] + '; charset=utf-8' });
  fs.createReadStream(path.join(root, asset[0])).pipe(res);
});
server.listen(process.env.PORT || 4317, '127.0.0.1', () => console.log('Teen Budgeting local server: http://127.0.0.1:' + server.address().port));

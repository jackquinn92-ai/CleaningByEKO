const http = require('http');
const { handleGuard } = require('./routes/guard');
const { handleAdmin } = require('./routes/admin');

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,x-admin-token');
}

const server = http.createServer(async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  const url = new URL(req.url, 'http://localhost');
  const path = url.pathname;
  const pathParts = path.split('/');

  if (path === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ ok: true }));
  }

  const guardHandled = await handleGuard(req, res, path);
  if (guardHandled) return;

  if (path.startsWith('/api/admin')) {
    const adminHandled = await handleAdmin(req, res, pathParts);
    if (adminHandled) return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ message: 'Not found' }));
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Cleaning by EKO API running on port ${port}`);
});

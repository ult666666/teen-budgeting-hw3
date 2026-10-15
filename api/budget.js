const { createBudgetService } = require('../lib/budget.cjs');
const service = createBudgetService();
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  try {
    const url = new URL(req.url, 'http://localhost');
    let body = req.method === 'GET' ? { displayName: url.searchParams.get('displayName') } : req.body;
    if (typeof body === 'string') body = JSON.parse(body);
    if (req.method === 'POST' && !String(req.headers['content-type'] || '').includes('application/json')) {
      res.statusCode = 415;
      return res.end(JSON.stringify({ error: 'Send JSON.' }));
    }
    if (JSON.stringify(body || {}).length > 16000) {
      res.statusCode = 413;
      return res.end(JSON.stringify({ error: 'Request is too large.' }));
    }
    const result = service.handle(req.method, body);
    res.statusCode = result.status;
    res.end(JSON.stringify(result.body));
  } catch (error) {
    res.statusCode = error instanceof SyntaxError ? 422 : 500;
    res.end(JSON.stringify({ error: res.statusCode === 422 ? 'Invalid JSON.' : 'The change was not saved. Please try again.' }));
  }
};

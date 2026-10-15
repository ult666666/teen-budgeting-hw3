const { randomUUID } = require('node:crypto');
const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Entertainment', 'Other'];
function validMoney(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0.01 && value <= 100000 && Math.abs(value * 100 - Math.round(value * 100)) < 1e-7;
}
function createBudgetService({ today = () => new Date().toISOString().slice(0, 10) } = {}) {
  // A homework demonstration only: typed names are not authenticated identities.
  const users = new Map();
  const epoch = randomUUID();
  function snapshot(user) {
    const spentCents = user.entries.reduce((n, e) => n + Math.round(e.amount * 100), 0);
    return { epoch, entries: user.entries.map(e => ({ ...e })), totals: { budget: user.budget, spent: spentCents / 100, remaining: (Math.round(user.budget * 100) - spentCents) / 100 } };
  }
  function validateEntry(body) {
    if (!validMoney(body.amount)) return 'Amount must be $0.01–$100,000, with at most two decimal places.';
    if (typeof body.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) return 'Enter a valid date, YYYY-MM-DD.';
    const date = new Date(body.date + 'T00:00:00.000Z');
    if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== body.date || body.date > today()) return 'Date must exist and cannot be in the future (UTC).';
    if (!CATEGORIES.includes(body.category)) return 'Choose one of the allowed categories.';
    for (const field of ['merchant', 'note']) {
      if (body[field] !== undefined && typeof body[field] !== 'string') return 'Merchant and note must be text.';
    }
    return null;
  }
  function handle(method, body = {}) {
    const fail = (status, error) => ({ status, body: { error } });
    if (!body || typeof body !== 'object' || Array.isArray(body)) return fail(422, 'Invalid request.');
    const name = typeof body.displayName === 'string' ? body.displayName.trim() : '';
    if (!name) return fail(401, 'Enter a made-up display name first.');
    if (!/^[A-Za-z0-9_-]{1,40}$/.test(name)) return fail(422, 'Use 1–40 letters, numbers, underscores or hyphens.');
    if (method !== 'GET' && method !== 'POST') return fail(405, 'Method not allowed.');
    if (method === 'POST' && body.action === 'start') {
      if (!users.has(name)) {
        if (users.size >= 1000) return fail(503, 'This classroom demo is full. Try again after a reset.');
        users.set(name, { budget: 0, entries: [] });
      }
      return { status: 200, body: snapshot(users.get(name)) };
    }
    const user = users.get(name);
    if (!user) return fail(409, 'Demo memory is empty. Reopen your demo.');
    if (method === 'GET') return { status: 200, body: snapshot(user) };
    if (body.epoch !== epoch) return fail(409, 'Server memory changed. Reopen your demo; this change was not saved.');
    if (body.action === 'budget') {
      if (!validMoney(body.amount)) return fail(422, 'Budget must be $0.01–$100,000, with at most two decimal places.');
      user.budget = Math.round(body.amount * 100) / 100;
    } else if (body.action === 'add' || body.action === 'edit') {
      const index = body.action === 'edit' ? user.entries.findIndex(e => e.id === body.id) : -1;
      if (body.action === 'edit' && index < 0) return fail(404, 'Entry not found.');
      const error = validateEntry(body);
      if (error) return fail(422, error);
      if (body.action === 'add' && user.entries.length >= 2000) return fail(422, 'This demo allows up to 2,000 entries.');
      const saved = { id: index < 0 ? randomUUID() : user.entries[index].id, amount: Math.round(body.amount * 100) / 100, date: body.date, category: body.category, merchant: body.merchant ?? '', note: body.note ?? '' };
      if (index < 0) user.entries.push(saved); else user.entries[index] = saved;
    } else if (body.action === 'delete') {
      const index = user.entries.findIndex(e => e.id === body.id);
      if (index < 0) return fail(404, 'Entry not found.');
      user.entries.splice(index, 1);
    } else {
      return fail(422, 'Unknown action.');
    }
    return { status: 200, body: snapshot(user) };
  }
  return { handle };
}
module.exports = { createBudgetService, CATEGORIES };

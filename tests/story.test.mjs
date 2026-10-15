import { beforeEach, expect, test } from 'vitest';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { createBudgetService } = require('../lib/budget.cjs');
let service;
let epoch;
const entry = { amount: 12.5, date: '2026-10-15', category: 'Food', merchant: 'Cafe', note: 'Lunch' };
function call(action, extra = {}, name = 'demo-maya') {
  return service.handle('POST', { displayName: name, epoch, action, ...extra });
}
beforeEach(() => {
  service = createBudgetService({ today: () => '2026-10-15' });
  epoch = call('start').body.epoch;
  call('budget', { amount: 100 });
});

test('a saved entry appears in history with amount date category merchant and note', () => {
  const r = call('add', entry);
  expect(r.status).toBe(200);
  expect(r.body.entries).toHaveLength(1);
  expect(r.body.entries[0]).toMatchObject(entry);
  expect(r.body.totals).toEqual({ budget: 100, spent: 12.5, remaining: 87.5 });
});
test('an entry can be saved without an optional merchant or note', () => {
  const r = call('add', { amount: 5, date: '2026-10-15', category: 'Transport' });
  expect(r.status).toBe(200);
  expect(r.body.entries[0]).toMatchObject({ merchant: '', note: '', amount: 5 });
});
test('editing an entry updates its fields and recalculates totals', () => {
  const first = call('add', entry);
  expect(first.status).toBe(200);
  const r = call('edit', { ...entry, id: first.body.entries[0].id, amount: 7.25, note: 'Corrected lunch' });
  expect(r.status).toBe(200);
  expect(r.body.entries).toHaveLength(1);
  expect(r.body.entries[0]).toMatchObject({ amount: 7.25, note: 'Corrected lunch' });
  expect(r.body.totals.spent).toBe(7.25);
  expect(r.body.totals.remaining).toBe(92.75);
});
test('deleting an entry removes it and updates the totals', () => {
  const first = call('add', entry);
  expect(first.status).toBe(200);
  const id = first.body.entries[0].id;
  call('add', { ...entry, amount: 4 });
  const r = call('delete', { id });
  expect(r.status).toBe(200);
  expect(r.body.entries).toHaveLength(1);
  expect(r.body.entries.some(x => x.id === id)).toBe(false);
  expect(r.body.totals).toEqual({ budget: 100, spent: 4, remaining: 96 });
});
test('a failed save leaves stored entries and totals unchanged', () => {
  expect(call('add', entry).status).toBe(200);
  const before = service.handle('GET', { displayName: 'demo-maya' }).body;
  expect(call('add', { ...entry, amount: -1 }).status).toBe(422);
  expect(service.handle('GET', { displayName: 'demo-maya' }).body).toEqual(before);
});
test('deleting a missing or different demo entry returns 404 without changing totals', () => {
  const first = call('add', entry);
  expect(first.status).toBe(200);
  call('start', {}, 'demo-jordan');
  expect(call('delete', { id: first.body.entries[0].id }, 'demo-jordan').status).toBe(404);
  expect(call('delete', { id: 'missing' }).status).toBe(404);
  expect(service.handle('GET', { displayName: 'demo-maya' }).body.totals.spent).toBe(12.5);
});
test('the server ignores a total sent by the browser', () => {
  const r = call('add', { ...entry, total: -999, spent: 0, remaining: 1000000 });
  expect(r.status).toBe(200);
  expect(r.body.totals).toEqual({ budget: 100, spent: 12.5, remaining: 87.5 });
});
test('a missing display name receives 401 and no spending data', () => {
  const r = service.handle('GET', {});
  expect(r.status).toBe(401);
  expect(r.body.entries).toBeUndefined();
});
test('a changed server instance refuses a stale write rather than claiming it saved', () => {
  const r = call('add', { ...entry, epoch: 'old-instance' });
  expect(r.status).toBe(409);
  expect(service.handle('GET', { displayName: 'demo-maya' }).body.entries).toHaveLength(0);
});

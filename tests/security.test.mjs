import { beforeEach, expect, test } from 'vitest';
import { createRequire } from 'node:module';
const { createBudgetService } = createRequire(import.meta.url)('../lib/budget.cjs');
let service, epoch;
const entry = { amount: 12.5, date: '2026-10-15', category: 'Food', merchant: 'Cafe', note: 'Lunch' };
function call(action, data = {}) { return service.handle('POST', { displayName: 'demo-maya', epoch, action, ...data }); }
beforeEach(() => {
  service = createBudgetService({ today: () => '2026-10-15' });
  epoch = call('start').body.epoch;
  call('budget', { amount: 100 });
});
for (const field of ['merchant', 'note']) {
  test(`the server accepts a ${field} of exactly 200 characters`, () => {
    const r = call('add', { ...entry, [field]: 'x'.repeat(200) });
    expect(r.status).toBe(200);
    expect(r.body.entries[0][field]).toHaveLength(200);
  });
  test(`the server rejects a 201-character ${field} before saving`, () => {
    const r = call('add', { ...entry, [field]: 'x'.repeat(201) });
    expect(r.status).toBe(422);
    expect(service.handle('GET', { displayName: 'demo-maya' }).body.entries).toHaveLength(0);
  });
}
test('an overlong edited note is rejected without replacing the existing entry', () => {
  const original = call('add', entry).body;
  expect(call('edit', { ...entry, id: original.entries[0].id, note: 'x'.repeat(201) }).status).toBe(422);
  expect(service.handle('GET', { displayName: 'demo-maya' }).body).toEqual(original);
});
for (const value of [0, -1, 100000.01, '12.50', 'abc', null, Infinity, NaN, 0.001]) {
  test(`the server rejects invalid amount ${String(value)} (${typeof value})`, () => {
    expect(call('add', { ...entry, amount: value }).status).toBe(422);
  });
}
for (const value of [0.01, 100000]) {
  test(`the server accepts the amount boundary ${value}`, () => { expect(call('add', { ...entry, amount: value }).status).toBe(200); });
}
for (const value of ['2026-10-16', '2026-02-30', 'not-a-date']) {
  test(`the server rejects invalid or future date ${value}`, () => { expect(call('add', { ...entry, date: value }).status).toBe(422); });
}
test('the server accepts today and a valid leap day', () => {
  expect(call('add', entry).status).toBe(200);
  expect(call('add', { ...entry, date: '2024-02-29' }).status).toBe(200);
});
test('the server rejects an unlisted category', () => { expect(call('add', { ...entry, category: 'Unlisted' }).status).toBe(422); });
test('the server rejects non-text notes and merchants', () => {
  expect(call('add', { ...entry, note: {} }).status).toBe(422);
  expect(call('add', { ...entry, merchant: 2 }).status).toBe(422);
});

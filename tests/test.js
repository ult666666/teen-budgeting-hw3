const assert = require("assert");
const { parseMoney, calculateTotals } = require("../core.js");

assert.strictEqual(parseMoney("500"), 500);
assert.strictEqual(parseMoney("12.50"), 12.5);
assert.strictEqual(parseMoney("0"), null);
assert.strictEqual(parseMoney("-4"), null);
assert.strictEqual(parseMoney("abc"), null);
assert.strictEqual(parseMoney(""), null);

const totals = calculateTotals(500, [
  { description: "Lunch", amount: 12.5 },
  { description: "Bus", amount: 7.25 }
]);
assert.deepStrictEqual(totals, { spent: 19.75, remaining: 480.25 });

const over = calculateTotals(20, [{ description: "Book", amount: 25 }]);
assert.deepStrictEqual(over, { spent: 25, remaining: -5 });

console.log("PASS: 8 automated checks");

(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.BudgetCore = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  function parseMoney(value) {
    if (value === null || String(value).trim() === "") return null;
    const number = Number(value);
    if (!Number.isFinite(number) || number <= 0) return null;
    return Math.round(number * 100) / 100;
  }

  function calculateTotals(budget, expenses) {
    const spent = Math.round(expenses.reduce((sum, item) => sum + item.amount, 0) * 100) / 100;
    const remaining = Math.round((budget - spent) * 100) / 100;
    return { spent, remaining };
  }

  return { parseMoney, calculateTotals };
});

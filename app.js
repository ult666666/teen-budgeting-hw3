const state = { budget: 0, expenses: [] };

const budgetForm = document.querySelector("#budget-form");
const expenseForm = document.querySelector("#expense-form");
const budgetInput = document.querySelector("#budget-input");
const descriptionInput = document.querySelector("#description-input");
const amountInput = document.querySelector("#amount-input");
const budgetError = document.querySelector("#budget-error");
const expenseError = document.querySelector("#expense-error");
const expenseList = document.querySelector("#expense-list");
const itemCount = document.querySelector("#item-count");

const money = value => new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD"
}).format(value);

function render() {
  const totals = BudgetCore.calculateTotals(state.budget, state.expenses);
  document.querySelector("#budget-total").textContent = money(state.budget);
  document.querySelector("#spent-total").textContent = money(totals.spent);
  const remaining = document.querySelector("#remaining-total");
  remaining.textContent = money(totals.remaining);
  remaining.classList.toggle("negative", totals.remaining < 0);

  expenseList.replaceChildren();
  if (state.expenses.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty";
    empty.textContent = "No expenses yet.";
    expenseList.append(empty);
  } else {
    state.expenses.forEach(item => {
      const row = document.createElement("li");
      const description = document.createElement("span");
      const amount = document.createElement("strong");
      description.textContent = item.description;
      amount.textContent = money(item.amount);
      row.append(description, amount);
      expenseList.append(row);
    });
  }
  itemCount.textContent = `${state.expenses.length} ${state.expenses.length === 1 ? "item" : "items"}`;
}

budgetForm.addEventListener("submit", event => {
  event.preventDefault();
  const value = BudgetCore.parseMoney(budgetInput.value);
  if (value === null) {
    budgetError.textContent = "Enter a budget greater than $0.";
    return;
  }
  state.budget = value;
  budgetError.textContent = "";
  render();
});

expenseForm.addEventListener("submit", event => {
  event.preventDefault();
  const description = descriptionInput.value.trim();
  const amount = BudgetCore.parseMoney(amountInput.value);
  if (!description || amount === null) {
    expenseError.textContent = "Enter a description and an amount greater than $0.";
    return;
  }
  state.expenses.push({ description, amount });
  descriptionInput.value = "";
  amountInput.value = "";
  expenseError.textContent = "";
  render();
});

render();

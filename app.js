// The static October 1 page is reused; all user text is inserted with textContent.
const $ = selector => document.querySelector(selector);
const money = value => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
const state = { name: '', epoch: '', entries: [], totals: { budget: 0, spent: 0, remaining: 0 }, editing: null, busy: false };
function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}
function field(text, id, type = 'text') {
  const label = element('label', undefined, 'field');
  label.append(element('span', text));
  const input = element('input'); input.id = id; input.type = type;
  label.append(input); return label;
}
$('.subtitle').textContent = 'Practice with fictional money. Edit or remove mistakes.';
const notice = element('aside', 'Fictional data only. A demo name is not a private account: anyone using the same name sees that demo. Temporary server-memory data resets on deployment, restart or instance change. Never enter real names or spending.', 'notice');
$('header').after(notice);
const demoCard = element('section', undefined, 'card');
demoCard.append(element('h2', 'Open a practice budget'));
const demoForm = element('form', undefined, 'row'); demoForm.id = 'demo-form';
demoForm.append(field('Made-up display name', 'display-name'));
const openButton = element('button', 'Open demo'); demoForm.append(openButton);
const demoStatus = element('p', 'Use a unique made-up name, such as demo-maya-42.', 'hint'); demoStatus.id = 'demo-status'; demoStatus.setAttribute('aria-live', 'polite');
demoCard.append(demoForm, demoStatus); notice.after(demoCard);
$('#display-name').maxLength = 40; $('#display-name').required = true; $('#display-name').autocomplete = 'off';
$('#description-input').closest('label').querySelector('span').textContent = 'Note (optional)';
$('#description-input').maxLength = 200; $('#description-input').placeholder = 'Practice lunch';
$('#amount-input').required = true; $('#amount-input').max = '100000'; $('#budget-input').required = true; $('#budget-input').max = '100000';
const expenseForm = $('#expense-form');
expenseForm.className = 'entry-grid';
const saveButton = expenseForm.querySelector('button'); saveButton.id = 'save-entry'; saveButton.textContent = 'Add entry';
const dateField = field('Date (UTC)', 'date-input', 'date');
const merchantField = field('Merchant (optional)', 'merchant-input');
const categoryLabel = element('label', undefined, 'field'); categoryLabel.append(element('span', 'Category'));
const category = element('select'); category.id = 'category-input'; category.required = true;
for (const name of ['', 'Food', 'Transport', 'Shopping', 'Entertainment', 'Other']) { const option = element('option', name || 'Choose a category'); option.value = name; category.append(option); }
categoryLabel.append(category);
saveButton.before(dateField, categoryLabel, merchantField);
$('#date-input').required = true; $('#date-input').value = new Date().toISOString().slice(0, 10); $('#date-input').max = $('#date-input').value;
$('#merchant-input').maxLength = 200;
const cancelButton = element('button', 'Cancel edit', 'secondary'); cancelButton.type = 'button'; cancelButton.hidden = true; cancelButton.id = 'cancel-edit'; saveButton.after(cancelButton);
const historyStatus = element('p', '', 'hint'); historyStatus.id = 'history-status'; historyStatus.setAttribute('aria-live', 'polite'); $('#expense-list').after(historyStatus);
const overBudget = element('p', '', 'hint'); overBudget.id = 'over-budget'; $('.summary').after(overBudget);
const footer = element('footer', 'Starter C - 70-445 HW3. General education only. No real payments, database, sign-in provider or model calls.'); $('.shell').append(footer);
function setBusy(value) {
  state.busy = value;
  document.querySelectorAll('button').forEach(b => { b.disabled = value || (!state.name && b !== openButton); });
}
async function request(action, data = {}) {
  if (state.busy) return false;
  setBusy(true);
  try {
    const response = await fetch('/api/budget', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ displayName: state.name, epoch: state.epoch, action, ...data }) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'The change was not saved.');
    state.epoch = result.epoch; state.entries = result.entries; state.totals = result.totals; render(); return true;
  } finally { setBusy(false); }
}
function resetEditor() {
  state.editing = null; expenseForm.reset(); $('#date-input').value = new Date().toISOString().slice(0, 10);
  $('#expense-title').textContent = 'Add a practice entry'; saveButton.textContent = 'Add entry'; cancelButton.hidden = true;
}
function render() {
  $('#budget-total').textContent = money(state.totals.budget); $('#spent-total').textContent = money(state.totals.spent); $('#remaining-total').textContent = money(state.totals.remaining);
  $('#remaining-total').classList.toggle('negative', state.totals.remaining < 0);
  overBudget.textContent = state.totals.remaining < 0 ? 'Practice spending is above the budget. Review your entries or adjust your plan.' : '';
  const list = $('#expense-list'); list.replaceChildren();
  if (!state.entries.length) list.append(element('li', 'No entries yet.', 'empty'));
  for (const item of state.entries) {
    const row = element('li'); const details = element('div', undefined, 'entry-details');
    details.append(element('strong', item.merchant || item.category), element('span', `${item.date} - ${item.category}`, 'hint'));
    if (item.note) details.append(element('span', item.note));
    const actions = element('div', undefined, 'entry-actions'); actions.append(element('strong', money(item.amount)));
    const edit = element('button', 'Edit', 'secondary'); edit.type = 'button'; edit.setAttribute('aria-label', `Edit ${item.merchant || item.category}`);
    edit.addEventListener('click', () => {
      state.editing = item.id; $('#amount-input').value = item.amount; $('#date-input').value = item.date; category.value = item.category; $('#merchant-input').value = item.merchant; $('#description-input').value = item.note;
      $('#expense-title').textContent = 'Edit practice entry'; saveButton.textContent = 'Save changes'; cancelButton.hidden = false; $('#amount-input').focus();
    });
    const remove = element('button', 'Delete', 'secondary'); remove.type = 'button'; remove.setAttribute('aria-label', `Delete ${item.merchant || item.category}`);
    remove.addEventListener('click', async () => {
      if (state.busy || !confirm('Delete this fictional entry?')) return;
      try { if (await request('delete', { id: item.id })) { historyStatus.textContent = 'Entry deleted; totals recalculated.'; if (state.editing === item.id) resetEditor(); } }
      catch (error) { historyStatus.textContent = error.message; }
    });
    actions.append(edit, remove); row.append(details, actions); list.append(row);
  }
  $('#item-count').textContent = `${state.entries.length} ${state.entries.length === 1 ? 'entry' : 'entries'}`;
}
demoForm.addEventListener('submit', async event => {
  event.preventDefault(); const previous = state.name; const name = $('#display-name').value.trim(); state.name = name;
  try { if (await request('start')) { resetEditor(); demoStatus.textContent = `Open: ${name}. Fictional data only; this is not authentication.`; } }
  catch (error) { state.name = previous; demoStatus.textContent = error.message; setBusy(false); }
});
$('#budget-form').addEventListener('submit', async event => {
  event.preventDefault(); $('#budget-error').textContent = '';
  try { await request('budget', { amount: Number($('#budget-input').value) }); } catch (error) { $('#budget-error').textContent = error.message; }
});
expenseForm.addEventListener('submit', async event => {
  event.preventDefault(); $('#expense-error').textContent = '';
  const action = state.editing ? 'edit' : 'add';
  try {
    const ok = await request(action, { id: state.editing, amount: Number($('#amount-input').value), date: $('#date-input').value, category: category.value, merchant: $('#merchant-input').value, note: $('#description-input').value });
    if (ok) { historyStatus.textContent = action === 'edit' ? 'Entry updated; totals recalculated.' : 'Entry saved in temporary server memory.'; resetEditor(); }
  } catch (error) { $('#expense-error').textContent = error.message; }
});
cancelButton.addEventListener('click', resetEditor);
render(); setBusy(false);

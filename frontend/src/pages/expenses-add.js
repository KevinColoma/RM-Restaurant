import { registerRoute } from '../router.js';
import { renderLayout } from '../components/Header.js';
import { post } from '../lib/api.js';
import { navigateTo } from '../lib/listPage.js';
import { setBusy, validate, clearErrorsOnInput } from '../lib/formFeedback.js';
import { notifySuccess, notifyError } from '../lib/notify.js';

registerRoute('/expenses-add', async (app) => {
  app.innerHTML = '<div class="main-wrapper"><div id="global-loader"><div class="whirly-loader"></div></div></div>';

  const html = `
<div class="page-wrapper">
<div class="content">
<div class="page-header">
<div class="page-title">
<h4>Expense Add</h4>
<h6>Add/Update Expenses</h6>
</div>
</div>
<div class="card">
<div class="card-body">
<form id="add-expense-form">
<div class="row">
<div class="col-lg-3 col-sm-6 col-12">
<div class="form-group">
<label for="category">Expense Category</label>
<select class="form-control" id="category" required>
<option value="" disabled selected> expense category</option>
<option value="supplies">Supplies</option>
<option value="salaries">Salaries</option>
<option value="utilities">Utilities</option>
<option value="rent">Rent/Mortgage</option>
<option value="insurance">Insurance</option>
<option value="depreciation">Depreciation</option>
<option value="labor">Labor Costs</option>
<option value="marketing">Marketing and Advertising</option>
<option value="maintenance">Maintenance and Repairs</option>
<option value="technology">Technology</option>
<option value="licenses">Licenses and Permits</option>
<option value="miscellaneous">Miscellaneous</option>
</select>
</div>
</div>
<div class="col-lg-3 col-sm-6 col-12">
<div class="form-group">
<label for="expenseDate">Expense Date</label>
<input type="date" id="expenseDate" class="form-control" required>
</div>
</div>
<div class="col-lg-3 col-sm-6 col-12">
<div class="form-group">
<label for="amount">Amount</label>
<input type="number" id="amount" class="form-control" step="0.01" min="0.01" required>
</div>
</div>
<div class="col-lg-3 col-sm-6 col-12">
<div class="form-group">
<label for="paymentMethod">Payment Method</label>
<select class="form-control" id="paymentMethod" required>
<option value="">Select Payment Method</option>
<option value="cash">Cash</option>
<option value="credit card">Credit Card</option>
<option value="bank transfer">Bank Transfer</option>
<option value="other">Other</option>
</select>
</div>
</div>
<div class="col-lg-3 col-sm-6 col-12">
<div class="form-group">
<label for="invoiceNumber">Invoice Number / Reference</label>
<input type="text" id="invoiceNumber" class="form-control">
</div>
</div>
<div class="col-lg-12">
<div class="form-group">
<label for="vendor">Expense for (vendor/employee)</label>
<input type="text" id="vendor" class="form-control">
</div>
</div>
<div class="col-lg-12">
<div class="form-group">
<label for="description">Description</label>
<textarea class="form-control" id="description"></textarea>
</div>
</div>
<div class="col-lg-12">
<button type="submit" class="btn btn-submit me-2">Submit</button>
<a href="#/expenses-list" class="btn btn-cancel">Cancel</a>
</div>
</div>
</form>
</div>
</div>
</div>
</div>`;

  renderLayout(app, 'expenses-add', html);

  const form = document.getElementById('add-expense-form');
  clearErrorsOnInput(form);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const amountValue = Number(document.getElementById('amount').value);
    const category = document.getElementById('category').value;
    const expenseDate = document.getElementById('expenseDate').value;
    const description = document.getElementById('description').value.trim();

    const ok = validate(form, [
      { field: 'category', valid: !!category, message: 'Choose an expense category.' },
      { field: 'expenseDate', valid: !!expenseDate, message: 'Pick the date of the expense.' },
      { field: 'amount', valid: !isNaN(amountValue) && amountValue > 0, message: 'Enter an amount greater than zero.' },
      { field: 'description', valid: !!description, message: 'Describe what this expense was for.' }
    ]);
    if (!ok) return;

    const data = {
      category,
      expenseDate,
      amount: amountValue,
      paymentMethod: document.getElementById('paymentMethod').value,
      invoiceNumber: document.getElementById('invoiceNumber').value,
      vendor: document.getElementById('vendor').value,
      description
    };

    const done = setBusy(e.submitter || form.querySelector('[type="submit"]'), 'Saving expense...');
    try {
      await post('/expenses', data);
      await notifySuccess('Expense of ' + amountValue.toFixed(2) + ' saved.', 'Expense added');
      navigateTo('#/expenses-list');
    } catch (err) {
      done();
      notifyError(err.message || 'Failed to add expense.');
    }
  });
});

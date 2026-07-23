import { registerRoute } from '../router.js';
import { renderLayout } from '../components/Header.js';
import { get, put } from '../lib/api.js';
import { navigateTo } from '../lib/listPage.js';
import { setBusy } from '../lib/formFeedback.js';

registerRoute('/expenses-edit/', async (app) => {
  app.innerHTML = '<div class="main-wrapper"><div id="global-loader"><div class="whirly-loader"></div></div></div>';

  const id = window.location.hash.replace('#/expenses-edit/', '');
  if (!id) {
    app.innerHTML = '<div class="page-wrapper"><div class="content"><p class="text-danger">Invalid expense ID.</p></div></div>';
    return;
  }

  try {
    const res = await get('/expenses/edit/' + id);
    const expense = res?.expense || res;
    if (!expense) {
      app.innerHTML = '<div class="page-wrapper"><div class="content"><p class="text-danger">Expense not found.</p></div></div>';
      return;
    }

    const expenseDate = expense.expenseDate ? expense.expenseDate.split('T')[0] : '';
    const catOptions = ['supplies', 'salaries', 'utilities', 'rent', 'insurance', 'depreciation', 'labor', 'marketing', 'maintenance', 'technology', 'licenses', 'miscellaneous'].map(c =>
      `<option value="${c}"${expense.category === c ? ' selected' : ''}>${c.charAt(0).toUpperCase() + c.slice(1)}</option>`
    ).join('');
    const pmOptions = ['cash', 'credit card', 'bank transfer', 'other'].map(p =>
      `<option value="${p}"${expense.paymentMethod === p ? ' selected' : ''}>${p.charAt(0).toUpperCase() + p.slice(1)}</option>`
    ).join('');

    const html = `
<div class="page-wrapper">
<div class="content">
<div class="page-header">
<div class="page-title">
<h4 data-i18n="expense.edit_title">Edit Expense</h4>
<h6 data-i18n="expense.edit_sub">Update expense details</h6>
</div>
</div>
<div class="card">
<div class="card-body">
<form id="edit-expense-form">
<div class="row">
<div class="col-lg-3 col-sm-6 col-12">
<div class="form-group">
<label for="category" data-i18n="expense.choose_category">Expense Category</label>
<select class="form-control" id="category" required>
<option value="" disabled>expense category</option>
${catOptions}
</select>
</div>
</div>
<div class="col-lg-3 col-sm-6 col-12">
<div class="form-group">
<label for="expenseDate" data-i18n="form.expense_date">Expense Date</label>
<input type="date" id="expenseDate" class="form-control" value="${expenseDate}" required>
</div>
</div>
<div class="col-lg-3 col-sm-6 col-12">
<div class="form-group">
<label for="amount" data-i18n="form.amount">Amount</label>
<input type="number" id="amount" class="form-control" step="0.01" min="0.01" value="${expense.amount || 0}" required>
</div>
</div>
<div class="col-lg-3 col-sm-6 col-12">
<div class="form-group">
<label for="paymentMethod" data-i18n="expense.payment_method">Payment Method</label>
<select class="form-control" id="paymentMethod" required>
<option value="" data-i18n-value="expense.select_payment">Select Payment Method</option>
${pmOptions}
</select>
</div>
</div>
<div class="col-lg-3 col-sm-6 col-12">
<div class="form-group">
<label for="invoiceNumber" data-i18n="expense.invoice_number">Invoice Number / Reference</label>
<input type="text" id="invoiceNumber" class="form-control" value="${expense.invoiceNumber || ''}">
</div>
</div>
<div class="col-lg-12">
<div class="form-group">
<label for="vendor" data-i18n="expense.vendor_label">Expense for (vendor/employee)</label>
<input type="text" id="vendor" class="form-control" value="${expense.vendor || ''}">
</div>
</div>
<div class="col-lg-12">
<div class="form-group">
<label for="description" data-i18n="form.description">Description</label>
<textarea class="form-control" id="description">${expense.description || ''}</textarea>
</div>
</div>
<div class="col-lg-12">
<button type="submit" class="btn btn-submit me-2" data-i18n="common.update">Update</button>
<a href="#/expenses-list" class="btn btn-cancel" data-i18n="form.cancel">Cancel</a>
</div>
</div>
</form>
</div>
</div>
</div>
</div>`;

    renderLayout(app, 'expenses-edit', html);

    document.getElementById('edit-expense-form').addEventListener('submit', async (e) => {
      e.preventDefault();

      const amountValue = Number(document.getElementById('amount').value);
      if (isNaN(amountValue) || amountValue <= 0) {
        Swal.fire(window.t('common.error'), window.t('expense.amount_invalid'), 'error');
        return;
      }

      const data = {
        category: document.getElementById('category').value,
        expenseDate: document.getElementById('expenseDate').value,
        amount: amountValue,
        paymentMethod: document.getElementById('paymentMethod').value,
        invoiceNumber: document.getElementById('invoiceNumber').value,
        vendor: document.getElementById('vendor').value,
        description: document.getElementById('description').value
      };
      const done = setBusy(e.submitter || e.target.querySelector('[type="submit"]'), window.t('expense.updating'));
      try {
        await put('/expenses/' + id, data);
        Swal.fire(window.t('common.success'), window.t('expense.updated'), 'success')
          .then(() => navigateTo('#/expenses-list'));
      } catch (err) {
        done();
        Swal.fire(window.t('common.error'), err.message || window.t('expense.failed_update'), 'error');
      }
    });
  } catch (err) {
    app.innerHTML = `<div class="page-wrapper"><div class="content"><p class="text-danger">Failed to load: ${err.message}</p></div></div>`;
  }
});

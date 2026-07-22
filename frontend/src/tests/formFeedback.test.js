import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  setBusy, showFieldError, clearFieldError, clearAllErrors, validate, clearErrorsOnInput
} from '../lib/formFeedback.js';

let form;

beforeEach(() => {
  document.body.innerHTML = `
    <form id="f">
      <input id="name" type="text">
      <input id="amount" type="number">
      <button type="submit" id="save">Save</button>
    </form>`;
  form = document.getElementById('f');
});

describe('setBusy', () => {
  it('disables the button and says what it is doing', () => {
    const btn = document.getElementById('save');
    setBusy(btn, 'Saving expense...');

    expect(btn.disabled).toBe(true);
    expect(btn.getAttribute('aria-busy')).toBe('true');
    expect(btn.textContent).toContain('Saving expense...');
  });

  it('restores the original label and enabled state', () => {
    const btn = document.getElementById('save');
    const done = setBusy(btn);
    done();

    expect(btn.disabled).toBe(false);
    expect(btn.hasAttribute('aria-busy')).toBe(false);
    expect(btn.textContent).toBe('Save');
  });

  it('leaves an already-disabled button disabled when restoring', () => {
    // A button disabled for another reason must not be enabled by us.
    const btn = document.getElementById('save');
    btn.disabled = true;

    setBusy(btn)();

    expect(btn.disabled).toBe(true);
  });

  it('does nothing and stays safe when there is no button', () => {
    expect(() => setBusy(null)()).not.toThrow();
  });
});

describe('field errors', () => {
  it('marks the field and shows the reason beneath it', () => {
    showFieldError('amount', 'Enter an amount greater than zero.');

    const field = document.getElementById('amount');
    const msg = document.getElementById('amount-error');

    expect(field.classList.contains('is-invalid')).toBe(true);
    expect(field.getAttribute('aria-invalid')).toBe('true');
    expect(msg.textContent).toBe('Enter an amount greater than zero.');
    // The link is what makes a screen reader read the message on focus.
    expect(field.getAttribute('aria-describedby')).toBe('amount-error');
  });

  it('replaces the message instead of stacking a second one', () => {
    showFieldError('amount', 'First problem');
    showFieldError('amount', 'Second problem');

    expect(document.querySelectorAll('.invalid-feedback')).toHaveLength(1);
    expect(document.getElementById('amount-error').textContent).toBe('Second problem');
  });

  it('accepts an element as well as an id', () => {
    showFieldError(document.getElementById('name'), 'Required');
    expect(document.getElementById('name-error').textContent).toBe('Required');
  });

  it('removes the mark, the link and the message when cleared', () => {
    showFieldError('amount', 'Bad');
    clearFieldError('amount');

    const field = document.getElementById('amount');
    expect(field.classList.contains('is-invalid')).toBe(false);
    expect(field.hasAttribute('aria-invalid')).toBe(false);
    expect(field.hasAttribute('aria-describedby')).toBe(false);
    expect(document.getElementById('amount-error')).toBeNull();
  });

  it('clears every field at once', () => {
    showFieldError('name', 'A');
    showFieldError('amount', 'B');

    clearAllErrors(form);

    expect(document.querySelectorAll('.is-invalid')).toHaveLength(0);
  });

  it('ignores unknown fields rather than throwing', () => {
    expect(() => showFieldError('nope', 'x')).not.toThrow();
    expect(() => clearFieldError('nope')).not.toThrow();
    expect(() => clearAllErrors(null)).not.toThrow();
  });
});

describe('validate', () => {
  it('passes when every rule holds', () => {
    const ok = validate(form, [
      { field: 'name', valid: true, message: 'x' },
      { field: 'amount', valid: true, message: 'y' }
    ]);

    expect(ok).toBe(true);
    expect(document.querySelectorAll('.is-invalid')).toHaveLength(0);
  });

  it('reports only the first failure and focuses it', () => {
    // Rules are given in field order, so the user is sent to the earliest
    // problem rather than the last one checked.
    const ok = validate(form, [
      { field: 'name', valid: false, message: 'Name is required.' },
      { field: 'amount', valid: false, message: 'Amount is required.' }
    ]);

    expect(ok).toBe(false);
    expect(document.getElementById('name-error').textContent).toBe('Name is required.');
    expect(document.getElementById('amount-error')).toBeNull();
    expect(document.activeElement.id).toBe('name');
  });

  it('clears previous errors on each run', () => {
    validate(form, [{ field: 'name', valid: false, message: 'First' }]);
    validate(form, [{ field: 'amount', valid: false, message: 'Second' }]);

    expect(document.getElementById('name-error')).toBeNull();
    expect(document.getElementById('amount-error').textContent).toBe('Second');
  });
});

describe('clearErrorsOnInput', () => {
  it('clears a field error as soon as the user edits it', () => {
    clearErrorsOnInput(form);
    showFieldError('amount', 'Bad');

    const field = document.getElementById('amount');
    field.dispatchEvent(new Event('input', { bubbles: true }));

    expect(field.classList.contains('is-invalid')).toBe(false);
    expect(document.getElementById('amount-error')).toBeNull();
  });

  it('leaves untouched fields alone', () => {
    clearErrorsOnInput(form);
    showFieldError('amount', 'Bad');

    document.getElementById('name').dispatchEvent(new Event('input', { bubbles: true }));

    expect(document.getElementById('amount-error')).not.toBeNull();
  });

  it('does nothing without a form', () => {
    expect(() => clearErrorsOnInput(null)).not.toThrow();
  });
});

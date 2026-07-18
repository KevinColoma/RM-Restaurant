/**
 * @jest-environment jsdom
 */
const {
  disableSubmit,
  enableSubmit,
  showFieldError,
  clearFieldError,
  clearAllErrors
} = require('../public/assets/js/form-utils.js');

describe('form-utils.js', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <form id="test-form">
        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" id="email" class="form-control">
        </div>
        <div class="form-group">
          <label for="amount">Amount</label>
          <input type="number" id="amount" class="form-control" min="0.01">
        </div>
        <button type="submit" id="submit-btn" class="btn btn-primary">Submit</button>
      </form>
    `;
  });

  describe('disableSubmit', () => {
    it('disables the button and marks it as loading/busy', () => {
      const btn = document.getElementById('submit-btn');
      btn.textContent = 'Submit';

      const originalText = disableSubmit(btn);

      expect(btn.disabled).toBe(true);
      expect(btn.classList.contains('btn-loading')).toBe(true);
      expect(btn.getAttribute('aria-busy')).toBe('true');
      expect(originalText).toBe('Submit');
    });

    it('injects a spinner into the button while preserving the original text', () => {
      const btn = document.getElementById('submit-btn');
      btn.textContent = 'Save changes';

      disableSubmit(btn);

      expect(btn.innerHTML).toContain('spinner-sm');
      expect(btn.innerHTML).toContain('Save changes');
    });
  });

  describe('enableSubmit', () => {
    it('re-enables the button and clears loading state', () => {
      const btn = document.getElementById('submit-btn');
      disableSubmit(btn);

      enableSubmit(btn, 'Submit');

      expect(btn.disabled).toBe(false);
      expect(btn.classList.contains('btn-loading')).toBe(false);
      expect(btn.getAttribute('aria-busy')).toBeNull();
      expect(btn.textContent).toBe('Submit');
    });

    it('defaults to "Submit" when no original text is given', () => {
      const btn = document.getElementById('submit-btn');

      enableSubmit(btn);

      expect(btn.textContent).toBe('Submit');
    });
  });

  describe('showFieldError', () => {
    it('marks the field invalid and appends an error message', () => {
      showFieldError('email', 'Email is required');

      const field = document.getElementById('email');
      const errorEl = field.parentElement.querySelector('.invalid-feedback');

      expect(field.classList.contains('is-invalid')).toBe(true);
      expect(field.getAttribute('aria-invalid')).toBe('true');
      expect(errorEl).not.toBeNull();
      expect(errorEl.textContent).toBe('Email is required');
    });

    it('reuses the existing error element instead of duplicating it', () => {
      showFieldError('email', 'First error');
      showFieldError('email', 'Second error');

      const field = document.getElementById('email');
      const errorEls = field.parentElement.querySelectorAll('.invalid-feedback');

      expect(errorEls.length).toBe(1);
      expect(errorEls[0].textContent).toBe('Second error');
    });

    it('does nothing when the field does not exist', () => {
      expect(() => showFieldError('nonexistent', 'msg')).not.toThrow();
    });
  });

  describe('clearFieldError', () => {
    it('removes the invalid state and error message', () => {
      showFieldError('email', 'Invalid');
      clearFieldError('email');

      const field = document.getElementById('email');
      expect(field.classList.contains('is-invalid')).toBe(false);
      expect(field.getAttribute('aria-invalid')).toBeNull();
      expect(field.parentElement.querySelector('.invalid-feedback')).toBeNull();
    });

    it('does nothing when the field has no error', () => {
      expect(() => clearFieldError('amount')).not.toThrow();
    });

    it('does nothing when the field does not exist', () => {
      expect(() => clearFieldError('nonexistent')).not.toThrow();
    });
  });

  describe('clearAllErrors', () => {
    it('clears every invalid field within the form', () => {
      showFieldError('email', 'Email error');
      showFieldError('amount', 'Amount error');

      clearAllErrors(document.getElementById('test-form'));

      expect(document.getElementById('email').classList.contains('is-invalid')).toBe(false);
      expect(document.getElementById('amount').classList.contains('is-invalid')).toBe(false);
      expect(document.querySelectorAll('.invalid-feedback').length).toBe(0);
    });

    it('is a no-op when there are no invalid fields', () => {
      expect(() => clearAllErrors(document.getElementById('test-form'))).not.toThrow();
    });
  });
});

const { JSDOM } = require('jsdom');

describe('Form Utilities', () => {
  let dom;
  let document;
  let window;

  beforeEach(() => {
    // Setup DOM environment
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
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
        </body>
      </html>
    `);

    window = dom.window;
    document = window.document;
    global.document = document;
    global.window = window;

    // Load form utilities functions
    eval(require('fs').readFileSync(
      require('path').join(__dirname, '../public/assets/js/form-utils.js'),
      'utf8'
    ));
  });

  afterEach(() => {
    delete global.document;
    delete global.window;
  });

  describe('disableSubmit', () => {
    it('should disable submit button and add loading class', () => {
      const btn = document.getElementById('submit-btn');
      btn.textContent = 'Submit';

      const originalText = disableSubmit(btn);

      expect(btn.disabled).toBe(true);
      expect(btn.classList.contains('btn-loading')).toBe(true);
      expect(btn.getAttribute('aria-busy')).toBe('true');
      expect(originalText).toBe('Submit');
    });

    it('should add spinner to button', () => {
      const btn = document.getElementById('submit-btn');
      btn.textContent = 'Submit';

      disableSubmit(btn);

      expect(btn.innerHTML).toContain('spinner-sm');
    });
  });

  describe('enableSubmit', () => {
    it('should enable submit button and remove loading class', () => {
      const btn = document.getElementById('submit-btn');
      btn.disabled = true;
      btn.classList.add('btn-loading');
      btn.setAttribute('aria-busy', 'true');

      enableSubmit(btn, 'Submit');

      expect(btn.disabled).toBe(false);
      expect(btn.classList.contains('btn-loading')).toBe(false);
      expect(btn.getAttribute('aria-busy')).toBeNull();
      expect(btn.textContent).toBe('Submit');
    });
  });

  describe('showFieldError', () => {
    it('should add invalid class to field', () => {
      const field = document.getElementById('email');

      showFieldError('email', 'Email is required');

      expect(field.classList.contains('is-invalid')).toBe(true);
      expect(field.getAttribute('aria-invalid')).toBe('true');
    });

    it('should create error message element', () => {
      showFieldError('email', 'Invalid email format');

      const errorEl = document.querySelector('.invalid-feedback');
      expect(errorEl).not.toBeNull();
      expect(errorEl.textContent).toBe('Invalid email format');
    });

    it('should update existing error message', () => {
      showFieldError('email', 'First error');
      showFieldError('email', 'Second error');

      const errorEls = document.querySelectorAll('.invalid-feedback');
      expect(errorEls.length).toBe(1);
      expect(errorEls[0].textContent).toBe('Second error');
    });
  });

  describe('clearFieldError', () => {
    it('should remove invalid class from field', () => {
      const field = document.getElementById('email');
      field.classList.add('is-invalid');
      field.setAttribute('aria-invalid', 'true');

      clearFieldError('email');

      expect(field.classList.contains('is-invalid')).toBe(false);
      expect(field.getAttribute('aria-invalid')).toBeNull();
    });

    it('should remove error message element', () => {
      showFieldError('email', 'Error message');
      clearFieldError('email');

      const errorEl = document.querySelector('.invalid-feedback');
      expect(errorEl).toBeNull();
    });
  });

  describe('clearAllErrors', () => {
    it('should clear all field errors in form', () => {
      const form = document.getElementById('test-form');

      showFieldError('email', 'Email error');
      showFieldError('amount', 'Amount error');

      clearAllErrors(form);

      expect(document.getElementById('email').classList.contains('is-invalid')).toBe(false);
      expect(document.getElementById('amount').classList.contains('is-invalid')).toBe(false);
      expect(document.querySelectorAll('.invalid-feedback').length).toBe(0);
    });
  });
});

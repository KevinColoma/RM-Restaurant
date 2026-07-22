// Shared form feedback: busy state on the submit button and validation errors
// shown against the field that caused them.
//
// Two problems this addresses. First, submitting gave no sign anything was
// happening - and with roughly four seconds of round trip on the hosted API,
// that reads as a dead button and invites a second click. Second, validation
// failures opened a modal that had to be dismissed before you could even see
// the form again, leaving you to work out which field it meant.

// Puts the button in a busy state and returns a function that restores it.
// Disabling also prevents the double submit that a slow response invites.
export function setBusy(btn, busyText = 'Saving...') {
  if (!btn) return () => {};

  const original = btn.innerHTML;
  const wasDisabled = btn.disabled;

  btn.disabled = true;
  btn.setAttribute('aria-busy', 'true');
  btn.innerHTML = `<span class="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>${busyText}`;

  return () => {
    btn.disabled = wasDisabled;
    btn.removeAttribute('aria-busy');
    btn.innerHTML = original;
  };
}

// Marks a field invalid and shows the reason directly beneath it. aria-invalid
// plus the description link mean a screen reader announces the problem when the
// field takes focus, rather than it being a purely visual cue.
export function showFieldError(field, message) {
  const el = typeof field === 'string' ? document.getElementById(field) : field;
  if (!el) return;

  el.classList.add('is-invalid');
  el.setAttribute('aria-invalid', 'true');

  const id = (el.id || 'field') + '-error';
  let msg = document.getElementById(id);
  if (!msg) {
    msg = document.createElement('div');
    msg.id = id;
    msg.className = 'invalid-feedback d-block';
    el.insertAdjacentElement('afterend', msg);
  }
  msg.textContent = message;
  el.setAttribute('aria-describedby', id);
}

export function clearFieldError(field) {
  const el = typeof field === 'string' ? document.getElementById(field) : field;
  if (!el) return;

  el.classList.remove('is-invalid');
  el.removeAttribute('aria-invalid');
  el.removeAttribute('aria-describedby');

  const msg = document.getElementById((el.id || 'field') + '-error');
  if (msg) msg.remove();
}

export function clearAllErrors(form) {
  if (!form) return;
  form.querySelectorAll('.is-invalid').forEach(clearFieldError);
}

// Reports the first failing rule against its own field and focuses it, so the
// fix is always one keystroke away. Rules are checked in the order given, which
// is the order the fields appear, so the user is sent to the earliest problem.
//
// Each rule: { field, valid, message }
export function validate(form, rules) {
  clearAllErrors(form);

  for (const rule of rules) {
    if (rule.valid) continue;
    showFieldError(rule.field, rule.message);
    const el = typeof rule.field === 'string' ? document.getElementById(rule.field) : rule.field;
    if (el) el.focus();
    return false;
  }
  return true;
}

// Clears a field's error as soon as the user starts correcting it, so the
// message does not linger while they are plainly acting on it.
export function clearErrorsOnInput(form) {
  if (!form) return;
  form.addEventListener('input', e => {
    if (e.target.classList?.contains('is-invalid')) clearFieldError(e.target);
  });
}

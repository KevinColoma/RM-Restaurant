// Utilidades compartidas para formularios con mejor UX

function disableSubmit(btn) {
    btn.disabled = true;
    btn.classList.add('btn-loading');
    btn.setAttribute('aria-busy', 'true');
    const originalText = btn.textContent;
    btn.innerHTML = '<span class="spinner-sm"></span> ' + originalText;
    return originalText;
}

function enableSubmit(btn, originalText = 'Submit') {
    btn.disabled = false;
    btn.classList.remove('btn-loading');
    btn.removeAttribute('aria-busy');
    btn.textContent = originalText;
}

function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    field.classList.add('is-invalid');
    field.setAttribute('aria-invalid', 'true');
    let errorEl = field.parentElement.querySelector('.invalid-feedback');
    if (!errorEl) {
        errorEl = document.createElement('div');
        errorEl.className = 'invalid-feedback d-block';
        field.parentElement.appendChild(errorEl);
    }
    errorEl.textContent = message;
}

function clearFieldError(fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    field.classList.remove('is-invalid');
    field.removeAttribute('aria-invalid');
    const errorEl = field.parentElement.querySelector('.invalid-feedback');
    if (errorEl) errorEl.remove();
}

function clearAllErrors(form) {
    form.querySelectorAll('.is-invalid').forEach(field => {
        clearFieldError(field.id);
    });
}

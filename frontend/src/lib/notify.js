// Wrapper sobre SweetAlert2 (ya cargado en Header.js vía CDN) para reemplazar
// los alert()/confirm() nativos del navegador por feedback visual consistente
// con el resto de la app (bindDelete en listPage.js ya usa Swal.fire).

export function notifySuccess(message, title = 'Success') {
  return Swal.fire({
    icon: 'success',
    title,
    text: message,
    timer: 2000,
    showConfirmButton: false
  });
}

export function notifyError(message, title = 'Error') {
  return Swal.fire({
    icon: 'error',
    title,
    text: message
  });
}

export function notifyWarning(message, title = 'Warning') {
  return Swal.fire({
    icon: 'warning',
    title,
    text: message
  });
}

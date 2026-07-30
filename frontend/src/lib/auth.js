import { post } from './api.js';

export function isAuthenticated() {
  return !!localStorage.getItem('token');
}

export async function signin(email, password) {
  const data = await post('/signin', { email, password });
  if (data?.success) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('username', data.usuario.username);
    localStorage.setItem('personaId', data.usuario.personaId);
    localStorage.setItem('rol', data.usuario.rol || 'admin');
  }
  return data;
}

export function signout() {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  localStorage.removeItem('personaId');
  localStorage.removeItem('rol');
  window.location.hash = '#/signin';
}

export function getRol() {
  return localStorage.getItem('rol') || 'admin';
}

export function getToken() {
  return localStorage.getItem('token');
}

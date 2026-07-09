import { post } from './api.js';

export function isAuthenticated() {
  return !!localStorage.getItem('token');
}

export async function signin(email, password, forceLogin = false) {
  const data = await post('/signin', { email, password, forceLogin });
  if (data?.success) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('username', data.usuario.username);
    localStorage.setItem('personaId', data.usuario.personaId);
  }
  return data;
}

export function signout() {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  localStorage.removeItem('personaId');
  window.location.hash = '#/signin';
}

export function getToken() {
  return localStorage.getItem('token');
}

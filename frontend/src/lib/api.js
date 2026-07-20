const API_BASE = '/api';

async function request(path, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  if (res.status === 401 && !path.includes('/signin')) {
    localStorage.removeItem('token');
    window.location.hash = '#/signin';
    return null;
  }

  const contentType = res.headers.get('content-type');
  const isJson = contentType?.includes('application/json');
  const body = isJson ? await res.json() : null;

  // Fail loudly on error responses. Returning them as-is let callers treat a
  // 404 as success - which is how saving an expense to a route that did not
  // exist still showed "Expense added successfully" while storing nothing.
  if (!res.ok) {
    throw new Error(body?.message || body?.error || `Request failed (${res.status})`);
  }

  // A non-JSON 200 means the SPA shell came back from the catch-all instead of
  // real data, i.e. the endpoint is missing. Surface that instead of handing
  // callers an HTML Response they will silently read as "no records".
  if (!isJson) {
    throw new Error(`Expected JSON from ${path} but got ${contentType || 'no content type'}`);
  }

  return body;
}

export function get(path) {
  return request(path);
}

export function post(path, data) {
  return request(path, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export function put(path, data) {
  return request(path, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

export function del(path) {
  return request(path, { method: 'DELETE' });
}

export function upload(path, formData) {
  const token = localStorage.getItem('token');
  return fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData
  }).then(r => r.json());
}

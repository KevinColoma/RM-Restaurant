import { describe, it, expect, vi, beforeEach } from 'vitest';

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('API client', () => {
  it('should set auth header when token exists', async () => {
    localStorage.setItem('token', 'test-token-123');
    global.fetch = vi.fn().mockResolvedValue({
      status: 200,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve({ data: 'ok' })
    });

    const { get } = await import('../lib/api.js');
    await get('/test');

    expect(fetch).toHaveBeenCalledWith('/api/test', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token-123'
      }
    });
  });

  it('should not set auth header when no token', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      status: 200,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve({ data: 'ok' })
    });

    const { get } = await import('../lib/api.js');
    await get('/public');

    expect(fetch).toHaveBeenCalledWith('/api/public', {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  });

  it('should redirect on 401', async () => {
    localStorage.setItem('token', 'expired-token');
    global.fetch = vi.fn().mockResolvedValue({
      status: 401,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve({ error: 'Unauthorized' })
    });

    const { get } = await import('../lib/api.js');
    await get('/dashboard');

    expect(localStorage.getItem('token')).toBeNull();
  });

  it('should POST with JSON body', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      status: 200,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve({ success: true })
    });

    const { post } = await import('../lib/api.js');
    const data = { name: 'test' };
    await post('/signin', data);

    expect(fetch).toHaveBeenCalledWith('/api/signin', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json'
      }
    });
  });

  it('should DELETE with correct method', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      status: 200,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve({ message: 'deleted' })
    });

    const { del } = await import('../lib/api.js');
    await del('/menu/123');

    expect(fetch).toHaveBeenCalledWith('/api/menu/123', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });
  });

  it('should handle non-JSON response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      status: 200,
      headers: { get: () => 'text/html' }
    });

    const { get } = await import('../lib/api.js');
    const res = await get('/page');

    expect(res.status).toBe(200);
  });

  it('should PUT with JSON body', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      status: 200,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve({ success: true })
    });

    const { put } = await import('../lib/api.js');
    const data = { name: 'updated' };
    const res = await put('/profile', data);

    expect(fetch).toHaveBeenCalledWith('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json'
      }
    });
    expect(res.success).toBe(true);
  });

  it('should upload file with FormData', async () => {
    localStorage.setItem('token', 'upload-token');
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ url: '/uploads/pic.jpg' })
    });

    const { upload } = await import('../lib/api.js');
    const formData = new FormData();
    formData.append('file', new Blob(['test']));
    const res = await upload('/avatar', formData);

    expect(fetch).toHaveBeenCalledWith('/api/avatar', {
      method: 'POST',
      headers: { Authorization: 'Bearer upload-token' },
      body: formData
    });
    expect(res.url).toBe('/uploads/pic.jpg');
  });

  it('should upload file without token', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ url: '/uploads/pic.jpg' })
    });

    const { upload } = await import('../lib/api.js');
    const formData = new FormData();
    formData.append('file', new Blob(['test']));
    const res = await upload('/public-upload', formData);

    expect(fetch).toHaveBeenCalledWith('/api/public-upload', {
      method: 'POST',
      headers: {},
      body: formData
    });
  });

  it('should return null on 401 for non-signin paths', async () => {
    localStorage.setItem('token', 'expired-token');
    global.fetch = vi.fn().mockResolvedValue({
      status: 401,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve({ error: 'Unauthorized' })
    });

    const { get } = await import('../lib/api.js');
    const result = await get('/dashboard');

    expect(result).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
  });
});

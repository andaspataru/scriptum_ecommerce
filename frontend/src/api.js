const tokenKey = 'r_token';

export const getToken = () => localStorage.getItem(tokenKey);
export const setToken = (t) => localStorage.setItem(tokenKey, t);
export const clearToken = () => localStorage.removeItem(tokenKey);

export async function api(path, opts = {}) {
  const isAbsolute = /^https?:\/\//i.test(path);
  const url =
    isAbsolute
      ? path
      : path.startsWith('/api')
      ? path
      : `/api${path.startsWith('/') ? path : `/${path}`}`;

  const token = getToken();
  const headers = new Headers(opts.headers || {});
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const hasBody = opts.body !== undefined && opts.body !== null;
  const isForm = typeof FormData !== 'undefined' && opts.body instanceof FormData;
  if (hasBody && !isForm && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(url, { ...opts, headers });

  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch {}

  if (!res.ok) {
    const msg = data?.error || data?.message || text || `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.payload = data;
    throw err;
  }
  return data;
}

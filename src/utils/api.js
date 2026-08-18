/**
 * AlgoPulse API Client
 * Base URL and fetch helper for the Python FastAPI backend.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Generic JSON fetch wrapper.
 * @param {string} path  - endpoint path e.g. '/api/metrics/classification'
 * @param {object} body  - request body (will be JSON-serialized)
 * @returns {Promise<any>}
 */
export async function apiFetch(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let msg = `API error ${res.status}`;
    try {
      const err = await res.json();
      msg = err.detail || msg;
    } catch {
      // ignore parse error
    }
    throw new Error(msg);
  }

  return res.json();
}

/**
 * Upload a file to the backend using multipart/form-data.
 * @param {File} file
 * @returns {Promise<any>}
 */
export async function apiUpload(file) {
  const form = new FormData();
  form.append('file', file);

  const res = await fetch(`${API_BASE}/api/data/upload`, {
    method: 'POST',
    body: form,
  });

  if (!res.ok) {
    let msg = `Upload error ${res.status}`;
    try {
      const err = await res.json();
      msg = err.detail || msg;
    } catch {
      // ignore
    }
    throw new Error(msg);
  }

  return res.json();
}

export { API_BASE };

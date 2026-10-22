// Small fetch wrapper for the Express API.
// Sends/receives JSON, includes the session cookie and throws ApiError on failure.

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

// Called whenever the API answers 401 (e.g. the session expired).
let handleUnauthorized = () => {};
export function onUnauthorized(handler) {
  handleUnauthorized = handler;
}

function buildUrl(path, query) {
  const params = new URLSearchParams();
  Object.entries(query || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.append(key, value);
  });
  const queryString = params.toString();
  return `/api${path}${queryString ? `?${queryString}` : ''}`;
}

async function request(method, path, { body, query } = {}) {
  const response = await fetch(buildUrl(path, query), {
    method,
    credentials: 'same-origin',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) handleUnauthorized();
    throw new ApiError(data.error || 'Something went wrong. Please try again.', response.status);
  }
  return data;
}

export const api = {
  get: (path, query) => request('GET', path, { query }),
  post: (path, body) => request('POST', path, { body }),
  put: (path, body) => request('PUT', path, { body }),
  patch: (path, body) => request('PATCH', path, { body }),
  delete: (path) => request('DELETE', path),
};

/**
 * API client helper with automatic X-User-Id header injection
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * Get current user from localStorage
 * @returns {object|null} User object with id, name, email
 */
function getCurrentUser() {
  const savedUser = localStorage.getItem('cinematch_user');
  if (savedUser) {
    try {
      return JSON.parse(savedUser);
    } catch (e) {
      console.error('Failed to parse user from localStorage:', e);
      return null;
    }
  }
  return null;
}

/**
 * Make an API request with automatic auth header
 * @param {string} path - API path (e.g., "/api/watchlist")
 * @param {RequestInit} options - Fetch options
 * @returns {Promise<Response>}
 */
export async function apiRequest(path, options = {}) {
  const user = getCurrentUser();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add X-User-Id header if user is authenticated
  if (user && user.id) {
    headers['X-User-Id'] = user.id.toString();
  }

  const url = `${API_BASE_URL}${path}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    return response;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

/**
 * Make a GET request
 */
export async function apiGet(path) {
  const response = await apiRequest(path, { method: 'GET' });
  if (!response.ok) {
    throw new Error(`GET ${path} failed: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Make a POST request
 */
export async function apiPost(path, body) {
  const response = await apiRequest(path, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`POST ${path} failed: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Make a PUT request
 */
export async function apiPut(path, body) {
  const response = await apiRequest(path, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`PUT ${path} failed: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Make a DELETE request
 */
export async function apiDelete(path) {
  const response = await apiRequest(path, { method: 'DELETE' });
  if (!response.ok) {
    throw new Error(`DELETE ${path} failed: ${response.statusText}`);
  }
  return response.json();
}

export default {
  get: apiGet,
  post: apiPost,
  put: apiPut,
  delete: apiDelete,
  request: apiRequest,
};


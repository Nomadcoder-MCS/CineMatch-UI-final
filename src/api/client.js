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
  // FastAPI expects this as an integer header
  if (user && user.id) {
    // Ensure user.id is converted to integer (FastAPI expects int, not string)
    const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
    if (!isNaN(userId)) {
      headers['X-User-Id'] = userId.toString();
    } else {
      console.warn('Invalid user ID format:', user.id);
    }
  } else {
    console.warn('No user found in localStorage. API request may fail authentication.');
  }

  const url = `${API_BASE_URL}${path}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    return response;
  } catch (error) {
    // Network error or request failed to complete
    console.error('API request failed:', error);
    const networkError = new Error('Network error. Please check your connection and try again.');
    networkError.isNetworkError = true;
    throw networkError;
  }
}

/**
 * Extract user-friendly error message from response
 * Handles FastAPI validation errors (422) and other error formats
 * @param {Response} response - Fetch response object
 * @param {string} fallbackMessage - Default message if none found
 * @returns {Promise<string>}
 */
async function extractErrorMessage(response, fallbackMessage) {
  try {
    const errorData = await response.json();
    
    // FastAPI validation errors (422) have detail as an array
    if (Array.isArray(errorData.detail)) {
      const firstError = errorData.detail[0];
      if (firstError && firstError.msg) {
        const field = firstError.loc ? firstError.loc.join('.') : 'field';
        return `${field}: ${firstError.msg}`;
      }
      // Fallback: join all error messages
      const messages = errorData.detail
        .map(err => err.msg || JSON.stringify(err))
        .filter(Boolean);
      if (messages.length > 0) {
        return messages.join('; ');
      }
    }
    
    // Standard error formats
    if (errorData.detail) {
      return errorData.detail;
    }
    if (errorData.message) {
      return errorData.message;
    }
    if (errorData.error) {
      return errorData.error;
    }
    
    // If we have any data, try to stringify it
    if (errorData && typeof errorData === 'object') {
      return JSON.stringify(errorData);
    }
    
    return fallbackMessage;
  } catch {
    // Response body is not JSON or empty
    return fallbackMessage;
  }
}

/**
 * Make a GET request
 */
export async function apiGet(path) {
  // Check if user is authenticated before making request
  const user = getCurrentUser();
  if (!user || !user.id) {
    const error = new Error('Please sign in to continue.');
    error.status = 401;
    error.isAuthError = true;
    throw error;
  }
  
  const response = await apiRequest(path, { method: 'GET' });
  if (!response.ok) {
    // Special handling for 422 (validation) and 401 (unauthorized)
    if (response.status === 422) {
      const message = await extractErrorMessage(
        response, 
        'Invalid request. Please check that you are signed in and try again.'
      );
      const error = new Error(message);
      error.status = response.status;
      error.isValidationError = true;
      throw error;
    }
    if (response.status === 401) {
      const message = await extractErrorMessage(
        response,
        'Please sign in to continue.'
      );
      const error = new Error(message);
      error.status = response.status;
      error.isAuthError = true;
      throw error;
    }
    const message = await extractErrorMessage(
      response, 
      'Unable to load data. Please try again.'
    );
    const error = new Error(message);
    error.status = response.status;
    throw error;
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
    const message = await extractErrorMessage(
      response, 
      'Unable to complete request. Please try again.'
    );
    const error = new Error(message);
    error.status = response.status;
    throw error;
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
    const message = await extractErrorMessage(
      response, 
      'Unable to save changes. Please try again.'
    );
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  return response.json();
}

/**
 * Make a DELETE request
 */
export async function apiDelete(path) {
  const response = await apiRequest(path, { method: 'DELETE' });
  if (!response.ok) {
    const message = await extractErrorMessage(
      response, 
      'Unable to delete. Please try again.'
    );
    const error = new Error(message);
    error.status = response.status;
    throw error;
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


/**
 * CineMatch ML Backend API Client
 * 
 * Connects React UI to Python FastAPI backend for ML-powered recommendations.
 */

const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

/**
 * Fetch personalized movie recommendations from ML backend
 * 
 * @param {Object} preferences - User preferences
 * @param {string} preferences.user_id - User identifier
 * @param {number[]} preferences.liked_movie_ids - IDs of liked movies
 * @param {number[]} preferences.disliked_movie_ids - IDs of disliked movies
 * @param {string[]} preferences.preferred_genres - Preferred genres
 * @param {string[]} preferences.services - Streaming services
 * @param {number} preferences.runtime_min - Minimum runtime
 * @param {number} preferences.runtime_max - Maximum runtime
 * @returns {Promise<Object[]>} Array of movie recommendations
 */
export async function fetchRecommendations(preferences = {}) {
  const payload = {
    user_id: preferences.user_id || 'default_user',
    liked_movie_ids: preferences.liked_movie_ids || [],
    disliked_movie_ids: preferences.disliked_movie_ids || [],
    preferred_genres: preferences.preferred_genres || [],
    services: preferences.services || [],
    runtime_min: preferences.runtime_min || null,
    runtime_max: preferences.runtime_max || null,
  };

  const response = await fetch(`${BASE_URL}/api/recommendations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch recommendations: ${response.statusText}`);
  }

  const data = await response.json();
  
  // Transform to match frontend format
  return data.recommendations.map(rec => ({
    id: rec.movie_id.toString(),
    title: rec.title,
    year: rec.year,
    runtime: `${Math.floor(rec.runtime / 60)}h ${rec.runtime % 60}m`,
    synopsis: rec.overview,
    genres: rec.genres,
    services: rec.services,
    posterUrl: `https://via.placeholder.com/300x450/${getColorForGenre(rec.genres[0])}/FFFFFF?text=${encodeURIComponent(rec.title)}`,
    score: rec.score,
    explanation: rec.explanation,
  }));
}

/**
 * Get user's watchlist
 */
export async function fetchWatchlist(userId = 'default_user') {
  const response = await fetch(`${BASE_URL}/api/watchlist/${userId}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch watchlist: ${response.statusText}`);
  }

  const data = await response.json();
  
  // Transform to match frontend format
  return data.items.map(item => ({
    id: item.movie_id.toString(),
    title: item.title,
    year: item.year,
    runtime: `${Math.floor(item.runtime / 60)}h ${item.runtime % 60}m`,
    synopsis: item.overview,
    genres: item.genres,
    services: item.services,
    posterUrl: `https://via.placeholder.com/300x450/${getColorForGenre(item.genres[0])}/FFFFFF?text=${encodeURIComponent(item.title)}`,
    addedDate: item.added_date,
    watched: item.watched,
  }));
}

/**
 * Add movie to watchlist
 */
export async function addToWatchlist(userId = 'default_user', movieId) {
  // Convert string ID to number if needed
  const numericId = typeof movieId === 'string' ? parseInt(movieId) : movieId;
  
  const response = await fetch(`${BASE_URL}/api/watchlist/${userId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ movie_id: numericId }),
  });

  if (!response.ok) {
    throw new Error(`Failed to add to watchlist: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Remove movie from watchlist
 */
export async function removeFromWatchlist(userId = 'default_user', movieId) {
  const numericId = typeof movieId === 'string' ? parseInt(movieId) : movieId;
  
  const response = await fetch(`${BASE_URL}/api/watchlist/${userId}/${numericId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`Failed to remove from watchlist: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Mark movie as watched/unwatched
 */
export async function markWatched(userId = 'default_user', movieId, watched = true) {
  const numericId = typeof movieId === 'string' ? parseInt(movieId) : movieId;
  
  const response = await fetch(`${BASE_URL}/api/watchlist/${userId}/${numericId}/watched?watched=${watched}`, {
    method: 'PUT',
  });

  if (!response.ok) {
    throw new Error(`Failed to mark as watched: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get available genres
 */
export async function fetchGenres() {
  const response = await fetch(`${BASE_URL}/api/genres`);

  if (!response.ok) {
    throw new Error(`Failed to fetch genres: ${response.statusText}`);
  }

  const data = await response.json();
  return data.genres;
}

/**
 * Get available streaming services
 */
export async function fetchServices() {
  const response = await fetch(`${BASE_URL}/api/services`);

  if (!response.ok) {
    throw new Error(`Failed to fetch services: ${response.statusText}`);
  }

  const data = await response.json();
  return data.services;
}

/**
 * Check backend health
 */
export async function checkHealth() {
  const response = await fetch(`${BASE_URL}/health`);

  if (!response.ok) {
    throw new Error(`Backend health check failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Helper: Get color for genre (for placeholder images)
 */
function getColorForGenre(genre) {
  const colors = {
    'Sci-Fi': '522D80',
    'Action': 'F56600',
    'Drama': '444444',
    'Comedy': 'FFD700',
    'Horror': '8B0000',
    'Romance': 'FF69B4',
    'Thriller': '2F4F4F',
    'Fantasy': '9370DB',
    'Animation': '00CED1',
    'Crime': 'B22222',
  };
  
  return colors[genre] || '777777';
}


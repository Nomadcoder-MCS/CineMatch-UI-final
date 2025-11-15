import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TopNavSignedIn from '../components/TopNavSignedIn';
import FilterChip from '../components/FilterChip';
import MovieCard from '../components/MovieCard';
import api from '../api/client';

/**
 * HomePage - Main recommendations dashboard for signed-in users
 * 
 * Fixes race condition by waiting for authReady before fetching recommendations:
 * - Waits for auth hydration from localStorage to complete
 * - Only fetches recommendations when user is available
 * - Prevents API calls before X-User-Id header can be attached
 */
export default function HomePage() {
  const { user, authReady } = useAuth();
  const navigate = useNavigate();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeContext, setActiveContext] = useState('liked');
  const [activeFilters, setActiveFilters] = useState({
    genre: false,
    service: false,
    year: false,
    runtime: false,
    sort: false,
  });

  /**
   * Load recommendations from backend
   * Only called when authReady is true and user exists
   */
  const loadRecommendations = async () => {
    // Guard: Don't fetch if user is not available
    if (!user || !user.id) {
      console.warn('Cannot load recommendations: user not available');
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Call GET /api/recommendations endpoint
      // API client automatically attaches X-User-Id header from localStorage
      const response = await api.get('/api/recommendations?limit=20');
      setMovies(response.recommendations || []);
      console.log(`✓ Loaded ${response.count} personalized recommendations`);
    } catch (error) {
      console.error('Error loading recommendations:', error);
      setError('Could not load recommendations. Please try again.');
      setMovies([]);
    } finally {
      setLoading(false);
    }
  };

  // Redirect if not authenticated (after auth is ready)
  useEffect(() => {
    if (authReady && !user) {
      navigate('/');
    }
  }, [authReady, user, navigate]);

  // Fetch recommendations when auth is ready and user is available
  // This effect runs:
  // 1. Once after authReady becomes true (auth hydration complete)
  // 2. When user.id changes (e.g., after sign-in or sign-out)
  useEffect(() => {
    // Wait until auth hydration is complete
    if (!authReady) {
      return;
    }

    // If no user, ProtectedRoute should handle redirect
    // But we also check here to avoid unnecessary API calls
    if (!user || !user.id) {
      setLoading(false);
      return;
    }

    // Auth is ready and user exists - safe to fetch recommendations
    loadRecommendations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, user?.id]); // Depend on user.id to refetch if user changes
  // Note: loadRecommendations is intentionally not in deps - it's stable and checks user internally

  const handleMovieRemoved = (movieId) => {
    // Remove movie from local state after feedback
    setMovies(prev => prev.filter(m => m.movie_id !== movieId));
  };

  const toggleFilter = (filterName) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterName]: !prev[filterName],
    }));
    // In production, this would trigger a new API call with filter params
    console.log(`Toggled filter: ${filterName}`);
  };

  // Show loading while auth is initializing or while user is being checked
  if (!authReady || !user) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🎬</div>
          <p className="text-brand-text-body">Loading...</p>
        </div>
      </div>
    );
  }

  const firstName = user.name?.split(' ')[0] || 'there';

  return (
    <div className="min-h-screen bg-brand-bg">
      <TopNavSignedIn />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-brand-text-primary mb-2">
            Welcome back, {firstName}
          </h1>
          <p className="text-base text-brand-text-body">
            {movies.length > 0 
              ? "Tonight's picks based on your preferences and viewing history"
              : "Set your preferences in Profile to get personalized recommendations"
            }
          </p>
        </div>

        {/* Context chips */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-3">
            <FilterChip
              label="Because you liked…"
              active={activeContext === 'liked'}
              onClick={() => setActiveContext('liked')}
            />
            <FilterChip
              label="Trending for you"
              active={activeContext === 'trending'}
              onClick={() => setActiveContext('trending')}
            />
          </div>
        </div>

        {/* Filter row */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-3">
            <FilterChip
              label="Genre"
              active={activeFilters.genre}
              onClick={() => toggleFilter('genre')}
            />
            <FilterChip
              label="Service"
              active={activeFilters.service}
              onClick={() => toggleFilter('service')}
            />
            <FilterChip
              label="Year"
              active={activeFilters.year}
              onClick={() => toggleFilter('year')}
            />
            <FilterChip
              label="Runtime"
              active={activeFilters.runtime}
              onClick={() => toggleFilter('runtime')}
            />
            <FilterChip
              label="Sort"
              active={activeFilters.sort}
              onClick={() => toggleFilter('sort')}
            />
          </div>
        </div>

        {/* Main content area */}
        <div className="bg-white rounded-2xl shadow-md px-8 py-8">
          {loading ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🎬</div>
              <p className="text-brand-text-body">Loading your personalized recommendations...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">⚠️</div>
              <p className="text-brand-text-body mb-4">{error}</p>
              <button
                onClick={loadRecommendations}
                className="px-6 py-2 bg-brand-orange text-white rounded-lg hover:bg-[#e05d00] transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : movies.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🎯</div>
              <p className="text-brand-text-body mb-2">
                No recommendations yet
              </p>
              <p className="text-sm text-brand-text-secondary mb-6">
                Set your preferences in your Profile to get personalized movie picks!
              </p>
              <button
                onClick={() => navigate('/profile')}
                className="px-6 py-2 bg-brand-orange text-white rounded-lg hover:bg-[#e05d00] transition-colors"
              >
                Set Preferences
              </button>
            </div>
          ) : (
            <>
              {/* Recommendations list */}
              <div className="space-y-6">
                {movies.map((movie) => (
                  <MovieCard 
                    key={movie.movie_id} 
                    movie={movie} 
                    onRemove={() => handleMovieRemoved(movie.movie_id)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}


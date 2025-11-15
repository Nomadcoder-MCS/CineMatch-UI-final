import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TopNavSignedIn from '../components/TopNavSignedIn';
import FilterChip from '../components/FilterChip';
import MovieCard from '../components/MovieCard';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
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
  
  // Mode and filter state
  const [mode, setMode] = useState('because_liked');
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedYearBucket, setSelectedYearBucket] = useState('recent');
  const [selectedRuntimeBucket, setSelectedRuntimeBucket] = useState('medium');
  
  // User preferences (loaded from API)
  const [preferences, setPreferences] = useState({
    preferred_genres: [],
    services: []
  });

  // Modal state for "Why this?" explanations
  const [whyModalOpen, setWhyModalOpen] = useState(false);
  const [whyText, setWhyText] = useState(null);

  // Modal state for "Added to watchlist" success
  const [watchlistModalOpen, setWatchlistModalOpen] = useState(false);
  const [watchlistModalTitle, setWatchlistModalTitle] = useState(null);

  // Toast state for error notifications
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('error');

  /**
   * Show error toast to user
   */
  const showErrorToast = (message) => {
    setToastMessage(message);
    setToastType('error');
    setToastOpen(true);
  };

  /**
   * Load user preferences from backend
   */
  const loadPreferences = async () => {
    // Double-check authentication before making API call
    if (!authReady || !user || !user.id) {
      console.warn('Cannot load preferences: user not authenticated');
      return;
    }
    
    try {
      const prefs = await api.get('/api/preferences/me');
      setPreferences(prefs);
      
      // Initialize genre/service filters with user's first preference
      if (prefs.preferred_genres && prefs.preferred_genres.length > 0 && !selectedGenre) {
        setSelectedGenre(prefs.preferred_genres[0]);
      }
      if (prefs.services && prefs.services.length > 0 && !selectedService) {
        setSelectedService(prefs.services[0]);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      // Don't show error toast for auth errors - user will be redirected
      if (error.isAuthError || error.status === 401) {
        console.warn('Authentication error loading preferences - redirecting to login');
        navigate('/');
        return;
      }
      showErrorToast(error.message || 'Unable to load your preferences. Some features may not work correctly.');
    }
  };

  /**
   * Load recommendations from backend
   * Only called when authReady is true and user exists
   */
  const loadRecommendations = async () => {
    // Guard: Don't fetch if auth is not ready or user is not available
    if (!authReady || !user || !user.id) {
      console.warn('Cannot load recommendations: user not authenticated');
      setError('Please sign in to view recommendations');
      setLoading(false);
      // Redirect to landing page if not authenticated
      if (authReady && !user) {
        navigate('/');
      }
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Build query params based on mode and filters
      const params = new URLSearchParams();
      params.set('limit', '20');
      params.set('mode', mode);
      
      if (mode === 'genre' && selectedGenre) {
        params.set('genre', selectedGenre);
      }
      if (mode === 'service' && selectedService) {
        params.set('service', selectedService);
      }
      if (mode === 'year') {
        params.set('year_bucket', selectedYearBucket);
      }
      if (mode === 'runtime') {
        params.set('runtime_bucket', selectedRuntimeBucket);
      }
      
      // Call GET /api/recommendations endpoint
      // API client automatically attaches X-User-Id header from localStorage
      const response = await api.get(`/api/recommendations?${params.toString()}`);
      setMovies(response.recommendations || []);
      setError(null);
      console.log(`✓ Loaded ${response.count} personalized recommendations (mode: ${mode})`);
    } catch (error) {
      console.error('Error loading recommendations:', error);
      
      // Handle authentication errors by redirecting
      if (error.isAuthError || error.status === 401 || error.isValidationError) {
        console.warn('Authentication error loading recommendations - redirecting to login');
        setError('Please sign in to view recommendations');
        navigate('/');
        return;
      }
      
      const errorMessage = error.message || 'Unable to load recommendations. Please try again.';
      setError(errorMessage);
      setMovies([]);
      showErrorToast(errorMessage);
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

  // Load preferences when user is available
  useEffect(() => {
    // Only load preferences if auth is ready AND user exists
    if (!authReady) {
      return; // Wait for auth to be ready
    }
    
    if (!user || !user.id) {
      return; // No user, don't make API call
    }
    
    loadPreferences();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, user?.id]);

  // Fetch recommendations when auth is ready, user is available, or filters change
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
  }, [authReady, user?.id, mode, selectedGenre, selectedService, selectedYearBucket, selectedRuntimeBucket]);

  const handleMovieRemoved = (movieId) => {
    // Remove movie from local state after feedback
    setMovies(prev => prev.filter(m => m.movie_id !== movieId));
  };

  const handleShowWhyThis = (explanation) => {
    setWhyText(explanation);
    setWhyModalOpen(true);
  };

  const handleCloseWhyModal = () => {
    setWhyModalOpen(false);
    setWhyText(null);
  };

  const openWatchlistModal = (movieTitle) => {
    setWatchlistModalTitle(movieTitle);
    setWatchlistModalOpen(true);
  };

  const closeWatchlistModal = () => {
    setWatchlistModalOpen(false);
    setWatchlistModalTitle(null);
  };

  const goToWatchlist = () => {
    setWatchlistModalOpen(false);
    setWatchlistModalTitle(null);
    navigate('/watchlist');
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    
    // Initialize filters with user preferences when switching to certain modes
    if (newMode === 'genre' && !selectedGenre && preferences.preferred_genres.length > 0) {
      setSelectedGenre(preferences.preferred_genres[0]);
    }
    if (newMode === 'service' && !selectedService && preferences.services.length > 0) {
      setSelectedService(preferences.services[0]);
    }
  };

  // Year and runtime bucket options
  const yearBuckets = [
    { value: 'recent', label: '2018+' },
    { value: '2010s', label: '2010s' },
    { value: '2000s', label: '2000s' },
    { value: '90s', label: '90s' },
    { value: 'classic', label: 'Pre-1990' }
  ];

  const runtimeBuckets = [
    { value: 'short', label: '<90 min' },
    { value: 'medium', label: '90-150 min' },
    { value: 'long', label: '>150 min' }
  ];

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
          <p className="text-base text-brand-text-body mb-3">
            {movies.length > 0 
              ? "Tonight's picks based on your preferences and viewing history"
              : "Set your preferences in Profile to get personalized recommendations"
            }
          </p>
          {/* AI Explainer Box */}
          <div className="bg-brand-purple/5 border border-brand-purple/20 rounded-xl px-4 py-3 mt-4">
            <div className="flex items-start gap-3">
              <div className="text-2xl flex-shrink-0">🤖</div>
              <div className="flex-1">
                <p className="text-sm text-brand-text-body">
                  <strong className="text-brand-purple font-semibold">How recommendations work:</strong> CineMatch uses 
                  content-based AI to analyze movie plots, genres, and features. It compares thousands of movies to your 
                  profile—built from your likes, preferences, and viewing patterns—to find the best matches for you.
                </p>
                <p className="text-xs text-brand-text-secondary mt-2">
                  👍 Like movies to help the AI learn your taste • ⚙️ Set preferences in your Profile to guide recommendations
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Mode selection */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-3">
            <FilterChip
              label="Because you liked…"
              active={mode === 'because_liked'}
              onClick={() => handleModeChange('because_liked')}
            />
            <FilterChip
              label="Trending for you"
              active={mode === 'trending'}
              onClick={() => handleModeChange('trending')}
            />
            <FilterChip
              label="Genre"
              active={mode === 'genre'}
              onClick={() => handleModeChange('genre')}
            />
            <FilterChip
              label="Service"
              active={mode === 'service'}
              onClick={() => handleModeChange('service')}
            />
            <FilterChip
              label="Year"
              active={mode === 'year'}
              onClick={() => handleModeChange('year')}
            />
            <FilterChip
              label="Runtime"
              active={mode === 'runtime'}
              onClick={() => handleModeChange('runtime')}
            />
          </div>
        </div>

        {/* Sub-filters based on mode */}
        {mode === 'genre' && preferences.preferred_genres.length > 0 && (
          <div className="mb-6">
            <p className="text-sm text-brand-text-secondary mb-3">Select genre:</p>
            <div className="flex flex-wrap gap-2">
              {preferences.preferred_genres.map((genre) => (
                <button
                  key={genre}
                  onClick={() => setSelectedGenre(genre)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedGenre === genre
                      ? 'bg-brand-purple text-white'
                      : 'bg-white text-brand-text-body border border-brand-border hover:bg-brand-bg'
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>
        )}

        {mode === 'service' && preferences.services.length > 0 && (
          <div className="mb-6">
            <p className="text-sm text-brand-text-secondary mb-3">Select service:</p>
            <div className="flex flex-wrap gap-2">
              {preferences.services.map((service) => (
                <button
                  key={service}
                  onClick={() => setSelectedService(service)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedService === service
                      ? 'bg-brand-purple text-white'
                      : 'bg-white text-brand-text-body border border-brand-border hover:bg-brand-bg'
                  }`}
                >
                  {service}
                </button>
              ))}
            </div>
          </div>
        )}

        {mode === 'year' && (
          <div className="mb-6">
            <p className="text-sm text-brand-text-secondary mb-3">Select time period:</p>
            <div className="flex flex-wrap gap-2">
              {yearBuckets.map((bucket) => (
                <button
                  key={bucket.value}
                  onClick={() => setSelectedYearBucket(bucket.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedYearBucket === bucket.value
                      ? 'bg-brand-purple text-white'
                      : 'bg-white text-brand-text-body border border-brand-border hover:bg-brand-bg'
                  }`}
                >
                  {bucket.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {mode === 'runtime' && (
          <div className="mb-6">
            <p className="text-sm text-brand-text-secondary mb-3">Select runtime:</p>
            <div className="flex flex-wrap gap-2">
              {runtimeBuckets.map((bucket) => (
                <button
                  key={bucket.value}
                  onClick={() => setSelectedRuntimeBucket(bucket.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedRuntimeBucket === bucket.value
                      ? 'bg-brand-purple text-white'
                      : 'bg-white text-brand-text-body border border-brand-border hover:bg-brand-bg'
                  }`}
                >
                  {bucket.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main content area */}
        <div className="bg-white rounded-2xl shadow-md px-8 py-8">
          {loading ? (
            /* Loading state */
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange mb-4"></div>
              <p className="text-lg text-brand-text-primary font-medium mb-2">Loading recommendations...</p>
              <p className="text-sm text-brand-text-secondary">Finding the perfect movies for you</p>
            </div>
          ) : error ? (
            /* Error state */
            <div className="text-center py-16">
              <div className="text-6xl mb-4">⚠️</div>
              <p className="text-lg text-brand-text-primary font-medium mb-2">Unable to load recommendations</p>
              <p className="text-sm text-brand-text-body mb-6">{error}</p>
              <button
                onClick={loadRecommendations}
                className="px-6 py-2 bg-brand-orange text-white rounded-lg hover:bg-[#e05d00] transition-colors font-medium"
              >
                Try Again
              </button>
            </div>
          ) : movies.length === 0 ? (
            /* Empty state */
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🎬</div>
              <h3 className="text-xl font-semibold text-brand-text-primary mb-2">
                No recommendations yet
              </h3>
              <p className="text-base text-brand-text-body mb-2">
                We need a bit more information to find great movies for you.
              </p>
              <p className="text-sm text-brand-text-secondary mb-6">
                Set your preferences and start liking movies to train your personalized recommendations.
              </p>
              <button
                onClick={() => navigate('/profile')}
                className="px-8 py-3 bg-brand-orange text-white rounded-xl font-semibold text-base hover:bg-[#e05d00] transition-colors shadow-md"
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
                    onShowWhyThis={handleShowWhyThis}
                    onAddToWatchlistSuccess={openWatchlistModal}
                    onError={showErrorToast}
                  />
                ))}
              </div>

              {/* Update recommendations button - lets user refresh after giving feedback */}
              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  onClick={loadRecommendations}
                  disabled={loading}
                  className={`
                    px-8 py-3 rounded-xl font-semibold text-base
                    bg-brand-orange text-white
                    hover:bg-[#e05d00]
                    disabled:opacity-50 disabled:cursor-not-allowed
                    shadow-md transition-all
                  `}
                >
                  {loading ? 'Updating recommendations...' : 'Update recommendations'}
                </button>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Why this? Modal */}
      <Modal
        open={whyModalOpen && !!whyText}
        title="Why this recommendation?"
        onClose={handleCloseWhyModal}
      >
        {whyText}
      </Modal>

      {/* Added to watchlist success Modal */}
      <Modal
        open={watchlistModalOpen && !!watchlistModalTitle}
        title="Added to your watchlist"
        onClose={closeWatchlistModal}
        actions={
          <div className="flex gap-3">
            <button
              type="button"
              onClick={closeWatchlistModal}
              className="px-6 py-2 rounded-lg text-sm font-medium border border-brand-border text-brand-text-body hover:bg-brand-bg transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={goToWatchlist}
              className="px-6 py-2 rounded-lg text-sm font-medium bg-brand-orange text-white hover:bg-[#e05d00] transition-colors shadow-sm"
            >
              Go to Watchlist
            </button>
          </div>
        }
      >
        <p>
          {watchlistModalTitle
            ? `"${watchlistModalTitle}" has been added to your watchlist.`
            : 'This movie has been added to your watchlist.'}
        </p>
      </Modal>

      {/* Error Toast */}
      <Toast
        message={toastMessage}
        type={toastType}
        isOpen={toastOpen}
        onClose={() => setToastOpen(false)}
        duration={6000}
      />
    </div>
  );
}


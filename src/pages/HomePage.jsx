import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TopNavSignedIn from '../components/TopNavSignedIn';
import FilterChip from '../components/FilterChip';
import MovieCard from '../components/MovieCard';
import api from '../api/client';

/**
 * HomePage - Main recommendations dashboard for signed-in users
 */
export default function HomePage() {
  const { user } = useAuth();
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

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user) {
      loadRecommendations();
    }
  }, [user]);

  const loadRecommendations = async () => {
    setLoading(true);
    setError(null);
    try {
      // Call new GET /api/recommendations endpoint
      // This automatically loads user preferences and feedback from database
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

  if (!user) {
    return null; // Will redirect in useEffect
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


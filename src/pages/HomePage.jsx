import { useState, useEffect } from 'react';
import TopNavSignedIn from '../components/TopNavSignedIn';
import FilterChip from '../components/FilterChip';
import MovieCard from '../components/MovieCard';
import { fetchRecommendations } from '../services/recommendations';

/**
 * HomePage - Main recommendations dashboard for signed-in users
 */
export default function HomePage() {
  const userId = 'user123'; // In production, get from auth context
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeContext, setActiveContext] = useState('liked');
  const [activeFilters, setActiveFilters] = useState({
    genre: false,
    service: false,
    year: false,
    runtime: false,
    sort: false,
  });

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      const recommendations = await fetchRecommendations(userId);
      setMovies(recommendations);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFilter = (filterName) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterName]: !prev[filterName],
    }));
    // In production, this would trigger a new API call with filter params
    console.log(`Toggled filter: ${filterName}`);
  };

  return (
    <div className="min-h-screen bg-brand-bg">
      <TopNavSignedIn />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-brand-text-primary mb-2">
            Welcome back, Alex
          </h1>
          <p className="text-base text-brand-text-body">
            Tonight's picks based on your favorites
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
              <p className="text-brand-text-body">Loading recommendations...</p>
            </div>
          ) : (
            <>
              {/* Recommendations list */}
              <div className="space-y-6 mb-8">
                {movies.map((movie) => (
                  <MovieCard key={movie.id} movie={movie} userId={userId} />
                ))}
              </div>

              {/* Empty state message */}
              <div className="text-center py-8 border-t border-brand-border">
                <div className="text-4xl mb-3">🔍</div>
                <p className="text-brand-text-body mb-2">
                  No perfect matches right now
                </p>
                <p className="text-sm text-brand-text-secondary">
                  Try broadening your filters or check back later for fresh picks.
                </p>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}


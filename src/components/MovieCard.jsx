import { useState } from 'react';
import TagChip from './TagChip';
import api from '../api/client';

/**
 * MovieCard - Displays a movie recommendation with actions
 * 
 * Feedback semantics:
 * - 👍 (like): Positive preference - used to build user profile and find similar movies
 * - 👎 (dislike): Negative signal - can down-weight but not hard exclude
 * - "Not interested": Hard exclusion - movie will NEVER appear in recommendations again
 */
export default function MovieCard({ 
  movie, 
  onRemove, 
  onShowWhyThis, 
  onAddToWatchlistSuccess,
  onError 
}) {
  const [feedback, setFeedback] = useState(null); // 'like' | 'dislike' | null

  /**
   * Handle thumbs up (like)
   * - Positive preference signal
   * - Used by recommender to build user profile and find similar movies
   */
  const handleThumbsUp = async () => {
    setFeedback('like');
    try {
      await api.post('/api/feedback', {
        movie_id: movie.movie_id || movie.id,
        signal: 'like'
      });
      console.log('✓ Liked movie:', movie.title);
    } catch (error) {
      console.error('Error recording like:', error);
      setFeedback(null); // Revert on error
      if (onError) {
        onError(error.message || 'Unable to record your like. Please try again.');
      }
    }
  };

  /**
   * Handle thumbs down (dislike)
   * - Negative signal
   * - Can down-weight similar movies but not hard exclude
   */
  const handleThumbsDown = async () => {
    setFeedback('dislike');
    try {
      await api.post('/api/feedback', {
        movie_id: movie.movie_id || movie.id,
        signal: 'dislike'
      });
      console.log('✓ Disliked movie:', movie.title);
    } catch (error) {
      console.error('Error recording dislike:', error);
      setFeedback(null); // Revert on error
      if (onError) {
        onError(error.message || 'Unable to record your dislike. Please try again.');
      }
    }
  };

  /**
   * Handle "Not interested"
   * - Hard exclusion signal
   * - Movie will NEVER appear in recommendations again for this user
   * - Optimistically removes from UI immediately
   */
  const handleNotInterested = async () => {
    try {
      await api.post('/api/feedback', {
        movie_id: movie.movie_id || movie.id,
        signal: 'not_interested'
      });
      console.log('✓ Marked as not interested:', movie.title);
      
      // Optimistically remove from UI immediately
      // This movie will never appear in recommendations again
      if (onRemove) {
        onRemove(movie.movie_id || movie.id);
      }
    } catch (error) {
      console.error('Error marking not interested:', error);
      if (onError) {
        onError(error.message || 'Unable to mark as not interested. Please try again.');
      }
    }
  };

  const handleAddToWatchlist = async () => {
    try {
      await api.post('/api/watchlist', {
        movie_id: movie.movie_id || movie.id,
        title: movie.title,
        service: movie.services?.[0] // First service if available
      });
      // Call success handler to show modal instead of alert
      if (onAddToWatchlistSuccess) {
        onAddToWatchlistSuccess(movie.title);
      }
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      if (onError) {
        onError(error.message || 'Unable to add to watchlist. Please try again.');
      }
    }
  };

  const handleWhyThis = () => {
    // Use ML-generated explanation if available from backend
    const explanation = movie.explanation || 
      `Why we recommended "${movie.title}":\n\n` +
      `• Matches your taste profile based on content analysis\n` +
      `• Genres: ${movie.genres?.slice(0, 3).join(', ') || 'Various'}\n` +
      `• Available on: ${movie.services?.slice(0, 2).join(', ') || 'Multiple services'}\n\n` +
      `CineMatch uses content-based AI to analyze movie plots, genres, and features, ` +
      `comparing them to your likes and preferences to find matches.`;
    
    // Call parent handler to show modal instead of alert
    if (onShowWhyThis) {
      onShowWhyThis(explanation);
    }
  };

  // Poster URL - use poster_url from API, fallback to posterUrl for backward compatibility
  const posterUrl = movie.poster_url || movie.posterUrl;
  
  // Synopsis - use overview from API, fallback to synopsis for backward compatibility
  const synopsis = movie.overview || movie.synopsis || "No description available.";
  
  // Get initials for fallback poster
  const getInitials = (title) => {
    return title
      .split(' ')
      .slice(0, 2)
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-brand-border p-4 sm:p-6 hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
        {/* Poster */}
        <div className="flex-shrink-0 mx-auto sm:mx-0">
          {posterUrl ? (
            <img
              src={posterUrl}
              alt={`${movie.title} poster`}
              className="w-32 h-48 object-cover rounded-xl"
              onError={(e) => {
                // Fallback to placeholder if image fails to load
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div 
            className={`${posterUrl ? 'hidden' : 'flex'} w-32 h-48 bg-brand-purple rounded-xl flex-col items-center justify-center text-white`}
            style={{ display: posterUrl ? 'none' : 'flex' }}
          >
            <div className="text-3xl font-bold mb-2">{getInitials(movie.title)}</div>
            <div className="text-xs text-center px-2">No Poster</div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Title and meta */}
          <div className="mb-2">
            <h3 className="text-xl font-bold text-brand-text-primary mb-1">
              {movie.title}
            </h3>
            <p className="text-sm text-brand-text-secondary">
              {movie.year} · {movie.runtime} min
            </p>
          </div>

          {/* Synopsis */}
          <p className="text-sm text-brand-text-body mb-4 line-clamp-3">
            {synopsis}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {movie.genres.map((genre) => (
              <TagChip key={genre} label={genre} variant="genre" />
            ))}
            {movie.services.map((service) => (
              <TagChip key={service} label={service} variant="service" />
            ))}
          </div>

          {/* Actions - wrapped flexbox for responsive layout */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-auto">
            <button
              onClick={handleThumbsUp}
              className={`p-2 rounded-lg transition-colors ${
                feedback === 'like'
                  ? 'bg-brand-orange text-white'
                  : 'hover:bg-brand-bg text-brand-text-body'
              }`}
              aria-label="Like"
            >
              👍
            </button>
            <button
              onClick={handleThumbsDown}
              className={`p-2 rounded-lg transition-colors ${
                feedback === 'dislike'
                  ? 'bg-brand-text-secondary text-white'
                  : 'hover:bg-brand-bg text-brand-text-body'
              }`}
              aria-label="Dislike"
            >
              👎
            </button>
            <button
              onClick={handleNotInterested}
              className="px-3 py-2 text-xs text-brand-text-secondary hover:text-brand-text-primary hover:bg-brand-bg rounded-lg transition-colors"
            >
              Not interested
            </button>
            <button
              onClick={handleAddToWatchlist}
              className="px-4 py-2 bg-brand-orange/10 text-brand-orange rounded-lg text-sm font-medium hover:bg-brand-orange/20 transition-colors"
            >
              + Watchlist
            </button>
            <button
              onClick={handleWhyThis}
              className="px-3 py-2 text-xs text-brand-purple hover:bg-brand-purple/10 rounded-lg transition-colors sm:ml-auto"
            >
              Why this?
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TagChip from './TagChip';
import { addToWatchlist } from '../api/cinematchApi';  // ML Backend
// TODO: Implement recordFeedback and markNotInterested in backend

/**
 * MovieCard - Displays a movie recommendation with actions
 */
export default function MovieCard({ movie, userId = 'user123' }) {
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState(null); // 'like' | 'dislike' | null

  const handleThumbsUp = async () => {
    setFeedback('like');
    // TODO: Implement recordFeedback endpoint in backend
    console.log('Liked movie:', movie.id);
  };

  const handleThumbsDown = async () => {
    setFeedback('dislike');
    // TODO: Implement recordFeedback endpoint in backend
    console.log('Disliked movie:', movie.id);
  };

  const handleNotInterested = async () => {
    // TODO: Implement markNotInterested endpoint in backend
    console.log('Not interested in movie:', movie.id);
    alert('We\'ll show you fewer movies like this.');
  };

  const handleAddToWatchlist = async () => {
    try {
      await addToWatchlist(userId, movie.id);
      alert(`Added "${movie.title}" to your watchlist!`);
      navigate('/watchlist');
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      alert('Could not add to watchlist. Make sure the backend is running.');
    }
  };

  const handleWhyThis = () => {
    // Use ML-generated explanation if available
    const explanation = movie.explanation || 
      `Why we recommended "${movie.title}":\n\n• Matches your preferred genres\n• High rating from users with similar taste\n• Available on your connected streaming services`;
    alert(explanation);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-brand-border p-6 hover:shadow-md transition-shadow">
      <div className="flex gap-6">
        {/* Poster */}
        <div className="flex-shrink-0">
          <img
            src={movie.posterUrl}
            alt={`${movie.title} poster`}
            className="w-32 h-48 object-cover rounded-xl"
          />
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col">
          {/* Title and meta */}
          <div className="mb-2">
            <h3 className="text-xl font-bold text-brand-text-primary mb-1">
              {movie.title}
            </h3>
            <p className="text-sm text-brand-text-secondary">
              {movie.year} · {movie.runtime}
            </p>
          </div>

          {/* Synopsis */}
          <p className="text-sm text-brand-text-body mb-4 line-clamp-2">
            {movie.synopsis}
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

          {/* Actions */}
          <div className="flex items-center gap-3 mt-auto">
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
              className="px-3 py-2 text-xs text-brand-purple hover:bg-brand-purple/10 rounded-lg transition-colors ml-auto"
            >
              Why this?
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


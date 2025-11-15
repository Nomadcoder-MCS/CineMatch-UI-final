import { useState } from 'react';
import TagChip from './TagChip';
import api from '../api/client';

/**
 * WatchlistItem - Displays watchlist entry with poster, synopsis, and metadata
 */
export default function WatchlistItem({ item, onUpdate, onRequestRemove }) {
  const [isWatched, setIsWatched] = useState(item.watched);

  const handleToggleWatched = async () => {
    if (!isWatched) {
      // Only allow marking as watched, not un-watching
      try {
        await api.post(`/api/watchlist/${item.movie_id}/watched`);
        setIsWatched(true);
        if (onUpdate) onUpdate();
      } catch (error) {
        console.error('Error marking watched:', error);
        alert('Failed to mark as watched');
      }
    }
  };

  const handleRemove = () => {
    // Request removal - opens confirmation modal in parent
    // No deletion happens until user confirms in modal
    if (onRequestRemove) {
      onRequestRemove(item);
    }
  };

  // Poster URL - use poster_url from API, fallback to posterUrl for backward compatibility
  const posterUrl = item.poster_url || item.posterUrl;
  
  // Synopsis - use overview from API, fallback to synopsis for backward compatibility
  const synopsis = item.overview || item.synopsis || "No description available.";
  
  // Get initials for fallback poster
  const getInitials = (title) => {
    if (!title) return "?";
    return title
      .split(' ')
      .slice(0, 2)
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className={`bg-white rounded-xl border border-brand-border p-6 hover:shadow-md transition-shadow ${isWatched ? 'opacity-60' : ''}`}>
      <div className="flex gap-6">
        {/* Poster */}
        <div className="flex-shrink-0">
          {posterUrl ? (
            <img
              src={posterUrl}
              alt={`${item.title} poster`}
              className="w-32 h-48 object-cover rounded-xl"
              onError={(e) => {
                // Fallback to placeholder if image fails to load
                e.target.style.display = 'none';
                if (e.target.nextSibling) {
                  e.target.nextSibling.style.display = 'flex';
                }
              }}
            />
          ) : null}
          <div 
            className={`${posterUrl ? 'hidden' : 'flex'} w-32 h-48 bg-brand-purple rounded-xl flex-col items-center justify-center text-white`}
            style={{ display: posterUrl ? 'none' : 'flex' }}
          >
            <div className="text-3xl font-bold mb-2">{getInitials(item.title)}</div>
            <div className="text-xs text-center px-2">No Poster</div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col">
          {/* Title and meta */}
          <div className="mb-2">
            <div className="flex items-start justify-between mb-1">
              <h4 className="text-xl font-bold text-brand-text-primary">
                {item.title || 'Untitled'}
                {isWatched && <span className="ml-2 text-sm font-normal text-brand-text-secondary">(Watched)</span>}
              </h4>
              <button
                onClick={handleRemove}
                className="text-brand-text-secondary hover:text-brand-text-primary text-lg"
                aria-label="Remove from watchlist"
              >
                ×
              </button>
            </div>
            {(item.year || item.runtime) && (
              <p className="text-sm text-brand-text-secondary">
                {item.year && `${item.year}`}
                {item.year && item.runtime && ' · '}
                {item.runtime && `${item.runtime} min`}
              </p>
            )}
          </div>

          {/* Synopsis */}
          <p className="text-sm text-brand-text-body mb-4 line-clamp-3">
            {synopsis}
          </p>

          {/* Tags */}
          {item.genres && item.genres.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {item.genres.slice(0, 5).map((genre) => (
                <TagChip key={genre} label={genre} variant="genre" />
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 mt-auto">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isWatched}
                onChange={handleToggleWatched}
                className="w-4 h-4 accent-brand-orange"
                disabled={isWatched}
              />
              <span className="text-xs text-brand-text-body">
                {isWatched ? 'Watched' : 'Mark watched'}
              </span>
            </label>
            <span className="text-xs text-brand-text-secondary">
              Added {new Date(item.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}


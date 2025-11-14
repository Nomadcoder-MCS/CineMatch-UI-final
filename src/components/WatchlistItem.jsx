import { useState } from 'react';
import TagChip from './TagChip';
import api from '../api/client';

/**
 * WatchlistItem - Compact row layout for watchlist entries
 */
export default function WatchlistItem({ item, onUpdate, onRemove }) {
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

  const handleRemove = async () => {
    if (confirm(`Remove "${item.title}" from your watchlist?`)) {
      try {
        await api.delete(`/api/watchlist/${item.movie_id}`);
        if (onRemove) onRemove(item.movie_id);
        if (onUpdate) onUpdate();
      } catch (error) {
        console.error('Error removing from watchlist:', error);
        alert('Could not remove from watchlist');
      }
    }
  };

  return (
    <div className={`bg-white rounded-xl border border-brand-border p-4 hover:shadow-sm transition-shadow ${isWatched ? 'opacity-60' : ''}`}>
      <div className="flex gap-4">
        {/* Thumbnail */}
        <div className="flex-shrink-0">
          <img
            src={item.posterUrl}
            alt={`${item.title} poster`}
            className="w-20 h-28 object-cover rounded-lg"
          />
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-1">
            <h4 className="text-base font-semibold text-brand-text-primary">
              {item.title}
              {isWatched && <span className="ml-2 text-xs text-brand-text-secondary">(Watched)</span>}
            </h4>
            <button
              onClick={handleRemove}
              className="text-brand-text-secondary hover:text-brand-text-primary text-sm"
              aria-label="More options"
            >
              ⋯
            </button>
          </div>

          <p className="text-xs text-brand-text-secondary mb-2">
            {item.service || 'Streaming service'}
          </p>

          <p className="text-sm text-brand-text-body mb-3">
            Movie ID: {item.movie_id}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isWatched}
                onChange={handleToggleWatched}
                className="w-4 h-4 accent-brand-orange"
              />
              <span className="text-xs text-brand-text-body">Mark watched</span>
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


import { useState } from 'react';
import TagChip from './TagChip';
import { markWatched, removeFromWatchlist } from '../services/recommendations';

/**
 * WatchlistItem - Compact row layout for watchlist entries
 */
export default function WatchlistItem({ item, userId = 'user123', onUpdate }) {
  const [isWatched, setIsWatched] = useState(item.watched);

  const handleToggleWatched = async () => {
    const newWatchedState = !isWatched;
    setIsWatched(newWatchedState);
    await markWatched(userId, item.id, newWatchedState);
    if (onUpdate) onUpdate();
  };

  const handleRemove = async () => {
    if (confirm(`Remove "${item.title}" from your watchlist?`)) {
      await removeFromWatchlist(userId, item.id);
      if (onUpdate) onUpdate();
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
            {item.year} · {item.runtime}
          </p>

          <p className="text-sm text-brand-text-body mb-3 line-clamp-2">
            {item.synopsis}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-3">
            {item.genres.slice(0, 2).map((genre) => (
              <TagChip key={genre} label={genre} variant="genre" />
            ))}
            {item.services.slice(0, 2).map((service) => (
              <TagChip key={service} label={service} variant="service" />
            ))}
          </div>

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
              Added {new Date(item.addedDate).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}


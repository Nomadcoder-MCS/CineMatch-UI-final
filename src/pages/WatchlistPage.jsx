import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TopNavSignedIn from '../components/TopNavSignedIn';
import WatchlistItem from '../components/WatchlistItem';
import { fetchWatchlist } from '../api/cinematchApi';  // ML Backend

/**
 * WatchlistPage - User's saved movies to watch later
 */
export default function WatchlistPage() {
  const navigate = useNavigate();
  const userId = 'user123'; // In production, get from auth context
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    loadWatchlist();
  }, []);

  const loadWatchlist = async () => {
    setLoading(true);
    try {
      const items = await fetchWatchlist(userId);
      setWatchlist(items);
    } catch (error) {
      console.error('Error loading watchlist from ML backend:', error);
      // Backend might not be running - show empty state gracefully
      setWatchlist([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = (itemId) => {
    setWatchlist(prev => prev.filter(item => item.id !== itemId));
  };

  const filteredWatchlist = watchlist.filter(item => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unwatched') return !item.watched;
    if (activeTab === 'watched') return item.watched;
    return true;
  });

  return (
    <div className="min-h-screen bg-brand-bg">
      <TopNavSignedIn />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-brand-text-primary mb-2">
            Watchlist
          </h1>
          <p className="text-base text-brand-text-body">
            Movies you've saved to watch later
          </p>
        </div>

        {/* Filter tabs */}
        <div className="mb-6">
          <div className="flex gap-3">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'all'
                  ? 'bg-brand-orange text-white'
                  : 'bg-white text-brand-text-body border border-brand-border hover:bg-brand-bg'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab('unwatched')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'unwatched'
                  ? 'bg-brand-orange text-white'
                  : 'bg-white text-brand-text-body border border-brand-border hover:bg-brand-bg'
              }`}
            >
              To Watch
            </button>
            <button
              onClick={() => setActiveTab('watched')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'watched'
                  ? 'bg-brand-orange text-white'
                  : 'bg-white text-brand-text-body border border-brand-border hover:bg-brand-bg'
              }`}
            >
              Watched
            </button>
          </div>
        </div>

        {/* Action row */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-white text-brand-text-body border border-brand-border rounded-lg text-sm font-medium hover:bg-brand-bg transition-colors">
              Remove selected
            </button>
            <button className="px-4 py-2 bg-white text-brand-text-body border border-brand-border rounded-lg text-sm font-medium hover:bg-brand-bg transition-colors">
              Mark watched
            </button>
          </div>
          <div>
            <select className="px-4 py-2 bg-white text-brand-text-body border border-brand-border rounded-lg text-sm font-medium hover:bg-brand-bg transition-colors cursor-pointer">
              <option>Recently added</option>
              <option>Title A-Z</option>
              <option>Release year</option>
            </select>
          </div>
        </div>

        {/* Main content area */}
        <div className="bg-white rounded-2xl shadow-md px-8 py-8">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-brand-text-body">Loading watchlist...</p>
            </div>
          ) : filteredWatchlist.length > 0 ? (
            <div className="space-y-4">
              {filteredWatchlist.map((item) => (
                <WatchlistItem
                  key={item.id}
                  item={item}
                  userId={userId}
                  onUpdate={loadWatchlist}
                />
              ))}
            </div>
          ) : (
            /* Empty state */
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🍿</div>
              <h3 className="text-xl font-semibold text-brand-text-primary mb-2">
                Your watchlist is empty
              </h3>
              <p className="text-base text-brand-text-body mb-6">
                Start exploring genres and add movies to watch later
              </p>
              <button
                onClick={() => navigate('/home')}
                className="px-8 py-3 bg-brand-orange text-white rounded-xl font-semibold text-base hover:bg-[#e05d00] transition-colors"
              >
                Browse recommendations
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}


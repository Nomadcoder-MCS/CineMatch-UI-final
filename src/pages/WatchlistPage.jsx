import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TopNavSignedIn from '../components/TopNavSignedIn';
import WatchlistItem from '../components/WatchlistItem';
import Modal from '../components/Modal';
import api from '../api/client';

/**
 * WatchlistPage - User's saved movies to watch later
 */
export default function WatchlistPage() {
  const navigate = useNavigate();
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  // Delete confirmation modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [pendingDeleteItem, setPendingDeleteItem] = useState(null);

  useEffect(() => {
    loadWatchlist();
  }, []);

  const loadWatchlist = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/watchlist');
      setWatchlist(response.items || []);
    } catch (error) {
      console.error('Error loading watchlist:', error);
      // Backend might not be running or user not authenticated
      setWatchlist([]);
    } finally {
      setLoading(false);
    }
  };

  // Open delete confirmation modal (does NOT delete yet)
  const handleRequestRemove = (item) => {
    setPendingDeleteItem(item);
    setDeleteModalOpen(true);
  };

  // Close delete confirmation modal without deleting
  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setPendingDeleteItem(null);
  };

  // Actually delete the item after user confirms
  const handleConfirmRemove = async () => {
    if (!pendingDeleteItem) return;

    try {
      // Backend DELETE behavior unchanged - still calls same endpoint
      await api.delete(`/api/watchlist/${pendingDeleteItem.movie_id}`);
      
      // Update local state: filter this item out of the list
      setWatchlist(prev => 
        prev.filter(item => item.movie_id !== pendingDeleteItem.movie_id)
      );
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      // Optionally show error feedback (but no alert)
      alert('Failed to remove from watchlist');
    } finally {
      closeDeleteModal();
    }
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
                  onUpdate={loadWatchlist}
                  onRequestRemove={handleRequestRemove}
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

      {/* Delete confirmation Modal */}
      <Modal
        open={deleteModalOpen && !!pendingDeleteItem}
        title="Remove from watchlist?"
        onClose={closeDeleteModal}
        actions={
          <div className="flex gap-3">
            <button
              type="button"
              onClick={closeDeleteModal}
              className="px-6 py-2 rounded-lg text-sm font-medium border border-brand-border text-brand-text-body hover:bg-brand-bg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmRemove}
              className="px-6 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors shadow-sm"
            >
              Remove
            </button>
          </div>
        }
      >
        <p>
          {pendingDeleteItem
            ? `Are you sure you want to remove "${pendingDeleteItem.title}" from your watchlist?`
            : 'Are you sure you want to remove this title from your watchlist?'}
        </p>
      </Modal>
    </div>
  );
}


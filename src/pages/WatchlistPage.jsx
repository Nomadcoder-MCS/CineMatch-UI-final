import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TopNavSignedIn from '../components/TopNavSignedIn';
import WatchlistItem from '../components/WatchlistItem';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
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

  // Toast state for error notifications
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('error');

  useEffect(() => {
    loadWatchlist();
  }, []);

  /**
   * Show error toast to user
   */
  const showErrorToast = (message) => {
    setToastMessage(message);
    setToastType('error');
    setToastOpen(true);
  };

  const loadWatchlist = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/watchlist');
      setWatchlist(response.items || []);
    } catch (error) {
      console.error('Error loading watchlist:', error);
      const errorMessage = error.message || 'Unable to load your watchlist. Please try again.';
      setWatchlist([]);
      showErrorToast(errorMessage);
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
      const errorMessage = error.message || 'Unable to remove from watchlist. Please try again.';
      showErrorToast(errorMessage);
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
            /* Loading state */
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange mb-4"></div>
              <p className="text-lg text-brand-text-primary font-medium mb-2">Loading your watchlist...</p>
              <p className="text-sm text-brand-text-secondary">Gathering your saved movies</p>
            </div>
          ) : filteredWatchlist.length > 0 ? (
            /* List of watchlist items */
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
              <p className="text-base text-brand-text-body mb-2">
                {activeTab === 'watched' 
                  ? "You haven't marked any movies as watched yet." 
                  : activeTab === 'unwatched'
                  ? "You don't have any movies to watch yet."
                  : "Start building your movie collection!"}
              </p>
              <p className="text-sm text-brand-text-secondary mb-6">
                Add movies from the Home screen to keep track of what you want to watch.
              </p>
              <button
                onClick={() => navigate('/home')}
                className="px-8 py-3 bg-brand-orange text-white rounded-xl font-semibold text-base hover:bg-[#e05d00] transition-colors shadow-md"
              >
                Browse Recommendations
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


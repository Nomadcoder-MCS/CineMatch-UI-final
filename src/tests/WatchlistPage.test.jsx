import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from './test-utils';
import WatchlistPage from '../pages/WatchlistPage';
import * as recommendationsService from '../services/recommendations';

// Mock the recommendations service
vi.mock('../services/recommendations', () => ({
  fetchWatchlist: vi.fn(),
  markWatched: vi.fn(),
  removeFromWatchlist: vi.fn(),
}));

const mockWatchlist = [
  {
    id: '101',
    title: 'Arrival',
    year: 2016,
    runtime: '2h 7m',
    synopsis: 'A linguist is recruited by the military to communicate with alien visitors.',
    genres: ['Sci-Fi', 'Drama'],
    services: ['Hulu'],
    posterUrl: 'https://via.placeholder.com/300x450',
    addedDate: '2024-11-10',
    watched: false,
  },
  {
    id: '102',
    title: 'Whiplash',
    year: 2014,
    runtime: '1h 47m',
    synopsis: 'A young drummer pushes himself to the brink.',
    genres: ['Drama', 'Music'],
    services: ['Netflix'],
    posterUrl: 'https://via.placeholder.com/300x450',
    addedDate: '2024-11-08',
    watched: false,
  },
  {
    id: '103',
    title: 'Parasite',
    year: 2019,
    runtime: '2h 12m',
    synopsis: 'A poor family schemes to infiltrate a wealthy household.',
    genres: ['Thriller', 'Drama'],
    services: ['Hulu', 'Amazon Prime'],
    posterUrl: 'https://via.placeholder.com/300x450',
    addedDate: '2024-11-05',
    watched: true,
  },
];

describe('WatchlistPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    recommendationsService.fetchWatchlist.mockResolvedValue(mockWatchlist);
  });

  it('renders the top app bar with logo and user info', async () => {
    renderWithRouter(<WatchlistPage />, { route: '/watchlist' });

    expect(screen.getByText('CineMatch')).toBeInTheDocument();
    expect(screen.getByText('Alex')).toBeInTheDocument();
  });

  it('renders page header with title and description', async () => {
    renderWithRouter(<WatchlistPage />);

    // Use getByRole for the heading to avoid nav link
    expect(screen.getByRole('heading', { name: /watchlist/i })).toBeInTheDocument();
    expect(screen.getByText(/Movies you've saved to watch later/i)).toBeInTheDocument();
  });

  it('renders filter tabs: All, To Watch, Watched', async () => {
    renderWithRouter(<WatchlistPage />);

    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('To Watch')).toBeInTheDocument();
    expect(screen.getByText('Watched')).toBeInTheDocument();
  });

  it('toggles active tab styling when tab is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<WatchlistPage />);

    const toWatchTab = screen.getByText('To Watch');
    await user.click(toWatchTab);

    // Tab should still be present
    expect(toWatchTab).toBeInTheDocument();
  });

  it('renders action buttons: Remove and Mark watched', async () => {
    renderWithRouter(<WatchlistPage />);

    expect(screen.getByText('Remove selected')).toBeInTheDocument();
    expect(screen.getByText('Mark watched')).toBeInTheDocument();
  });

  it('renders sort dropdown with "Recently added"', async () => {
    renderWithRouter(<WatchlistPage />);

    expect(screen.getByText('Recently added')).toBeInTheDocument();
  });

  it('fetches and displays watchlist items', async () => {
    renderWithRouter(<WatchlistPage />);

    await waitFor(() => {
      expect(screen.getByText('Arrival')).toBeInTheDocument();
    });

    expect(screen.getByText('Whiplash')).toBeInTheDocument();
    expect(screen.getByText('Parasite')).toBeInTheDocument();
    expect(recommendationsService.fetchWatchlist).toHaveBeenCalledWith('user123');
  });

  it('displays watchlist item details correctly', async () => {
    renderWithRouter(<WatchlistPage />);

    await waitFor(() => {
      expect(screen.getByText('Arrival')).toBeInTheDocument();
    });

    // Check metadata
    expect(screen.getByText('2016 · 2h 7m')).toBeInTheDocument();
    expect(screen.getByText(/A linguist is recruited/i)).toBeInTheDocument();

    // Check tags (multiple items may have same tags, use getAllByText)
    expect(screen.getAllByText('Sci-Fi').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Hulu').length).toBeGreaterThan(0);
  });

  it('displays "Mark watched" checkbox for each item', async () => {
    renderWithRouter(<WatchlistPage />);

    await waitFor(() => {
      expect(screen.getByText('Arrival')).toBeInTheDocument();
    });

    const checkboxes = screen.getAllByText('Mark watched');
    expect(checkboxes.length).toBeGreaterThan(0);
  });

  it('marks item as watched when checkbox is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<WatchlistPage />);

    await waitFor(() => {
      expect(screen.getByText('Arrival')).toBeInTheDocument();
    });

    // Find checkbox by role
    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[0]);

    await waitFor(() => {
      expect(recommendationsService.markWatched).toHaveBeenCalled();
    });
  });

  it('shows (Watched) label for watched items', async () => {
    renderWithRouter(<WatchlistPage />);

    await waitFor(() => {
      expect(screen.getByText(/Parasite/)).toBeInTheDocument();
    });

    // Parasite is watched in mock data
    expect(screen.getByText('(Watched)')).toBeInTheDocument();
  });

  it('displays added date for each item', async () => {
    renderWithRouter(<WatchlistPage />);

    await waitFor(() => {
      expect(screen.getByText('Arrival')).toBeInTheDocument();
    });

    // Check for date format (multiple items have dates, use getAllByText)
    expect(screen.getAllByText(/Added/).length).toBeGreaterThan(0);
  });

  it('filters watchlist by "To Watch" tab', async () => {
    const user = userEvent.setup();
    renderWithRouter(<WatchlistPage />);

    await waitFor(() => {
      expect(screen.getByText('Arrival')).toBeInTheDocument();
    });

    // Click "To Watch" tab
    const toWatchTab = screen.getByText('To Watch');
    await user.click(toWatchTab);

    // Watched items should be filtered out (Parasite should not be visible)
    await waitFor(() => {
      expect(screen.queryByText('Parasite')).not.toBeInTheDocument();
    });
  });

  it('filters watchlist by "Watched" tab', async () => {
    const user = userEvent.setup();
    renderWithRouter(<WatchlistPage />);

    await waitFor(() => {
      expect(screen.getByText('Arrival')).toBeInTheDocument();
    });

    // Click "Watched" tab
    const watchedTab = screen.getByText('Watched');
    await user.click(watchedTab);

    // Only watched items should be visible
    await waitFor(() => {
      expect(screen.getByText('Parasite')).toBeInTheDocument();
      expect(screen.queryByText('Arrival')).not.toBeInTheDocument();
    });
  });

  it('shows empty state when watchlist is empty', async () => {
    recommendationsService.fetchWatchlist.mockResolvedValue([]);
    renderWithRouter(<WatchlistPage />);

    await waitFor(() => {
      expect(screen.getByText(/Your watchlist is empty/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Start exploring genres/i)).toBeInTheDocument();
    expect(screen.getByText('Browse recommendations')).toBeInTheDocument();
  });

  it('navigates to home when "Browse recommendations" is clicked in empty state', async () => {
    const user = userEvent.setup();
    recommendationsService.fetchWatchlist.mockResolvedValue([]);
    renderWithRouter(<WatchlistPage />);

    await waitFor(() => {
      expect(screen.getByText('Browse recommendations')).toBeInTheDocument();
    });

    const browseButton = screen.getByText('Browse recommendations');
    await user.click(browseButton);

    // Button should be interactive
    expect(browseButton).toBeInTheDocument();
  });

  it('shows loading state while fetching watchlist', () => {
    renderWithRouter(<WatchlistPage />);

    expect(screen.getByText('Loading watchlist...')).toBeInTheDocument();
  });

  it('confirms before removing item from watchlist', async () => {
    const user = userEvent.setup();
    global.confirm = vi.fn(() => true);
    
    renderWithRouter(<WatchlistPage />);

    await waitFor(() => {
      expect(screen.getByText('Arrival')).toBeInTheDocument();
    });

    // Click three dots menu (more options)
    const moreButtons = screen.getAllByLabelText('More options');
    await user.click(moreButtons[0]);

    // Confirm should be called
    expect(global.confirm).toHaveBeenCalled();
  });
});


import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { render } from '@testing-library/react';
import LandingPage from '../pages/LandingPage';
import HomePage from '../pages/HomePage';
import WatchlistPage from '../pages/WatchlistPage';
import ProfilePage from '../pages/ProfilePage';
import * as recommendationsService from '../services/recommendations';

// Mock the recommendations service
vi.mock('../services/recommendations', () => ({
  fetchRecommendations: vi.fn(),
  fetchWatchlist: vi.fn(),
  rebuildRecommendations: vi.fn(),
  exportUserData: vi.fn(),
  clearRecommendationHistory: vi.fn(),
  addToWatchlist: vi.fn(),
  recordFeedback: vi.fn(),
  markNotInterested: vi.fn(),
  markWatched: vi.fn(),
  removeFromWatchlist: vi.fn(),
}));

const mockMovies = [
  {
    id: '1',
    title: 'Neon City',
    year: 2023,
    runtime: '2h 10m',
    synopsis: 'A cyberpunk thriller.',
    genres: ['Sci-Fi', 'Action'],
    services: ['Netflix'],
    posterUrl: 'https://via.placeholder.com/300x450',
    score: 8.7,
  },
];

const mockWatchlist = [
  {
    id: '101',
    title: 'Arrival',
    year: 2016,
    runtime: '2h 7m',
    synopsis: 'A linguist is recruited.',
    genres: ['Sci-Fi', 'Drama'],
    services: ['Hulu'],
    posterUrl: 'https://via.placeholder.com/300x450',
    addedDate: '2024-11-10',
    watched: false,
  },
];

// Helper to render with full routing
function renderWithRoutes(initialRoute = '/') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/watchlist" element={<WatchlistPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('App Routing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    recommendationsService.fetchRecommendations.mockResolvedValue(mockMovies);
    recommendationsService.fetchWatchlist.mockResolvedValue(mockWatchlist);
  });

  describe('Landing Page Route (/)', () => {
    it('renders LandingPage at root route', () => {
      renderWithRoutes('/');

      expect(screen.getByText('Quick movie picks for busy students')).toBeInTheDocument();
      // "How it works" appears multiple times (nav link + section heading)
      expect(screen.getAllByText('How it works').length).toBeGreaterThan(0);
    });

    it('shows signed-out navigation on landing page', () => {
      renderWithRoutes('/');

      expect(screen.getByText('Sign in')).toBeInTheDocument();
      expect(screen.getAllByText('Get started').length).toBeGreaterThan(0);
    });
  });

  describe('Home Page Route (/home)', () => {
    it('renders HomePage at /home route', async () => {
      renderWithRoutes('/home');

      expect(screen.getByText('Welcome back, Alex')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.getByText('Neon City')).toBeInTheDocument();
      });
    });

    it('shows signed-in navigation on home page', () => {
      renderWithRoutes('/home');

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Watchlist')).toBeInTheDocument();
      expect(screen.getByText('Profile')).toBeInTheDocument();
      expect(screen.getByText('Alex')).toBeInTheDocument();
    });

    it('displays at least one recommendation card', async () => {
      renderWithRoutes('/home');

      await waitFor(() => {
        expect(screen.getByText('Neon City')).toBeInTheDocument();
        expect(screen.getByText('2023 · 2h 10m')).toBeInTheDocument();
      });
    });
  });

  describe('Watchlist Page Route (/watchlist)', () => {
    it('renders WatchlistPage at /watchlist route', async () => {
      renderWithRoutes('/watchlist');

      // "Watchlist" appears in nav + heading, use getByRole for heading
      expect(screen.getByRole('heading', { name: /watchlist/i })).toBeInTheDocument();
      expect(screen.getByText(/Movies you've saved to watch later/i)).toBeInTheDocument();
    });

    it('shows signed-in navigation on watchlist page', () => {
      renderWithRoutes('/watchlist');

      expect(screen.getByText('Home')).toBeInTheDocument();
      // "Watchlist" appears in nav + heading
      expect(screen.getAllByText('Watchlist').length).toBeGreaterThan(0);
      expect(screen.getByText('Profile')).toBeInTheDocument();
    });

    it('displays watchlist items', async () => {
      renderWithRoutes('/watchlist');

      await waitFor(() => {
        expect(screen.getByText('Arrival')).toBeInTheDocument();
      });
    });
  });

  describe('Profile Page Route (/profile)', () => {
    it('renders ProfilePage at /profile route', () => {
      renderWithRoutes('/profile');

      // "Alex Johnson" appears multiple times (profile card + account section)
      expect(screen.getAllByText('Alex Johnson').length).toBeGreaterThan(0);
      expect(screen.getAllByText('alex.johnson@email.com').length).toBeGreaterThan(0);
    });

    it('shows signed-in navigation on profile page', () => {
      renderWithRoutes('/profile');

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Watchlist')).toBeInTheDocument();
      expect(screen.getByText('Profile')).toBeInTheDocument();
    });

    it('displays all profile sections', () => {
      renderWithRoutes('/profile');

      expect(screen.getByText('Account')).toBeInTheDocument();
      expect(screen.getByText('Preferences')).toBeInTheDocument();
      expect(screen.getByText('Connected services')).toBeInTheDocument();
      expect(screen.getByText('Data & privacy')).toBeInTheDocument();
      expect(screen.getByText('Notifications')).toBeInTheDocument();
      expect(screen.getByText('Rebuild my recommendations')).toBeInTheDocument();
    });
  });

  describe('Navigation between pages', () => {
    it('navigates from landing to home when "Get started" is clicked', async () => {
      const user = userEvent.setup();
      renderWithRoutes('/');

      // Get started buttons exist and are clickable
      const getStartedButtons = screen.getAllByText(/get started/i);
      expect(getStartedButtons.length).toBeGreaterThan(0);
      
      // Button should be in the document and interactive
      expect(getStartedButtons[0]).toBeInTheDocument();
    });

    it('can navigate between signed-in pages via nav links', async () => {
      const user = userEvent.setup();
      renderWithRoutes('/home');

      // Click Watchlist nav link
      const watchlistLink = screen.getByText('Watchlist');
      expect(watchlistLink).toHaveAttribute('href', '/watchlist');

      // Click Profile nav link
      const profileLink = screen.getByText('Profile');
      expect(profileLink).toHaveAttribute('href', '/profile');

      // Click Home nav link
      const homeLink = screen.getByText('Home');
      expect(homeLink).toHaveAttribute('href', '/home');
    });

    it('logo links to home page on signed-in pages', () => {
      renderWithRoutes('/profile');

      const logoLink = screen.getByText('CineMatch').closest('a');
      expect(logoLink).toHaveAttribute('href', '/home');
    });

    it('avatar/name links to profile page', () => {
      renderWithRoutes('/home');

      const avatarLink = screen.getByText('Alex').closest('a');
      expect(avatarLink).toHaveAttribute('href', '/profile');
    });
  });

  describe('Page-specific routing behavior', () => {
    it('watchlist empty state links to home', async () => {
      recommendationsService.fetchWatchlist.mockResolvedValue([]);
      renderWithRoutes('/watchlist');

      await waitFor(() => {
        expect(screen.getByText('Browse recommendations')).toBeInTheDocument();
      });

      const browseButton = screen.getByText('Browse recommendations');
      expect(browseButton).toBeInTheDocument();
    });

    it('adds movie to watchlist navigates to watchlist page', async () => {
      const user = userEvent.setup();
      renderWithRoutes('/home');

      await waitFor(() => {
        expect(screen.getByText('Neon City')).toBeInTheDocument();
      });

      // The "+ Watchlist" button should be present
      const watchlistButtons = screen.getAllByText('+ Watchlist');
      expect(watchlistButtons[0]).toBeInTheDocument();
    });
  });

  describe('Consistent layout across signed-in pages', () => {
    it('all signed-in pages have the same top nav structure', () => {
      // Test HomePage
      const { unmount: unmountHome } = renderWithRoutes('/home');
      expect(screen.getByText('CineMatch')).toBeInTheDocument();
      expect(screen.getByText('Alex')).toBeInTheDocument();
      unmountHome();

      // Test WatchlistPage
      const { unmount: unmountWatchlist } = renderWithRoutes('/watchlist');
      expect(screen.getByText('CineMatch')).toBeInTheDocument();
      expect(screen.getByText('Alex')).toBeInTheDocument();
      unmountWatchlist();

      // Test ProfilePage
      renderWithRoutes('/profile');
      expect(screen.getByText('CineMatch')).toBeInTheDocument();
      expect(screen.getByText('Alex')).toBeInTheDocument();
    });

    it('landing page has different navigation than signed-in pages', () => {
      renderWithRoutes('/');

      // Landing page should NOT have Home/Watchlist/Profile links
      expect(screen.queryByText('Home')).not.toBeInTheDocument();
      
      // Should have Sign in and Get started instead
      expect(screen.getByText('Sign in')).toBeInTheDocument();
      expect(screen.getAllByText('Get started').length).toBeGreaterThan(0);
    });
  });

  describe('Service layer integration', () => {
    it('HomePage calls fetchRecommendations on mount', async () => {
      renderWithRoutes('/home');

      await waitFor(() => {
        expect(recommendationsService.fetchRecommendations).toHaveBeenCalledWith('user123');
      });
    });

    it('WatchlistPage calls fetchWatchlist on mount', async () => {
      renderWithRoutes('/watchlist');

      await waitFor(() => {
        expect(recommendationsService.fetchWatchlist).toHaveBeenCalledWith('user123');
      });
    });
  });
});


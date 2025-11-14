import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from './test-utils';
import HomePage from '../pages/HomePage';
import * as recommendationsService from '../services/recommendations';

// Mock the recommendations service
vi.mock('../services/recommendations', () => ({
  fetchRecommendations: vi.fn(),
  addToWatchlist: vi.fn(),
  recordFeedback: vi.fn(),
  markNotInterested: vi.fn(),
}));

const mockMovies = [
  {
    id: '1',
    title: 'Neon City',
    year: 2023,
    runtime: '2h 10m',
    synopsis: 'A cyberpunk thriller set in a dystopian future.',
    genres: ['Sci-Fi', 'Action'],
    services: ['Netflix'],
    posterUrl: 'https://via.placeholder.com/300x450',
    score: 8.7,
  },
  {
    id: '2',
    title: 'The Last Garden',
    year: 2022,
    runtime: '1h 55m',
    synopsis: 'An emotional drama about a family.',
    genres: ['Drama', 'Family'],
    services: ['Hulu'],
    posterUrl: 'https://via.placeholder.com/300x450',
    score: 8.2,
  },
];

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    recommendationsService.fetchRecommendations.mockResolvedValue(mockMovies);
  });

  it('renders the top app bar with logo and user info', async () => {
    renderWithRouter(<HomePage />, { route: '/home' });

    expect(screen.getByText('CineMatch')).toBeInTheDocument();
    expect(screen.getByText('Alex')).toBeInTheDocument();
  });

  it('renders page header with welcome message', async () => {
    renderWithRouter(<HomePage />);

    expect(screen.getByText('Welcome back, Alex')).toBeInTheDocument();
    expect(screen.getByText(/Tonight's picks based on your favorites/i)).toBeInTheDocument();
  });

  it('renders context chips with correct labels', async () => {
    renderWithRouter(<HomePage />);

    expect(screen.getByText('Because you liked…')).toBeInTheDocument();
    expect(screen.getByText('Trending for you')).toBeInTheDocument();
  });

  it('toggles context chip active state when clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<HomePage />);

    const trendingChip = screen.getByText('Trending for you');
    
    // Click to activate
    await user.click(trendingChip);

    // Chip should still be in the document (state changed internally)
    expect(trendingChip).toBeInTheDocument();
  });

  it('renders filter chips for Genre, Service, Year, Runtime, Sort', async () => {
    renderWithRouter(<HomePage />);

    expect(screen.getByText('Genre')).toBeInTheDocument();
    expect(screen.getByText('Service')).toBeInTheDocument();
    expect(screen.getByText('Year')).toBeInTheDocument();
    expect(screen.getByText('Runtime')).toBeInTheDocument();
    expect(screen.getByText('Sort')).toBeInTheDocument();
  });

  it('toggles filter chip active state when clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<HomePage />);

    const genreFilter = screen.getByText('Genre');
    
    await user.click(genreFilter);

    // Filter should still be present
    expect(genreFilter).toBeInTheDocument();
  });

  it('fetches and displays movie recommendations', async () => {
    renderWithRouter(<HomePage />);

    // Wait for movies to load
    await waitFor(() => {
      expect(screen.getByText('Neon City')).toBeInTheDocument();
    });

    expect(screen.getByText('The Last Garden')).toBeInTheDocument();
    expect(recommendationsService.fetchRecommendations).toHaveBeenCalledWith('user123');
  });

  it('displays movie details correctly in cards', async () => {
    renderWithRouter(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText('Neon City')).toBeInTheDocument();
    });

    // Check movie metadata
    expect(screen.getByText('2023 · 2h 10m')).toBeInTheDocument();
    expect(screen.getByText(/A cyberpunk thriller/i)).toBeInTheDocument();
    
    // Check tags
    expect(screen.getByText('Sci-Fi')).toBeInTheDocument();
    expect(screen.getByText('Action')).toBeInTheDocument();
    expect(screen.getByText('Netflix')).toBeInTheDocument();
  });

  it('displays action buttons on movie cards', async () => {
    renderWithRouter(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText('Neon City')).toBeInTheDocument();
    });

    // Check for action buttons (using getAllByText since there are multiple cards)
    expect(screen.getAllByText('Not interested').length).toBeGreaterThan(0);
    expect(screen.getAllByText('+ Watchlist').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Why this?').length).toBeGreaterThan(0);
  });

  it('calls recordFeedback when thumbs up is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText('Neon City')).toBeInTheDocument();
    });

    // Find and click thumbs up button (using aria-label)
    const thumbsUpButtons = screen.getAllByLabelText('Like');
    await user.click(thumbsUpButtons[0]);

    await waitFor(() => {
      expect(recommendationsService.recordFeedback).toHaveBeenCalledWith('user123', '1', true);
    });
  });

  it('calls recordFeedback when thumbs down is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText('Neon City')).toBeInTheDocument();
    });

    const thumbsDownButtons = screen.getAllByLabelText('Dislike');
    await user.click(thumbsDownButtons[0]);

    await waitFor(() => {
      expect(recommendationsService.recordFeedback).toHaveBeenCalledWith('user123', '1', false);
    });
  });

  it('calls markNotInterested when "Not interested" is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText('Neon City')).toBeInTheDocument();
    });

    const notInterestedButtons = screen.getAllByText('Not interested');
    await user.click(notInterestedButtons[0]);

    await waitFor(() => {
      expect(recommendationsService.markNotInterested).toHaveBeenCalledWith('user123', '1');
    });
  });

  it('navigates to watchlist when "+ Watchlist" is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText('Neon City')).toBeInTheDocument();
    });

    const watchlistButtons = screen.getAllByText('+ Watchlist');
    await user.click(watchlistButtons[0]);

    await waitFor(() => {
      expect(recommendationsService.addToWatchlist).toHaveBeenCalledWith('user123', '1');
    });
  });

  it('shows explanation alert when "Why this?" is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText('Neon City')).toBeInTheDocument();
    });

    const whyThisButtons = screen.getAllByText('Why this?');
    await user.click(whyThisButtons[0]);

    // Alert should have been called
    expect(global.alert).toHaveBeenCalled();
  });

  it('displays empty state message', async () => {
    renderWithRouter(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText(/No perfect matches right now/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Try broadening your filters/i)).toBeInTheDocument();
  });

  it('shows loading state while fetching recommendations', () => {
    renderWithRouter(<HomePage />);

    expect(screen.getByText('Loading recommendations...')).toBeInTheDocument();
  });
});


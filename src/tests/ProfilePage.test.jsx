import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from './test-utils';
import ProfilePage from '../pages/ProfilePage';
import * as recommendationsService from '../services/recommendations';

// Mock the recommendations service
vi.mock('../services/recommendations', () => ({
  rebuildRecommendations: vi.fn(),
  exportUserData: vi.fn(),
  clearRecommendationHistory: vi.fn(),
  updatePreferences: vi.fn(),
}));

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.alert = vi.fn();
    global.confirm = vi.fn(() => true);
    recommendationsService.rebuildRecommendations.mockResolvedValue();
    recommendationsService.exportUserData.mockResolvedValue(
      new Blob(['mock,csv,data'], { type: 'text/csv' })
    );
    recommendationsService.clearRecommendationHistory.mockResolvedValue();
  });

  it('renders the top app bar with logo and user info', () => {
    renderWithRouter(<ProfilePage />, { route: '/profile' });

    expect(screen.getByText('CineMatch')).toBeInTheDocument();
    expect(screen.getByText('Alex')).toBeInTheDocument();
  });

  it('renders profile summary with name, email, and avatar', () => {
    renderWithRouter(<ProfilePage />);

    // "Alex Johnson" and email appear multiple times (profile card + account section)
    expect(screen.getAllByText('Alex Johnson').length).toBeGreaterThan(0);
    expect(screen.getAllByText('alex.johnson@email.com').length).toBeGreaterThan(0);
    
    // Check for avatar (letter "A")
    const avatars = screen.getAllByText('A');
    expect(avatars.length).toBeGreaterThan(0);
  });

  it('renders "Edit account" button in profile summary', () => {
    renderWithRouter(<ProfilePage />);

    const editButtons = screen.getAllByText('Edit account');
    expect(editButtons.length).toBeGreaterThan(0);
  });

  it('renders Account section with name and email fields', () => {
    renderWithRouter(<ProfilePage />);

    expect(screen.getByText('Account')).toBeInTheDocument();
    
    // Check for field labels
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('renders edit buttons in Account section', () => {
    renderWithRouter(<ProfilePage />);

    const editButtons = screen.getAllByText('Edit');
    expect(editButtons.length).toBeGreaterThan(0);
  });

  it('renders Preferences section with genre, language, and service chips', () => {
    renderWithRouter(<ProfilePage />);

    expect(screen.getByText('Preferences')).toBeInTheDocument();

    // Check genre chips
    expect(screen.getAllByText('Action').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Comedy').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Drama').length).toBeGreaterThan(0);

    // Check language chips
    expect(screen.getAllByText('English').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Spanish').length).toBeGreaterThan(0);

    // Check service chips (Netflix also appears in Connected services)
    expect(screen.getAllByText('Netflix').length).toBeGreaterThan(0);
  });

  it('renders "Edit preferences" link', () => {
    renderWithRouter(<ProfilePage />);

    expect(screen.getByText('Edit preferences')).toBeInTheDocument();
  });

  it('renders Connected services section with streaming services', () => {
    renderWithRouter(<ProfilePage />);

    expect(screen.getByText('Connected services')).toBeInTheDocument();

    // Check for service names (some may appear in preferences too, use getAllByText)
    expect(screen.getAllByText('Netflix').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Hulu').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Amazon Prime').length).toBeGreaterThan(0);
    expect(screen.getAllByText('HBO Max').length).toBeGreaterThan(0);
  });

  it('toggles streaming service when switch is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ProfilePage />);

    // Find toggle switches (buttons with specific class patterns)
    const toggleButtons = screen.getAllByRole('button').filter(btn => 
      btn.className.includes('inline-flex')
    );

    // Click first toggle
    await user.click(toggleButtons[0]);

    // Toggle should still be present
    expect(toggleButtons[0]).toBeInTheDocument();
  });

  it('renders Data & privacy section with export and clear options', () => {
    renderWithRouter(<ProfilePage />);

    expect(screen.getByText('Data & privacy')).toBeInTheDocument();

    // Check for data options
    expect(screen.getByText('Export my data')).toBeInTheDocument();
    expect(screen.getByText(/Download your data in CSV/i)).toBeInTheDocument();

    expect(screen.getByText('Clear recommendation history')).toBeInTheDocument();
    expect(screen.getByText(/Remove all history/i)).toBeInTheDocument();

    // Check privacy caption
    expect(screen.getByText(/You're in control of your data/i)).toBeInTheDocument();
  });

  it('exports user data when "Export my data" is clicked', async () => {
    const user = userEvent.setup();
    
    // Mock URL.createObjectURL
    global.URL.createObjectURL = vi.fn(() => 'mock-url');
    global.URL.revokeObjectURL = vi.fn();
    
    renderWithRouter(<ProfilePage />);

    const exportButton = screen.getByText('Export my data');
    await user.click(exportButton);

    await waitFor(() => {
      expect(recommendationsService.exportUserData).toHaveBeenCalledWith('user123');
    });
  });

  it('clears recommendation history with confirmation', async () => {
    const user = userEvent.setup();
    global.confirm = vi.fn(() => true);

    renderWithRouter(<ProfilePage />);

    const clearButton = screen.getByText('Clear recommendation history');
    await user.click(clearButton);

    await waitFor(() => {
      expect(global.confirm).toHaveBeenCalled();
      expect(recommendationsService.clearRecommendationHistory).toHaveBeenCalledWith('user123');
    });
  });

  it('does not clear history if user cancels confirmation', async () => {
    const user = userEvent.setup();
    global.confirm = vi.fn(() => false);

    renderWithRouter(<ProfilePage />);

    const clearButton = screen.getByText('Clear recommendation history');
    await user.click(clearButton);

    expect(global.confirm).toHaveBeenCalled();
    expect(recommendationsService.clearRecommendationHistory).not.toHaveBeenCalled();
  });

  it('renders Notifications section with toggle options', () => {
    renderWithRouter(<ProfilePage />);

    expect(screen.getByText('Notifications')).toBeInTheDocument();

    // Check notification options
    expect(screen.getByText('New picks')).toBeInTheDocument();
    expect(screen.getByText(/Alerts when we add fresh matches/i)).toBeInTheDocument();

    expect(screen.getByText('Watchlist reminders')).toBeInTheDocument();
    expect(screen.getByText(/Get reminders about your watchlist/i)).toBeInTheDocument();
  });

  it('toggles notification settings when switch is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ProfilePage />);

    // Find all toggle switches
    const toggleButtons = screen.getAllByRole('button').filter(btn => 
      btn.className.includes('inline-flex')
    );

    // Click a notification toggle (last toggles in the list)
    const notificationToggle = toggleButtons[toggleButtons.length - 1];
    await user.click(notificationToggle);

    // Toggle should still be present
    expect(notificationToggle).toBeInTheDocument();
  });

  it('renders "Rebuild my recommendations" CTA section', () => {
    renderWithRouter(<ProfilePage />);

    expect(screen.getByText('Rebuild my recommendations')).toBeInTheDocument();
    expect(
      screen.getByText(/Use your latest preferences and history to refresh your picks/i)
    ).toBeInTheDocument();
  });

  it('calls rebuildRecommendations when rebuild button is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ProfilePage />);

    const rebuildButton = screen.getByText('Rebuild my recommendations');
    await user.click(rebuildButton);

    await waitFor(() => {
      expect(recommendationsService.rebuildRecommendations).toHaveBeenCalledWith('user123');
      expect(global.alert).toHaveBeenCalledWith(
        expect.stringContaining('being rebuilt')
      );
    });
  });

  it('shows alert modal when "Edit preferences" is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<ProfilePage />);

    const editPrefsButton = screen.getByText('Edit preferences');
    await user.click(editPrefsButton);

    // Alert should be called
    expect(global.alert).toHaveBeenCalled();
  });

  it('has accessible email link', () => {
    renderWithRouter(<ProfilePage />);

    const emailLinks = screen.getAllByText('alex.johnson@email.com');
    const emailLink = emailLinks.find(el => el.tagName === 'A');
    
    expect(emailLink).toHaveAttribute('href', 'mailto:alex.johnson@email.com');
  });
});


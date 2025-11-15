# CineMatch Testing Guide

Comprehensive testing setup using **Vitest + React Testing Library** for behavior-driven testing.

## Quick Start

### Install Test Dependencies

```bash
npm install
```

Dependencies installed:
- `vitest` - Fast unit test framework
- `@testing-library/react` - React component testing utilities
- `@testing-library/user-event` - User interaction simulation
- `@testing-library/jest-dom` - Custom DOM matchers
- `jsdom` - Browser-like environment for tests
- `@vitest/ui` - Visual test UI

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (default)
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Test Structure

```
src/tests/
├── setupTests.js           # Global test setup and mocks
├── test-utils.jsx          # Custom render helpers with Router
├── LandingPage.test.jsx    # Landing page tests
├── HomePage.test.jsx       # Home page tests  
├── WatchlistPage.test.jsx  # Watchlist page tests
├── ProfilePage.test.jsx    # Profile page tests
└── AppRoutes.test.jsx      # Routing and navigation tests
```

## Configuration Files

### `vitest.config.js`

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setupTests.js',
    css: true,
  },
})
```

**Key settings:**
- `globals: true` - No need to import `describe`, `it`, `expect`
- `environment: 'jsdom'` - Simulate browser DOM
- `setupFiles` - Run setup before each test file
- `css: true` - Process CSS imports

### `setupTests.js`

Global test setup:
- Imports `@testing-library/jest-dom` for custom matchers
- Mocks `window.matchMedia` for responsive tests
- Mocks `window.alert` and `window.confirm` for UI tests

### `test-utils.jsx`

Custom render functions:
- `renderWithRouter()` - Renders with MemoryRouter
- `renderWithBrowserRouter()` - Renders with BrowserRouter
- Re-exports all RTL utilities

## Test Coverage

### Landing Page (`LandingPage.test.jsx`)

**What's tested:**
- ✅ Top navigation (logo, links, CTAs)
- ✅ Hero section (headline, description, mock card)
- ✅ "How it works" section (3 steps)
- ✅ "For students" section (3 benefits)
- ✅ Navigation to /home on button clicks
- ✅ Footer content
- ✅ Accessibility (anchor tags, semantic HTML)

**Example test:**
```javascript
it('renders the hero section with main heading', () => {
  renderWithRouter(<LandingPage />);
  
  expect(screen.getByText('Quick movie picks for busy students'))
    .toBeInTheDocument();
});
```

### Home Page (`HomePage.test.jsx`)

**What's tested:**
- ✅ Top app bar (logo, user info)
- ✅ Welcome header and subtitle
- ✅ Context chips (active/inactive states)
- ✅ Filter chips (Genre, Service, Year, etc.)
- ✅ Movie cards with all details
- ✅ Thumbs up/down feedback
- ✅ "Not interested" action
- ✅ Add to watchlist navigation
- ✅ "Why this?" explanation
- ✅ Empty state message
- ✅ Loading state
- ✅ Integration with `fetchRecommendations` service

**Example test:**
```javascript
it('calls recordFeedback when thumbs up is clicked', async () => {
  const user = userEvent.setup();
  renderWithRouter(<HomePage />);

  await waitFor(() => {
    expect(screen.getByText('Neon City')).toBeInTheDocument();
  });

  const thumbsUpButtons = screen.getAllByLabelText('Like');
  await user.click(thumbsUpButtons[0]);

  await waitFor(() => {
    expect(recommendationsService.recordFeedback)
      .toHaveBeenCalledWith('user123', '1', true);
  });
});
```

### Watchlist Page (`WatchlistPage.test.jsx`)

**What's tested:**
- ✅ Top app bar consistency
- ✅ Page header and description
- ✅ Filter tabs (All, To Watch, Watched)
- ✅ Tab filtering logic
- ✅ Action buttons (Remove, Mark watched)
- ✅ Sort dropdown
- ✅ Watchlist items display
- ✅ Mark as watched checkbox
- ✅ Remove item with confirmation
- ✅ Empty state with "Browse recommendations"
- ✅ Loading state
- ✅ Integration with `fetchWatchlist` service

**Example test:**
```javascript
it('filters watchlist by "To Watch" tab', async () => {
  const user = userEvent.setup();
  renderWithRouter(<WatchlistPage />);

  await waitFor(() => {
    expect(screen.getByText('Arrival')).toBeInTheDocument();
  });

  const toWatchTab = screen.getByText('To Watch');
  await user.click(toWatchTab);

  await waitFor(() => {
    expect(screen.queryByText('Parasite')).not.toBeInTheDocument();
  });
});
```

### Profile Page (`ProfilePage.test.jsx`)

**What's tested:**
- ✅ Profile summary (name, email, avatar)
- ✅ Account section
- ✅ Preferences section (genre/language/service chips)
- ✅ Connected services with toggles
- ✅ Service toggle interactions
- ✅ Data & privacy section
- ✅ Export data functionality
- ✅ Clear history with confirmation
- ✅ Notifications section with toggles
- ✅ "Rebuild recommendations" CTA
- ✅ Integration with multiple services

**Example test:**
```javascript
it('calls rebuildRecommendations when rebuild button is clicked', async () => {
  const user = userEvent.setup();
  renderWithRouter(<ProfilePage />);

  const rebuildButton = screen.getByText('Rebuild my recommendations');
  await user.click(rebuildButton);

  await waitFor(() => {
    expect(recommendationsService.rebuildRecommendations)
      .toHaveBeenCalledWith('user123');
  });
});
```

### App Routes (`AppRoutes.test.jsx`)

**What's tested:**
- ✅ Route `/` renders LandingPage
- ✅ Route `/home` renders HomePage
- ✅ Route `/watchlist` renders WatchlistPage
- ✅ Route `/profile` renders ProfilePage
- ✅ Navigation links have correct hrefs
- ✅ Consistent top nav across signed-in pages
- ✅ Different nav for landing vs. signed-in pages
- ✅ Service layer called on page mount
- ✅ Inter-page navigation flows

**Example test:**
```javascript
it('navigates between signed-in pages via nav links', async () => {
  renderWithRoutes('/home');

  const watchlistLink = screen.getByText('Watchlist');
  expect(watchlistLink).toHaveAttribute('href', '/watchlist');

  const profileLink = screen.getByText('Profile');
  expect(profileLink).toHaveAttribute('href', '/profile');
});
```

## Testing Best Practices

### 1. Test Behavior, Not Implementation

❌ **Bad:**
```javascript
expect(component.state.isActive).toBe(true);
expect(element).toHaveClass('bg-orange-500');
```

✅ **Good:**
```javascript
expect(screen.getByRole('button')).toBeInTheDocument();
expect(screen.getByText('Active')).toBeVisible();
```

### 2. Use Semantic Queries

**Query Priority (RTL recommended order):**

1. `getByRole` - Most accessible
2. `getByLabelText` - Form fields
3. `getByPlaceholderText` - Inputs
4. `getByText` - Non-interactive elements
5. `getByDisplayValue` - Current form values
6. `getByAltText` - Images
7. `getByTitle` - SVGs, titles
8. `getByTestId` - Last resort

**Example:**
```javascript
// ✅ Good
const button = screen.getByRole('button', { name: /get started/i });
const heading = screen.getByRole('heading', { name: /welcome back/i });
const checkbox = screen.getByLabelText('Mark watched');

// ❌ Avoid
const button = screen.getByTestId('cta-button');
```

### 3. Simulate Real User Interactions

```javascript
import userEvent from '@testing-library/user-event';

it('handles user interactions', async () => {
  const user = userEvent.setup();
  renderWithRouter(<HomePage />);

  // Click button
  await user.click(screen.getByText('Genre'));

  // Type in input
  await user.type(screen.getByLabelText('Search'), 'Action');

  // Select from dropdown
  await user.selectOptions(screen.getByRole('combobox'), 'Netflix');
});
```

### 4. Wait for Async Updates

```javascript
import { waitFor } from '@testing-library/react';

it('loads data asynchronously', async () => {
  renderWithRouter(<HomePage />);

  // ✅ Wait for element to appear
  await waitFor(() => {
    expect(screen.getByText('Neon City')).toBeInTheDocument();
  });

  // ❌ Don't assert immediately on async data
  // expect(screen.getByText('Neon City')).toBeInTheDocument();
});
```

### 5. Mock Service Layer

```javascript
import * as recommendationsService from '../services/recommendations';

vi.mock('../services/recommendations', () => ({
  fetchRecommendations: vi.fn(),
  addToWatchlist: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  recommendationsService.fetchRecommendations.mockResolvedValue(mockData);
});

it('calls service function', async () => {
  renderWithRouter(<HomePage />);

  await waitFor(() => {
    expect(recommendationsService.fetchRecommendations)
      .toHaveBeenCalledWith('user123');
  });
});
```

## Service Layer Mocking

All tests mock `src/services/recommendations.js` to avoid real API calls.

**Mocked functions:**
- `fetchRecommendations(userId)`
- `fetchWatchlist(userId)`
- `addToWatchlist(userId, movieId)`
- `removeFromWatchlist(userId, movieId)`
- `markWatched(userId, movieId, watched)`
- `rebuildRecommendations(userId)`
- `recordFeedback(userId, movieId, liked)`
- `markNotInterested(userId, movieId)`
- `updatePreferences(userId, preferences)`
- `exportUserData(userId)`
- `clearRecommendationHistory(userId)`

**When Python backend is connected:**
1. Replace mock implementations with real API calls
2. Update mock data to match real API responses
3. Add integration tests that hit real API (optional)

## Custom Matchers

From `@testing-library/jest-dom`:

```javascript
// Presence
expect(element).toBeInTheDocument();
expect(element).toBeVisible();
expect(element).toBeEmptyDOMElement();

// Content
expect(element).toHaveTextContent('Text');
expect(element).toContainHTML('<span>Text</span>');

// Attributes
expect(element).toHaveAttribute('href', '/home');
expect(element).toHaveClass('active');

// Forms
expect(input).toHaveValue('value');
expect(checkbox).toBeChecked();
expect(input).toBeDisabled();

// Accessibility
expect(element).toHaveAccessibleName('Button');
expect(element).toHaveAccessibleDescription('Description');
```

## Running Specific Tests

```bash
# Run single test file
npm test HomePage.test.jsx

# Run tests matching pattern
npm test -- --grep="navigation"

# Run tests in specific directory
npm test src/tests/

# Update snapshots (if using)
npm test -- -u
```

## Debugging Tests

### 1. Use `screen.debug()`

```javascript
it('debugging test', () => {
  renderWithRouter(<HomePage />);
  
  // Print entire DOM
  screen.debug();
  
  // Print specific element
  screen.debug(screen.getByText('Welcome'));
});
```

### 2. Use VS Code Debugger

Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Vitest",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["test"],
  "console": "integratedTerminal"
}
```

### 3. Check What's Rendered

```javascript
// See all accessible roles
screen.logTestingPlaygroundURL();

// Get all by role
screen.getAllByRole('button').forEach(btn => console.log(btn.textContent));
```

## Coverage Reports

```bash
npm run test:coverage
```

Opens coverage report showing:
- Statement coverage
- Branch coverage
- Function coverage
- Line coverage

**Target:** Aim for 80%+ coverage on critical user flows.

## Extending Tests

### Adding New Page Tests

1. Create `src/tests/NewPage.test.jsx`
2. Import page component
3. Mock any services used
4. Write behavior-focused tests

```javascript
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithRouter } from './test-utils';
import NewPage from '../pages/NewPage';

describe('NewPage', () => {
  it('renders page content', () => {
    renderWithRouter(<NewPage />);
    expect(screen.getByText('Page Title')).toBeInTheDocument();
  });
});
```

### Adding Component Tests

For shared components:

```javascript
import MovieCard from '../components/MovieCard';

const mockMovie = {
  id: '1',
  title: 'Test Movie',
  year: 2023,
  // ... other fields
};

describe('MovieCard', () => {
  it('displays movie title', () => {
    renderWithBrowserRouter(
      <MovieCard movie={mockMovie} userId="test" />
    );
    expect(screen.getByText('Test Movie')).toBeInTheDocument();
  });
});
```

### Testing Backend Integration

When Python backend is ready:

```javascript
// TODO: Replace with actual API integration test
it('fetches real recommendations from Python backend', async () => {
  // Don't mock - use real API
  const { unmock } = vi.mock('../services/recommendations');
  unmock();

  renderWithRouter(<HomePage />);

  await waitFor(() => {
    expect(screen.getByText(/movie title from api/i))
      .toBeInTheDocument();
  }, { timeout: 5000 });
});
```

## Common Issues & Solutions

### Issue: "Cannot find module"

**Solution:** Check import paths match file structure
```javascript
// ✅ Correct
import HomePage from '../pages/HomePage';

// ❌ Wrong
import HomePage from 'pages/HomePage';
```

### Issue: "Element not found"

**Solution:** Wait for async rendering
```javascript
// ✅ Use waitFor
await waitFor(() => {
  expect(screen.getByText('Async Content')).toBeInTheDocument();
});
```

### Issue: "Multiple elements found"

**Solution:** Use more specific query or getAllBy
```javascript
// ✅ Get all and select specific one
const buttons = screen.getAllByText('Edit');
await user.click(buttons[0]);

// ✅ Use more specific selector
screen.getByRole('button', { name: 'Edit account' });
```

### Issue: "Act warning"

**Solution:** Wrap state updates in async operations
```javascript
// ✅ Use userEvent with setup
const user = userEvent.setup();
await user.click(button);

// ✅ Wait for updates
await waitFor(() => {
  expect(screen.getByText('Updated')).toBeInTheDocument();
});
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - run: npm install
      - run: npm test
      - run: npm run test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## Test Scripts Summary

```json
{
  "test": "vitest",
  "test:ui": "vitest --ui",
  "test:coverage": "vitest --coverage"
}
```

## Integration Points

**Ready for Python backend:**

All service functions have clear integration points marked with `// TODO` comments.

When backend is ready:
1. Update service functions to call real APIs
2. Update mock data to match API response shapes
3. Run tests to ensure UI still works
4. Add integration tests for API calls
5. Add E2E tests for critical flows

## Resources

- [Vitest Docs](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)
- [User Event API](https://testing-library.com/docs/user-event/intro)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)

---

**Test confidently!** 🧪✅


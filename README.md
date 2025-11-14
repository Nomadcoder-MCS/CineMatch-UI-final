# CineMatch - Quick Movie Picks for Busy Students

A production-quality React + Tailwind CSS movie recommendation app with clean design, reusable components, and clear integration points for a Python recommendation engine backend.

## Features

- **Landing Page**: Marketing page with hero section, "How it works", and "For students" sections
- **Home Page**: Personalized movie recommendations dashboard with filters and context chips
- **Watchlist Page**: Save and manage movies to watch later
- **Profile Page**: Account settings, preferences, connected services, and data controls

## Design System

### Colors
- **Primary Orange**: `#F56600` - Main CTA and brand accent
- **Deep Purple**: `#522D80` - Secondary accent
- **Background**: `#EDEDED` - Light grey page background
- **Surface**: `#FFFFFF` - White cards and surfaces
- **Text Primary**: `#111111` - Headings
- **Text Body**: `#444444` - Body text
- **Text Secondary**: `#777777` - Meta/captions
- **Borders**: `#DDDDDD` - Dividers

### Typography
- Clean sans-serif (system default)
- Rounded corners on cards/buttons: 12-16px
- Soft shadows on cards
- 8px-based spacing grid

## Project Structure

```
src/
├── pages/
│   ├── LandingPage.jsx      # Marketing page (/)
│   ├── HomePage.jsx          # Recommendations dashboard (/home)
│   ├── WatchlistPage.jsx     # Saved movies (/watchlist)
│   └── ProfilePage.jsx       # User settings (/profile)
├── components/
│   ├── TopNavSignedOut.jsx   # Nav bar for landing page
│   ├── TopNavSignedIn.jsx    # Nav bar for signed-in pages
│   ├── MovieCard.jsx         # Movie recommendation card
│   ├── WatchlistItem.jsx     # Watchlist entry row
│   ├── TagChip.jsx           # Genre/service badges
│   └── FilterChip.jsx        # Interactive filter pills
├── services/
│   └── recommendations.js    # API integration layer (mock data)
├── App.jsx                   # Main app with routing
├── main.jsx                  # Entry point
└── index.css                 # Tailwind imports + minimal global styles
```

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Visit `http://localhost:5173` to see the app.

### Build

```bash
npm run build
```

### Test

```bash
# Run all tests
npm test

# Run with UI
npm run test:ui

# Run with coverage
npm run test:coverage
```

See **[TESTING.md](TESTING.md)** for comprehensive testing guide.

## Integration with Python Backend

The app is designed to integrate with a Python recommendation engine backend. All API calls are centralized in `src/services/recommendations.js`.

### Key Integration Functions

Replace the mock implementations with actual API calls:

```javascript
// Current: Mock data
export async function fetchRecommendations(userId) {
  return mockMovies;
}

// Production: REST API call
export async function fetchRecommendations(userId) {
  return fetch(`/api/recommendations/${userId}`)
    .then(r => r.json());
}
```

### API Endpoints to Implement

The following endpoints should be implemented in your Python backend:

1. **GET** `/api/recommendations/:userId` - Fetch personalized recommendations
2. **GET** `/api/watchlist/:userId` - Fetch user's watchlist
3. **POST** `/api/watchlist/:userId` - Add movie to watchlist
4. **DELETE** `/api/watchlist/:userId/:movieId` - Remove from watchlist
5. **PUT** `/api/watchlist/:userId/:movieId/watched` - Mark as watched
6. **POST** `/api/recommendations/:userId/rebuild` - Rebuild recommendations
7. **POST** `/api/feedback/:userId` - Record thumbs up/down feedback
8. **PUT** `/api/preferences/:userId` - Update user preferences
9. **GET** `/api/export/:userId` - Export user data (CSV)
10. **DELETE** `/api/history/:userId` - Clear recommendation history

### Data Models

**Movie Object:**
```javascript
{
  id: string,
  title: string,
  year: number,
  runtime: string,
  synopsis: string,
  genres: string[],
  services: string[],
  posterUrl: string,
  score: number
}
```

**Watchlist Item:**
```javascript
{
  id: string,
  title: string,
  year: number,
  runtime: string,
  synopsis: string,
  genres: string[],
  services: string[],
  posterUrl: string,
  addedDate: string,
  watched: boolean
}
```

## Tech Stack

- **React** 18.2 - UI framework
- **React Router** 6.20 - Client-side routing
- **Tailwind CSS** 3.4 - Utility-first styling
- **Vite** 5.0 - Build tool and dev server
- **Vitest** 1.0 - Testing framework
- **React Testing Library** 14.1 - Component testing
- **Jest-DOM** 6.1 - Custom matchers

## Key Features for Backend Integration

### 1. Content-Based Filtering
The app expects the Python backend to implement content-based movie recommendations using:
- User preference profiles (genres, languages, services)
- Movie feature vectors (genre, cast, director, plot keywords)
- Similarity scoring algorithms

### 2. Explainability
Each recommendation should include reasoning that can be displayed via the "Why this?" button.

### 3. Preference Learning
The backend should learn from:
- Thumbs up/down feedback
- Movies added to watchlist
- "Not interested" signals
- Watch completion data

### 4. Real-time Filtering
Support query parameters for:
- Genre filtering
- Streaming service filtering
- Year range
- Runtime constraints
- Sorting options (relevance, rating, release date, runtime)

## Design Principles

1. **Mobile-first responsive design**
2. **Accessibility** - Semantic HTML, ARIA labels, keyboard navigation
3. **Performance** - Code splitting, lazy loading, optimized images
4. **Consistency** - Shared components, design tokens, unified spacing
5. **Simplicity** - Clean UI, minimal cognitive load, clear CTAs

## Development Notes

- All placeholder user ID is `'user123'` - replace with actual authentication
- Console logs indicate where backend integration is needed
- Mock data is defined in `services/recommendations.js`
- No external state management (Redux/Zustand) - keep it simple
- Forms use basic validation - add robust validation as needed

## Future Enhancements

- [ ] User authentication (sign up, login, logout)
- [ ] Advanced filtering UI (genre multi-select, year range slider)
- [ ] Explainability modal with detailed reasoning
- [ ] Social features (share recommendations, compare tastes)
- [ ] Search functionality
- [ ] Movie detail pages
- [ ] Rating system (star ratings)
- [ ] Watch history tracking
- [ ] Recommendation scheduling (daily picks at specific time)

## License

Built for students, by students.


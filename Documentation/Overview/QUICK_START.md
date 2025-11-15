# CineMatch - Quick Start Guide

Get up and running in 5 minutes! ⚡

## Step 1: Install Dependencies (1 min)

```bash
cd CineMatch-UI2
npm install
```

## Step 2: Start Development Server (30 sec)

```bash
npm run dev
```

You should see:
```
  VITE v5.0.8  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h to show help
```

## Step 3: Open in Browser (10 sec)

Visit: **http://localhost:5173**

## Step 4: Explore the App (3 min)

### Landing Page (`/`)
- Click "Get started" → takes you to Home page
- Scroll down to see "How it works" and "For students"

### Home Page (`/home`)
- See movie recommendations
- Click filter chips (Genre, Service, etc.)
- Try thumbs up/down on a movie
- Click "+ Watchlist" → navigates to Watchlist page
- Click "Why this?" → see recommendation explanation

### Watchlist Page (`/watchlist`)
- See saved movies (3 sample movies)
- Try "Mark watched" checkbox
- Switch between tabs (All, To Watch, Watched)
- Click three dots "⋯" to remove
- Click "Browse recommendations" → back to Home

### Profile Page (`/profile`)
- See your profile and preferences
- Toggle streaming services on/off
- Toggle notifications on/off
- Click "Export my data" → downloads CSV
- Click "Rebuild my recommendations" → see alert

## Navigation

Use the top nav bar (on Home/Watchlist/Profile):
- **CineMatch logo** → Home page
- **Home** link → Home page
- **Watchlist** link → Watchlist page
- **Profile** link → Profile page
- **Avatar/Name** → Profile page

## Current State

🟢 **Working:**
- All 4 pages render correctly
- Navigation between pages
- UI interactions (buttons, toggles, checkboxes)
- Mock data displays
- Console logs show integration points

🟡 **Using Mock Data:**
- Movie recommendations
- Watchlist items
- User preferences
- All return static sample data

🔴 **Not Yet Connected:**
- No real backend API
- No authentication
- No persistent data
- No actual recommendation algorithm

## Next: Connect to Python Backend

See **INTEGRATION_CHECKLIST.md** for step-by-step backend setup.

Quick version:

### 1. Create Python Backend

```python
# app.py
from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/api/recommendations/<user_id>')
def get_recommendations(user_id):
    return jsonify([{
        "id": "1",
        "title": "Python Movie",
        "year": 2023,
        "runtime": "2h",
        "synopsis": "From Python backend!",
        "genres": ["Action"],
        "services": ["Netflix"],
        "posterUrl": "https://via.placeholder.com/300x450",
        "score": 8.5
    }])

if __name__ == '__main__':
    app.run(port=5000)
```

### 2. Configure Vite Proxy

Update `vite.config.js`:

```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:5000'
    }
  }
})
```

### 3. Update Service Layer

In `src/services/recommendations.js`:

```javascript
export async function fetchRecommendations(userId) {
  // Remove mock delay and data
  const response = await fetch(`/api/recommendations/${userId}`);
  return response.json();
}
```

### 4. Test

```bash
# Terminal 1
python app.py

# Terminal 2
npm run dev
```

Visit http://localhost:5173/home and see movies from Python!

## File Overview

**Need to edit?**
- 🎨 **Colors**: `tailwind.config.js`
- 🏠 **Home page**: `src/pages/HomePage.jsx`
- 💾 **Watchlist**: `src/pages/WatchlistPage.jsx`
- 👤 **Profile**: `src/pages/ProfilePage.jsx`
- 🎬 **Movie card**: `src/components/MovieCard.jsx`
- 🔌 **API calls**: `src/services/recommendations.js`

## Customization Examples

### Change Primary Color

`tailwind.config.js`:
```javascript
'brand-orange': '#FF6B35', // New orange
```

### Change User Name

`src/components/TopNavSignedIn.jsx`:
```javascript
<span className="text-sm font-medium">Your Name</span>
```

### Add More Mock Movies

`src/services/recommendations.js`:
```javascript
const mockMovies = [
  // Add your movies here
];
```

### Change Page Titles

Each page file has:
```javascript
<h1 className="text-3xl font-bold">
  Your Custom Title
</h1>
```

## Troubleshooting

**Issue:** Blank screen
- **Fix:** Check browser console for errors
- **Fix:** Make sure you ran `npm install`

**Issue:** Styles not loading
- **Fix:** Restart dev server
- **Fix:** Check `src/index.css` imports Tailwind

**Issue:** Navigation not working
- **Fix:** Check browser console
- **Fix:** Verify React Router is installed

**Issue:** Port 5173 already in use
- **Fix:** Kill other process or use different port
- **Fix:** `npm run dev -- --port 3000`

## Keyboard Shortcuts

In the terminal running `npm run dev`:
- **r** - Restart server
- **u** - Show server URLs
- **o** - Open in browser
- **c** - Clear console
- **q** - Quit

## What to Read Next

**Just exploring?**
→ Keep clicking around the app!

**Want to understand the code?**
→ Read **README.md**

**Ready to integrate backend?**
→ Read **INTEGRATION_CHECKLIST.md**

**Need detailed setup info?**
→ Read **SETUP.md**

**Want the big picture?**
→ Read **PROJECT_SUMMARY.md**

## Build for Production

When ready to deploy:

```bash
npm run build
```

Creates `dist/` folder with optimized files.

Deploy to:
- **Vercel**: `vercel`
- **Netlify**: `netlify deploy --dir=dist`
- **GitHub Pages**: Copy dist/ to gh-pages branch

## Features to Try

- [ ] Click all navigation links
- [ ] Try filter chips on Home page
- [ ] Click thumbs up/down on a movie
- [ ] Add movie to watchlist
- [ ] Mark movie as watched
- [ ] Toggle streaming services in Profile
- [ ] Export your data
- [ ] Rebuild recommendations
- [ ] Test on mobile (resize browser)
- [ ] Check console logs for integration hints

## Sample API Responses

When you connect the backend, responses should look like:

**GET /api/recommendations/user123:**
```json
[
  {
    "id": "1",
    "title": "Inception",
    "year": 2010,
    "runtime": "2h 28m",
    "synopsis": "A thief who steals corporate secrets...",
    "genres": ["Sci-Fi", "Thriller"],
    "services": ["Netflix", "HBO Max"],
    "posterUrl": "https://image.tmdb.org/t/p/w500/...",
    "score": 8.8
  }
]
```

**GET /api/watchlist/user123:**
```json
[
  {
    "id": "101",
    "title": "Arrival",
    "year": 2016,
    "runtime": "2h 7m",
    "synopsis": "A linguist is recruited...",
    "genres": ["Sci-Fi", "Drama"],
    "services": ["Hulu"],
    "posterUrl": "https://...",
    "addedDate": "2024-11-10",
    "watched": false
  }
]
```

## Success!

You're now running CineMatch locally! 🎉

**Next steps:**
1. Explore all 4 pages
2. Read the integration guide
3. Build your Python backend
4. Connect everything together
5. Deploy to production

**Questions?** Check the other docs:
- README.md - Overview
- SETUP.md - Detailed guide
- INTEGRATION_CHECKLIST.md - Backend setup
- PROJECT_SUMMARY.md - Architecture

Happy coding! 🚀


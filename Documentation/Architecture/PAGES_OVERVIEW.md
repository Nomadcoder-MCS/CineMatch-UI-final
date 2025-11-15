# CineMatch Pages - Visual Overview

A visual walkthrough of all four screens.

---

## 🏠 Page 1: Landing Page (`/`)

**URL:** `http://localhost:5173/`

**Purpose:** Marketing page for signed-out users

### Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│ ⬛ CineMatch    How it works  For students  Sign in  [Get started] │
└─────────────────────────────────────────────────────────┘

┌──────────────────────┬──────────────────────┐
│  Quick movie picks   │  ┌────────────────┐  │
│  for busy students   │  │  [Movie Poster]│  │
│                      │  │  Neon City     │  │
│  Set your preferences│  │  2023 · 2h 10m │  │
│  once and get smart  │  │  Synopsis...   │  │
│  movie recommendations│  │  [Sci-Fi][Action] │
│  every night.        │  │  [+Watchlist]  │  │
│                      │  │  [Why this?]   │  │
│  [Get started] →     │  └────────────────┘  │
└──────────────────────┴──────────────────────┘

┌─────────────────────────────────────────────────┐
│          HOW IT WORKS                           │
├──────────┬───────────┬──────────────────────────┤
│  ① Tell  │  ② We     │  ③ You pick             │
│  us what │  score the│  tonight's movie        │
│  you like│  catalog  │                         │
└──────────┴───────────┴──────────────────────────┘

┌─────────────────────────────────────────────────┐
│          BUILT FOR STUDENTS                     │
├──────────┬───────────┬──────────────────────────┤
│  ⚡ Fast  │  📺 Works │  💡 Explainable         │
│  setup   │  with your│  picks                  │
│          │  services │                         │
└──────────┴───────────┴──────────────────────────┘

               [Get started free]
```

### Key Elements

**Top Nav:**
- CineMatch logo (orange square with "C")
- Links: How it works, For students, Sign in
- Primary CTA: "Get started" (orange button)

**Hero (Two Columns):**
- Left: Headline, description, CTAs
- Right: Mock recommendation card preview

**How it Works (3 Cards):**
- Step 1: Tell us what you like
- Step 2: We score the catalog
- Step 3: You pick tonight's movie

**For Students (3 Benefits):**
- Fast setup (⚡)
- Works with your services (📺)
- Explainable picks (💡)

---

## 📊 Page 2: Home Page (`/home`)

**URL:** `http://localhost:5173/home`

**Purpose:** Personalized recommendations dashboard

### Layout Structure

```
┌──────────────────────────────────────────────────┐
│ ⬛ CineMatch    Home  Watchlist  Profile    👤 Alex │
└──────────────────────────────────────────────────┘

Welcome back, Alex
Tonight's picks based on your favorites

[Because you liked…]  [Trending for you]

[Genre] [Service] [Year] [Runtime] [Sort]

┌─────────────────────────────────────────────────┐
│ ┌──────┐  Neon City                            │
│ │      │  2023 · 2h 10m                        │
│ │Poster│  A cyberpunk thriller set in a        │
│ │      │  dystopian future...                  │
│ └──────┘  [Sci-Fi] [Action] [Netflix]          │
│           👍 👎 [Not interested] [+Watchlist] [Why?] │
├─────────────────────────────────────────────────┤
│ ┌──────┐  The Last Garden                      │
│ │      │  2022 · 1h 55m                        │
│ │Poster│  An emotional drama about a family... │
│ │      │  [Drama] [Family] [Hulu] [Prime]     │
│ └──────┘  👍 👎 [Not interested] [+Watchlist] [Why?] │
├─────────────────────────────────────────────────┤
│ ... more movies ...                             │
└─────────────────────────────────────────────────┘

        🔍
     No perfect matches right now
     Try broadening your filters
```

### Key Elements

**Top Nav (Signed In):**
- CineMatch logo
- Navigation links: Home, Watchlist, Profile
- User avatar and name

**Page Header:**
- Welcome message
- Subtitle with context

**Context Chips:**
- "Because you liked…" (active/inactive)
- "Trending for you" (active/inactive)

**Filter Row:**
- Genre, Service, Year, Runtime, Sort
- Orange when active, outlined when inactive

**Movie Cards (Multiple):**
- Poster thumbnail (left)
- Title, year, runtime
- Synopsis (2 lines)
- Genre and service tags
- Action buttons (thumbs, watchlist, why)

**Empty State:**
- Icon
- Message
- Helper text

---

## 💾 Page 3: Watchlist Page (`/watchlist`)

**URL:** `http://localhost:5173/watchlist`

**Purpose:** Saved movies to watch later

### Layout Structure

```
┌──────────────────────────────────────────────────┐
│ ⬛ CineMatch    Home  Watchlist  Profile    👤 Alex │
└──────────────────────────────────────────────────┘

Watchlist
Movies you've saved to watch later

[All] [To Watch] [Watched]

[Remove selected] [Mark watched]        [Recently added ▾]

┌─────────────────────────────────────────────────┐
│ ┌────┐  Arrival                            ⋯   │
│ │    │  2016 · 2h 7m                           │
│ │Img │  A linguist is recruited by the         │
│ └────┘  military to communicate...             │
│         [Sci-Fi] [Drama] [Hulu]                │
│         ☐ Mark watched    Added Nov 10         │
├─────────────────────────────────────────────────┤
│ ┌────┐  Whiplash                          ⋯   │
│ │    │  2014 · 1h 47m                          │
│ │Img │  A young drummer pushes himself...      │
│ └────┘  [Drama] [Music] [Netflix]              │
│         ☐ Mark watched    Added Nov 8          │
├─────────────────────────────────────────────────┤
│ ┌────┐  Parasite (Watched)                ⋯   │
│ │    │  2019 · 2h 12m                          │
│ │Img │  A poor family schemes to become...     │
│ └────┘  [Thriller] [Drama] [Hulu]              │
│         ☑ Mark watched    Added Nov 5          │
└─────────────────────────────────────────────────┘
```

**OR when empty:**

```
┌─────────────────────────────────────────────────┐
│                                                 │
│                     🍿                          │
│                                                 │
│          Your watchlist is empty                │
│                                                 │
│    Start exploring genres and add movies       │
│           to watch later                        │
│                                                 │
│          [Browse recommendations]               │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Key Elements

**Page Header:**
- Title: "Watchlist"
- Subtitle

**Filter Tabs:**
- All (show everything)
- To Watch (unwatched only)
- Watched (watched only)

**Action Row:**
- Remove selected button
- Mark watched button
- Sort dropdown (Recently added, Title A-Z, Year)

**Watchlist Items:**
- Smaller poster thumbnail
- Title with (Watched) label if watched
- Year and runtime
- Synopsis (2 lines)
- Genre and service tags
- Mark watched checkbox
- Added date
- Three dots menu (remove)

**Empty State:**
- Popcorn emoji
- Title
- Description
- "Browse recommendations" CTA → /home

---

## 👤 Page 4: Profile Page (`/profile`)

**URL:** `http://localhost:5173/profile`

**Purpose:** User account, preferences, and settings

### Layout Structure

```
┌──────────────────────────────────────────────────┐
│ ⬛ CineMatch    Home  Watchlist  Profile    👤 Alex │
└──────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ 👤 (A)  Alex Johnson                           │
│         alex.johnson@email.com                  │
│         [Edit account]                          │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Account                                         │
├─────────────────────────────────────────────────┤
│ Name                                      [Edit]│
│ Alex Johnson                                    │
│                                                 │
│ Email                                     [Edit]│
│ alex.johnson@email.com                          │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Preferences                     [Edit preferences]│
├─────────────────────────────────────────────────┤
│ Genres                                          │
│ [Action] [Comedy] [Drama]                       │
│                                                 │
│ Languages                                       │
│ [English] [Spanish]                             │
│                                                 │
│ Services                                        │
│ [Netflix]                                       │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Connected services                              │
├─────────────────────────────────────────────────┤
│ N  Netflix                              [●──ON] │
│ H  Hulu                                 [──○OFF]│
│ A  Amazon Prime                         [──○OFF]│
│ H  HBO Max                              [──○OFF]│
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Data & privacy                                  │
├─────────────────────────────────────────────────┤
│ Export my data                                  │
│ Download your data in CSV format               │
│                                                 │
│ Clear recommendation history                    │
│ Remove all history and start fresh             │
│                                                 │
│ You're in control of your data.                │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Notifications                                   │
├─────────────────────────────────────────────────┤
│ New picks                               [●──ON] │
│ Alerts when we add fresh matches               │
│                                                 │
│ Watchlist reminders                     [──○OFF]│
│ Get reminders about your watchlist             │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│        [Rebuild my recommendations]             │
│                                                 │
│  Use your latest preferences and history       │
│        to refresh your picks                    │
└─────────────────────────────────────────────────┘
```

### Key Elements

**Profile Summary:**
- Large avatar circle
- Name
- Email
- Edit account link

**Account Card:**
- Name field with edit button
- Email field with edit button

**Preferences Card:**
- Genre tags (chips)
- Language tags
- Service tags
- Edit preferences link

**Connected Services:**
- Service name with icon
- Toggle switches (orange when ON)

**Data & Privacy:**
- Export data button (downloads CSV)
- Clear history button (with confirmation)
- Privacy message

**Notifications:**
- New picks toggle
- Watchlist reminders toggle
- Descriptions for each

**Rebuild CTA:**
- Full-width orange button
- "Rebuild my recommendations"
- Explanation text below

---

## 🎨 Design Consistency

All pages share:

### Colors
- **Primary Orange:** #F56600 (CTAs, active states)
- **Deep Purple:** #522D80 (accents, avatars)
- **Background:** #EDEDED (page background)
- **White:** #FFFFFF (cards, surfaces)

### Typography
- **Headings:** Bold, dark (#111111)
- **Body:** Regular, medium grey (#444444)
- **Meta:** Small, light grey (#777777)

### Spacing
- **Cards:** rounded-2xl (16px), padding 32px
- **Gaps:** 16px or 24px between elements
- **Buttons:** rounded-xl (12px)
- **Chips:** rounded-full

### Shadows
- Soft, subtle shadows on cards
- No heavy drop shadows
- Hover states with slight shadow increase

---

## 📱 Responsive Behavior

All pages adapt to mobile:

- **Navigation:** Collapses on mobile
- **Two-column layouts:** Stack on mobile
- **Cards:** Full width on mobile
- **Posters:** Smaller on mobile
- **Filters:** Wrap to multiple rows
- **Text:** Scales appropriately

---

## 🔄 Navigation Flow

```
Landing (/)
    ↓ [Get started]
Home (/home)
    ↓ [+Watchlist]
Watchlist (/watchlist)
    ↓ [Profile (avatar)]
Profile (/profile)
    ↓ [Home (nav link)]
Home (/home)
```

**From any signed-in page:**
- Click logo → Home
- Click "Home" → Home
- Click "Watchlist" → Watchlist
- Click "Profile" → Profile
- Click avatar → Profile

---

## 🎯 Key Interactions

### Landing Page
- Sign in → /home
- Get started → /home
- Try sample → /home
- Smooth scroll to sections

### Home Page
- Filter chips → toggle active state
- 👍/👎 → record feedback (console)
- Not interested → hide (console)
- +Watchlist → navigate to /watchlist
- Why this? → show explanation alert

### Watchlist Page
- Tab filters → filter list
- Mark watched → check/uncheck
- Three dots → confirm removal
- Browse recommendations → /home

### Profile Page
- Service toggles → on/off
- Notification toggles → on/off
- Export data → download CSV
- Clear history → confirm + clear
- Rebuild → show alert

---

## 🚀 Ready to Explore!

1. Start dev server: `npm run dev`
2. Visit each page
3. Try all interactions
4. Check browser console for integration hints
5. Read integration docs when ready to connect backend

Each page is fully functional with mock data and ready for Python backend integration!


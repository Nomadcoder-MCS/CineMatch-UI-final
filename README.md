# CineMatch - Quick Movie Picks for Busy Students

A production-quality React + Tailwind CSS movie recommendation app with clean design, reusable components, and a **Python ML backend powered by MovieLens 32M** (87K movies).

## 🚀 Quick Start

### Frontend
```bash
npm install
npm run dev
```
Visit http://localhost:5173

### Backend (Quick Setup)
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python setup_pipeline.py   # Interactive setup wizard
```

## 📚 Documentation

**All project documentation has been organized in the [`Documentation/`](./Documentation/) folder.**

- **Getting started?** → See [`Documentation/Overview/`](./Documentation/Overview/)
- **Understanding the system?** → See [`Documentation/Architecture/`](./Documentation/Architecture/)
- **Working on frontend?** → See [`Documentation/Frontend/`](./Documentation/Frontend/)
- **Working on backend?** → See [`Documentation/Backend/`](./Documentation/Backend/)
- **Working on ML?** → See [`Documentation/ML/`](./Documentation/ML/)
- **Working with data?** → See [`Documentation/Data/`](./Documentation/Data/)
- **Setting up/testing?** → See [`Documentation/Operations/`](./Documentation/Operations/)

For a complete overview, see [`Documentation/README.md`](./Documentation/README.md).

## 🎬 Features

- **Landing Page**: Marketing page with hero section, "How it works", and "For students" sections
- **Home Page**: Personalized movie recommendations dashboard with filters and context chips
- **Watchlist Page**: Save and manage movies to watch later
- **Profile Page**: Account settings, preferences, connected services, and data controls
- **ML Backend**: Content-based recommender using MovieLens 32M + optional TMDb enrichment

## 🛠️ Tech Stack

- **Frontend**: React, React Router, Tailwind CSS
- **Backend**: FastAPI, SQLite
- **ML**: Content-based recommender (TF-IDF + genres + cosine similarity)
- **Data**: MovieLens 32M, TMDb API


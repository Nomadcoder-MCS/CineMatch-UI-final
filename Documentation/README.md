# CineMatch Documentation

Welcome to the CineMatch project documentation. This directory contains all project documentation organized by topic.

## 📁 Documentation Structure

### [Overview](./Overview/)
High-level project summaries, quick start guides, setup instructions, and implementation summaries.

**Key files:**
- `README.md` - Main project README (moved from root)
- `PROJECT_SUMMARY.md` - Complete project overview
- `QUICKSTART.md` - Quick start guide
- `SETUP.md` - Setup instructions
- `IMPLEMENTATION_SUMMARY.md` - Implementation details

### [Architecture](./Architecture/)
System architecture diagrams, backend structure, service boundaries, and high-level design documents.

**Key files:**
- `ARCHITECTURE.md` - Backend architecture overview
- `PAGES_OVERVIEW.md` - Frontend page structure

### [Frontend](./Frontend/)
UI/UX documentation, component hierarchies, routing descriptions, styling/theming notes, and React/Tailwind-specific docs.

**Key files:**
- `AUTH_UX_IMPROVEMENTS.md` - Authentication UX improvements
- `FILTER_MODES_IMPLEMENTATION.md` - Filter modes feature
- `POSTER_SYNOPSIS_IMPLEMENTATION.md` - Poster/synopsis feature
- `COMPLETED_TMDB_POSTERS.md` - TMDb poster integration

### [Backend](./Backend/)
API documentation, FastAPI endpoint descriptions, routes, authentication flows, database schema notes, and backend-specific documentation.

**Key files:**
- `backend_README.md` - Backend README
- `AUTH_IMPLEMENTATION.md` - Authentication implementation
- `PERSISTENCE_IMPLEMENTATION.md` - Data persistence
- `MIGRATION_GUIDE.md` - Database migration guide
- `RACE_CONDITION_FIX.md` - Race condition fixes

### [ML](./ML/)
Recommender design documentation, feature engineering notes, model selection, evaluation metrics, and training pipeline documentation.

**Key files:**
- `WEIGHTED_SCORING_UPGRADE.md` - Weighted scoring system upgrade
- `GENRE_DIVERSITY_AUDIT.md` - Genre diversity analysis
- `GENRE_DIVERSITY_TESTING.md` - Genre diversity testing

### [Data](./Data/)
Notes about MovieLens/TMDb datasets, data preprocessing, schemas, data contracts, and data directory layout.

**Key files:**
- `DATA_PIPELINE.md` - Data processing pipeline
- `TMDB_INTEGRATION.md` - TMDb integration details
- `raw_README.md` - Raw data directory notes
- `ml32m_README.txt` - MovieLens 32M dataset info

### [Operations](./Operations/)
Notes about running the project, environment setup, testing, CI/CD, deployment instructions, and operational runbooks.

**Key files:**
- `TESTING.md` - Testing documentation
- `TEST_SUMMARY.md` - Test results summary
- `INTEGRATION_CHECKLIST.md` - Integration checklist
- `TESTING_SETUP_COMPLETE.md` - Testing setup guide

## 🔍 Finding Documentation

- **Getting started?** → Start with [Overview/README.md](./Overview/README.md)
- **Understanding the system?** → Check [Architecture/](./Architecture/)
- **Working on frontend?** → See [Frontend/](./Frontend/)
- **Working on backend?** → See [Backend/](./Backend/)
- **Working on ML?** → See [ML/](./ML/)
- **Working with data?** → See [Data/](./Data/)
- **Setting up/testing?** → See [Operations/](./Operations/)

## 📝 Notes

- All documentation has been moved from scattered locations throughout the repo into this organized structure
- File names have been preserved to maintain compatibility with any existing references
- Some files may reference each other using relative paths - these have been preserved where possible


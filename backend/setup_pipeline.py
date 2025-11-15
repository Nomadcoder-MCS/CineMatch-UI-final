#!/usr/bin/env python3
"""
CineMatch Pipeline Setup Script

Quick setup for the complete data pipeline.
Run this after installing dependencies.
"""

import sys
import subprocess
from pathlib import Path
import time


def print_header(text):
    """Print formatted header"""
    print("\n" + "=" * 70)
    print(f"  {text}")
    print("=" * 70 + "\n")


def print_step(number, text):
    """Print step number"""
    print(f"\n[Step {number}] {text}")
    print("-" * 70)


def run_command(cmd, description):
    """Run a command and handle errors"""
    print(f"\n▶ {description}")
    print(f"  Command: {cmd}")
    
    start = time.time()
    result = subprocess.run(cmd, shell=True)
    elapsed = time.time() - start
    
    if result.returncode != 0:
        print(f"\n❌ Failed: {description}")
        return False
    
    print(f"✓ Completed in {elapsed:.1f}s")
    return True


def check_file_exists(path, description):
    """Check if a file exists"""
    if Path(path).exists():
        print(f"✓ Found: {description} ({path})")
        return True
    else:
        print(f"⚠️  Missing: {description} ({path})")
        return False


def main():
    """Main setup pipeline"""
    print_header("CineMatch Backend Setup")
    
    print("This script will:")
    print("  1. Check for required data files")
    print("  2. Preprocess MovieLens 32M data")
    print("  3. Train ML recommender model")
    print("  4. Verify everything is ready")
    print()
    
    mode = input("Choose mode:\n  1) Quick (MovieLens only, ~2 min)\n  2) Full (with TMDb, requires token)\n  3) Skip (data already processed)\n\nEnter 1, 2, or 3: ").strip()
    
    if mode == "3":
        print("\nSkipping preprocessing. Proceeding to training...")
        skip_preprocess = True
    else:
        skip_preprocess = False
    
    # Step 1: Check data
    print_step(1, "Checking data files")
    
    has_movielens = all([
        check_file_exists("raw/ml-32m/movies.csv", "MovieLens movies"),
        check_file_exists("raw/ml-32m/links.csv", "MovieLens links"),
    ])
    
    if not has_movielens:
        print("\n❌ MovieLens 32M data not found!")
        print("   Expected location: backend/raw/ml-32m/")
        print("   Download from: https://grouplens.org/datasets/movielens/")
        sys.exit(1)
    
    has_tmdb = check_file_exists("raw/tmdb/tmdb_metadata.csv", "TMDb metadata")
    has_processed = check_file_exists("data/movies_merged.csv", "Processed catalog")
    
    # Step 2: TMDb fetch (if mode 2 and not exists)
    if mode == "2" and not has_tmdb:
        print_step(2, "Fetching TMDb metadata")
        
        has_token = check_file_exists(".env", ".env file with TMDB_BEARER_TOKEN")
        
        if not has_token:
            print("\n⚠️  No .env file found!")
            print("   1. Get token from https://www.themoviedb.org/settings/api")
            print("   2. Create .env file:")
            print("      TMDB_BEARER_TOKEN=your_token_here")
            print()
            skip_tmdb = input("   Skip TMDb fetch? (y/n): ").strip().lower() == 'y'
            if skip_tmdb:
                print("   Skipping TMDb. Will use MovieLens data only.")
                mode = "1"
            else:
                print("\n❌ Cannot proceed without TMDb token.")
                sys.exit(1)
        else:
            print("\n⚠️  TMDb fetch takes time:")
            print("   - Test mode (500 movies): ~15 seconds")
            print("   - Full mode (87K movies): ~5-6 hours")
            print()
            test_mode = input("   Use test mode? (y/n): ").strip().lower() == 'y'
            
            if not test_mode:
                print("\n⚠️  Full TMDb fetch will take ~6 hours. Recommended to run overnight.")
                confirm = input("   Continue? (yes/no): ").strip().lower()
                if confirm != "yes":
                    print("   Aborting.")
                    sys.exit(0)
            
            success = run_command(
                "python -m scripts.fetch_tmdb_metadata",
                "Fetching TMDb metadata"
            )
            
            if not success:
                print("\n❌ TMDb fetch failed. Check your token and network connection.")
                fallback = input("   Continue with MovieLens only? (y/n): ").strip().lower() == 'y'
                if not fallback:
                    sys.exit(1)
                mode = "1"
    
    # Step 3: Preprocess
    if not skip_preprocess:
        print_step(3, "Preprocessing catalog")
        
        success = run_command(
            "python -m ml.preprocess_catalog",
            "Merging and cleaning data"
        )
        
        if not success:
            print("\n❌ Preprocessing failed!")
            sys.exit(1)
    
    # Step 4: Train model
    print_step(4, "Training ML model")
    
    if not check_file_exists("data/movies_merged.csv", "Processed catalog"):
        print("\n❌ No processed data found. Run preprocessing first.")
        sys.exit(1)
    
    success = run_command(
        "python -m ml.train_model",
        "Building TF-IDF features and training recommender"
    )
    
    if not success:
        print("\n❌ Training failed!")
        sys.exit(1)
    
    # Step 5: Verify
    print_step(5, "Verifying setup")
    
    artifacts_ok = all([
        check_file_exists("ml/artifacts/item_features.npz", "Feature matrix"),
        check_file_exists("ml/artifacts/tfidf_vectorizer.pkl", "TF-IDF vectorizer"),
        check_file_exists("ml/artifacts/genre_mlb.pkl", "Genre encoder"),
        check_file_exists("ml/artifacts/movies_meta.json", "Movie metadata"),
    ])
    
    if not artifacts_ok:
        print("\n❌ Some artifacts are missing!")
        sys.exit(1)
    
    # Success!
    print_header("✓ Setup Complete!")
    
    print("Your backend is ready to run:")
    print()
    print("  uvicorn app.main:app --reload --port 8000")
    print()
    print("Then visit:")
    print("  • API docs: http://localhost:8000/docs")
    print("  • Health check: http://localhost:8000/health")
    print()
    
    # Print stats
    import json
    try:
        with open("ml/artifacts/movies_meta.json") as f:
            movies = json.load(f)
            print(f"Loaded: {len(movies):,} movies in catalog")
    except:
        pass
    
    print()
    print("Documentation:")
    print("  • Documentation/Data/DATA_PIPELINE.md - Full pipeline docs")
    print("  • Documentation/Backend/MIGRATION_GUIDE.md - Migration from toy dataset")
    print("  • Documentation/Backend/backend_README.md - API documentation")
    print()
    
    start_now = input("Start server now? (y/n): ").strip().lower() == 'y'
    if start_now:
        print("\n🚀 Starting FastAPI server...")
        print("   Press Ctrl+C to stop")
        subprocess.run("uvicorn app.main:app --reload --port 8000", shell=True)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n❌ Setup interrupted by user.")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


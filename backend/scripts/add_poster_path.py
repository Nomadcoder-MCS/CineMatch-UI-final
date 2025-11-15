"""
Add poster_path and backdrop_path to existing TMDb metadata

This script re-fetches ONLY poster_path and backdrop_path for movies
that already have TMDb metadata, without re-fetching everything.

Much faster than re-running fetch_tmdb_metadata.py (~5-10 min vs ~20 min)
"""

import os
import time
import pandas as pd
import requests
from dotenv import load_dotenv

TMDB_CSV = "raw/tmdb/tmdb_metadata.csv"
OUTPUT_CSV = "raw/tmdb/tmdb_metadata_with_posters.csv"
BATCH_SIZE = 200

def bearer_headers():
    load_dotenv()
    token = os.getenv("TMDB_BEARER_TOKEN")
    if not token:
        raise SystemExit("Missing TMDB_BEARER_TOKEN in .env")
    return {"Authorization": f"Bearer {token}"}

def fetch_poster_path(session, tmdb_id, headers):
    """Fetch only poster_path and backdrop_path for a movie"""
    url = f"https://api.themoviedb.org/3/movie/{tmdb_id}"
    params = {"language": "en-US"}
    
    try:
        r = session.get(url, headers=headers, params=params, timeout=10)
        if r.status_code == 200:
            j = r.json()
            return {
                "poster_path": j.get("poster_path"),
                "backdrop_path": j.get("backdrop_path")
            }
        elif r.status_code == 429:
            wait = float(r.headers.get("Retry-After", 1.0))
            print(f"  Rate limited, waiting {wait}s...")
            time.sleep(wait)
            return fetch_poster_path(session, tmdb_id, headers)  # Retry
        else:
            return {"poster_path": None, "backdrop_path": None}
    except Exception as e:
        print(f"  Error fetching {tmdb_id}: {e}")
        return {"poster_path": None, "backdrop_path": None}

def main():
    print("="*70)
    print("Adding poster_path to existing TMDb metadata")
    print("="*70)
    
    # Check if file exists
    if not os.path.exists(TMDB_CSV):
        print(f"❌ TMDb metadata not found: {TMDB_CSV}")
        print("   Run: python -m scripts.fetch_tmdb_metadata first")
        return
    
    # Load existing metadata
    print(f"\n📂 Loading {TMDB_CSV}...")
    df = pd.read_csv(TMDB_CSV)
    print(f"   Loaded {len(df)} movies")
    
    # Check if poster_path already exists
    if "poster_path" in df.columns:
        print("\n✅ poster_path already exists!")
        print(f"   {df['poster_path'].notna().sum()} movies have poster_path")
        
        response = input("\n   Re-fetch poster_path for all movies? (y/N): ")
        if response.lower() != 'y':
            print("   Skipping. Use existing poster_path.")
            return
    
    # Filter to movies with valid tmdb_id (no errors)
    if "error" in df.columns:
        valid_df = df[df["error"].isna()].copy()
        print(f"\n   {len(valid_df)} valid movies (excluding {len(df) - len(valid_df)} errors)")
    else:
        valid_df = df.copy()
    
    # Fetch poster_path for each movie
    print(f"\n🎬 Fetching poster_path for {len(valid_df)} movies...")
    print("   This will take ~5-10 minutes...")
    
    poster_paths = []
    backdrop_paths = []
    headers = bearer_headers()
    
    with requests.Session() as s:
        for i, (idx, row) in enumerate(valid_df.iterrows(), 1):
            tmdb_id = row['tmdb_id']
            result = fetch_poster_path(s, tmdb_id, headers)
            
            poster_paths.append(result["poster_path"])
            backdrop_paths.append(result["backdrop_path"])
            
            if i % BATCH_SIZE == 0:
                print(f"   Progress: {i}/{len(valid_df)} ({i*100//len(valid_df)}%)")
            
            # Polite pacing
            time.sleep(0.02)
    
    # Add to dataframe
    valid_df["poster_path"] = poster_paths
    valid_df["backdrop_path"] = backdrop_paths
    
    # Merge back with error rows if any
    if "error" in df.columns and len(df) > len(valid_df):
        error_df = df[df["error"].notna()].copy()
        error_df["poster_path"] = None
        error_df["backdrop_path"] = None
        final_df = pd.concat([valid_df, error_df], ignore_index=True)
    else:
        final_df = valid_df
    
    # Save
    final_df.to_csv(OUTPUT_CSV, index=False, encoding="utf-8")
    
    # Stats
    has_poster = final_df["poster_path"].notna().sum()
    print(f"\n✅ Done!")
    print(f"   {has_poster}/{len(final_df)} movies have poster_path ({has_poster*100//len(final_df)}%)")
    print(f"   Saved to: {OUTPUT_CSV}")
    
    # Optionally replace original
    print(f"\n📝 To use this file, replace the original:")
    print(f"   mv {OUTPUT_CSV} {TMDB_CSV}")

if __name__ == "__main__":
    main()


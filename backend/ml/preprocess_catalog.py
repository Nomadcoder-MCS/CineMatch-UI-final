"""
Preprocess MovieLens 32M + TMDb metadata into clean training data

This script:
1. Loads MovieLens 32M movies.csv and links.csv
2. Optionally merges with TMDb metadata if available
3. Filters, cleans, and enriches the catalog
4. Outputs data/movies_merged.csv for ML training
"""

import pandas as pd
import numpy as np
from pathlib import Path
import re


def load_movielens_data():
    """Load MovieLens movies and links"""
    print("Loading MovieLens 32M data...")
    
    movies = pd.read_csv("raw/ml-32m/movies.csv")
    links = pd.read_csv("raw/ml-32m/links.csv")
    
    print(f"  - Loaded {len(movies):,} movies")
    print(f"  - Loaded {len(links):,} links")
    
    # Merge movies with links to get TMDb/IMDb IDs
    df = movies.merge(links, on="movieId", how="left")
    
    return df


def load_tmdb_metadata():
    """Load TMDb metadata if available"""
    tmdb_path = Path("raw/tmdb/tmdb_metadata.csv")
    
    if not tmdb_path.exists():
        print("\n⚠️  TMDb metadata not found. Skipping...")
        print("   Run: python -m scripts.fetch_tmdb_metadata to fetch it")
        return None
    
    print("\nLoading TMDb metadata...")
    tmdb = pd.read_csv(tmdb_path)
    
    # Clean up - drop error rows
    if "error" in tmdb.columns:
        before = len(tmdb)
        tmdb = tmdb[tmdb["error"].isna()].copy()
        print(f"  - Loaded {len(tmdb):,} valid TMDb records ({before - len(tmdb):,} errors dropped)")
    else:
        print(f"  - Loaded {len(tmdb):,} TMDb records")
    
    return tmdb


def extract_year_from_title(title):
    """Extract year from title like 'Toy Story (1995)'"""
    match = re.search(r'\((\d{4})\)', str(title))
    return int(match.group(1)) if match else None


def merge_with_tmdb(df, tmdb):
    """Merge MovieLens with TMDb data"""
    if tmdb is None:
        return df
    
    print("\nMerging with TMDb metadata...")
    
    # Rename tmdb_id to match
    if "tmdb_id" in tmdb.columns:
        tmdb = tmdb.rename(columns={"tmdb_id": "tmdbId"})
    
    # Merge on tmdbId
    merged = df.merge(
        tmdb,
        on="tmdbId",
        how="left",
        suffixes=("_ml", "_tmdb")
    )
    
    # Prefer TMDb data when available, fall back to MovieLens
    merged["title"] = merged["title_tmdb"].fillna(merged["title_ml"])
    merged["genres"] = merged["genres_tmdb"].fillna(merged["genres_ml"])
    merged["overview"] = merged["overview"].fillna("")
    
    # Parse year from MovieLens title as fallback
    merged["year_ml"] = merged["title_ml"].apply(extract_year_from_title)
    
    # Extract year from TMDb release_date
    merged["year_tmdb"] = pd.to_datetime(
        merged["release_date"], errors="coerce"
    ).dt.year
    
    merged["year"] = merged["year_tmdb"].fillna(merged["year_ml"]).astype("Int64")
    
    # Keep useful columns
    keep_cols = [
        "movieId", "tmdbId", "imdbId", "title", "year", 
        "genres", "overview", "runtime", "popularity",
        "vote_count", "vote_average", "keywords", 
        "cast_top", "director"
    ]
    
    # Only keep columns that exist
    keep_cols = [c for c in keep_cols if c in merged.columns]
    merged = merged[keep_cols]
    
    has_tmdb = merged["overview"].notna() & (merged["overview"] != "")
    print(f"  - {has_tmdb.sum():,} movies have TMDb metadata")
    print(f"  - {(~has_tmdb).sum():,} movies use MovieLens-only data")
    
    return merged


def clean_and_filter(df, min_year=1950, require_tmdb=False):
    """Clean and filter the catalog"""
    print("\nCleaning and filtering...")
    
    initial_count = len(df)
    
    # Filter by year
    if "year" in df.columns:
        df = df[df["year"] >= min_year].copy()
        print(f"  - Filtered to movies >= {min_year}: {len(df):,} remain")
    
    # Optionally require TMDb data (for better quality)
    if require_tmdb and "overview" in df.columns:
        df = df[df["overview"].notna() & (df["overview"] != "")].copy()
        print(f"  - Filtered to movies with TMDb data: {len(df):,} remain")
    
    # Remove movies with no genres
    df = df[df["genres"].notna() & (df["genres"] != "")].copy()
    print(f"  - Filtered to movies with genres: {len(df):,} remain")
    
    # Ensure overview exists (use title as fallback)
    if "overview" not in df.columns:
        df["overview"] = df["title"]
    else:
        df["overview"] = df["overview"].fillna(df["title"])
    
    # Fill missing runtime with median
    if "runtime" in df.columns:
        median_runtime = df["runtime"].median()
        df["runtime"] = df["runtime"].fillna(median_runtime).astype(int)
    else:
        df["runtime"] = 120  # Default 2 hours
    
    # Normalize genres (lowercase, clean pipes)
    df["genres"] = df["genres"].str.lower().str.replace(" ", "")
    
    # Sort by popularity or year
    if "popularity" in df.columns:
        df = df.sort_values("popularity", ascending=False)
    elif "year" in df.columns:
        df = df.sort_values("year", ascending=False)
    
    print(f"\n✓ Final catalog: {len(df):,} movies ({initial_count - len(df):,} filtered out)")
    
    return df


def add_streaming_services(df, sample_fraction=0.3):
    """
    Add mock streaming service availability
    
    In production, you'd integrate with JustWatch API or similar.
    For now, we'll assign services based on popularity/year.
    """
    print("\nAdding streaming service availability (mock)...")
    
    services = ["Netflix", "Hulu", "Amazon Prime", "HBO Max", "Disney+"]
    
    # Assign services based on criteria
    def assign_services(row):
        assigned = []
        
        # Popular movies appear on more services
        if "popularity" in row and pd.notna(row["popularity"]):
            if row["popularity"] > 50:
                assigned.append("Netflix")
            if row["popularity"] > 30:
                assigned.append("Amazon Prime")
        
        # Recent movies more likely on Disney+/HBO Max
        if "year" in row and pd.notna(row["year"]):
            if row["year"] >= 2015:
                assigned.append("HBO Max")
            if row["year"] >= 2010:
                assigned.append("Hulu")
        
        # Random assignment to add variety
        if np.random.random() < sample_fraction:
            assigned.extend(np.random.choice(services, size=min(2, len(services)), replace=False))
        
        # Ensure at least one service
        if not assigned:
            assigned.append(np.random.choice(services))
        
        return "|".join(sorted(set(assigned)))
    
    df["services"] = df.apply(assign_services, axis=1)
    
    # Count service distribution
    service_counts = {}
    for services_str in df["services"]:
        for service in services_str.split("|"):
            service_counts[service] = service_counts.get(service, 0) + 1
    
    print("  Service distribution:")
    for service, count in sorted(service_counts.items(), key=lambda x: -x[1]):
        print(f"    - {service}: {count:,} movies")
    
    return df


def save_processed_data(df, output_path="data/movies_merged.csv"):
    """Save processed catalog"""
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    df.to_csv(output_path, index=False, encoding="utf-8")
    print(f"\n✓ Saved processed catalog to {output_path}")
    print(f"  Columns: {list(df.columns)}")
    print(f"  Shape: {df.shape}")


def main():
    """Main preprocessing pipeline"""
    print("=" * 70)
    print("CineMatch Data Preprocessing: MovieLens 32M + TMDb")
    print("=" * 70)
    
    # Load MovieLens data
    df = load_movielens_data()
    
    # Load and merge TMDb if available
    tmdb = load_tmdb_metadata()
    df = merge_with_tmdb(df, tmdb)
    
    # Clean and filter
    # Set require_tmdb=True if you only want high-quality entries with TMDb data
    df = clean_and_filter(df, min_year=1980, require_tmdb=False)
    
    # Add streaming services (mock data)
    df = add_streaming_services(df, sample_fraction=0.3)
    
    # Save processed data
    save_processed_data(df)
    
    print("\n" + "=" * 70)
    print("✓ Preprocessing complete!")
    print("  Next step: python -m ml.train_model")
    print("=" * 70)


if __name__ == "__main__":
    main()


"""
Train content-based movie recommender model

This script:
1. Loads movies_sample.csv
2. Builds TF-IDF features from movie overviews
3. Creates multi-hot encoding for genres
4. Combines features into item feature matrix
5. Saves artifacts for use by the recommender
"""

import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import MultiLabelBinarizer, StandardScaler
from scipy.sparse import hstack, save_npz
import pickle
import json
from pathlib import Path


def load_movies(data_path: str = "backend/data/movies_sample.csv") -> pd.DataFrame:
    """Load and preprocess movies dataset"""
    print(f"Loading movies from {data_path}...")
    df = pd.DataFrame(pd.read_csv(data_path))
    
    # Parse pipe-separated genres and services
    df['genres_list'] = df['genres'].str.split('|')
    df['services_list'] = df['services'].str.split('|')
    
    # Fill any missing overviews
    df['overview'] = df['overview'].fillna('')
    
    print(f"Loaded {len(df)} movies")
    return df


def build_tfidf_features(df: pd.DataFrame) -> tuple:
    """Build TF-IDF features from movie overviews"""
    print("Building TF-IDF features from overviews...")
    
    vectorizer = TfidfVectorizer(
        max_features=500,
        ngram_range=(1, 2),
        stop_words='english',
        min_df=1
    )
    
    tfidf_matrix = vectorizer.fit_transform(df['overview'])
    print(f"TF-IDF matrix shape: {tfidf_matrix.shape}")
    
    return tfidf_matrix, vectorizer


def build_genre_features(df: pd.DataFrame) -> tuple:
    """Build multi-hot encoding for genres"""
    print("Building genre features...")
    
    mlb = MultiLabelBinarizer()
    genre_matrix = mlb.fit_transform(df['genres_list'])
    
    print(f"Genre matrix shape: {genre_matrix.shape}")
    print(f"Genres: {mlb.classes_}")
    
    return genre_matrix, mlb


def build_numeric_features(df: pd.DataFrame) -> np.ndarray:
    """Build and scale numeric features (year, runtime)"""
    print("Building numeric features...")
    
    numeric_features = df[['year', 'runtime']].values
    
    scaler = StandardScaler()
    numeric_scaled = scaler.fit_transform(numeric_features)
    
    print(f"Numeric features shape: {numeric_scaled.shape}")
    
    return numeric_scaled, scaler


def combine_features(tfidf_matrix, genre_matrix, numeric_matrix) -> np.ndarray:
    """Combine all feature matrices"""
    print("Combining features...")
    
    # Convert genre and numeric to sparse if needed
    from scipy.sparse import csr_matrix
    
    genre_sparse = csr_matrix(genre_matrix)
    numeric_sparse = csr_matrix(numeric_matrix)
    
    # Horizontal stack: [TF-IDF | Genres | Numeric]
    combined = hstack([tfidf_matrix, genre_sparse, numeric_sparse])
    
    print(f"Combined feature matrix shape: {combined.shape}")
    
    return combined


def save_artifacts(
    combined_features,
    tfidf_vectorizer,
    genre_mlb,
    numeric_scaler,
    movies_df,
    output_dir: str = "backend/ml/artifacts"
):
    """Save all artifacts for inference"""
    print(f"Saving artifacts to {output_dir}...")
    
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    # Save feature matrix
    save_npz(output_path / "item_features.npz", combined_features)
    
    # Save vectorizers
    with open(output_path / "tfidf_vectorizer.pkl", 'wb') as f:
        pickle.dump(tfidf_vectorizer, f)
    
    with open(output_path / "genre_mlb.pkl", 'wb') as f:
        pickle.dump(genre_mlb, f)
    
    with open(output_path / "numeric_scaler.pkl", 'wb') as f:
        pickle.dump(numeric_scaler, f)
    
    # Save movie metadata
    movies_meta = movies_df[['movie_id', 'title', 'year', 'runtime', 'overview', 'genres', 'services']].to_dict('records')
    
    with open(output_path / "movies_meta.json", 'w') as f:
        json.dump(movies_meta, f, indent=2)
    
    print(f"✓ Saved {len(movies_meta)} movie metadata entries")
    print(f"✓ Saved feature matrix: {combined_features.shape}")
    print("✓ All artifacts saved successfully!")


def main():
    """Main training pipeline"""
    print("=" * 60)
    print("CineMatch Content-Based Recommender - Training")
    print("=" * 60)
    
    # Load data
    df = load_movies()
    
    # Build features
    tfidf_matrix, tfidf_vectorizer = build_tfidf_features(df)
    genre_matrix, genre_mlb = build_genre_features(df)
    numeric_matrix, numeric_scaler = build_numeric_features(df)
    
    # Combine features
    combined_features = combine_features(tfidf_matrix, genre_matrix, numeric_matrix)
    
    # Save everything
    save_artifacts(
        combined_features,
        tfidf_vectorizer,
        genre_mlb,
        numeric_scaler,
        df
    )
    
    print("=" * 60)
    print("Training complete! You can now start the FastAPI server.")
    print("=" * 60)


if __name__ == "__main__":
    main()


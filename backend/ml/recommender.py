"""
CineMatch Content-Based Recommender

Uses pre-trained artifacts to generate personalized movie recommendations
based on user preferences and viewing history.
"""

import numpy as np
import pandas as pd
from scipy.sparse import load_npz, csr_matrix
from sklearn.metrics.pairwise import cosine_similarity
import pickle
import json
from pathlib import Path
from typing import Optional
from dataclasses import dataclass


@dataclass
class UserPreferences:
    """
    User preferences for recommendations
    
    Semantics:
    - liked_movie_ids: Positive preference - used to build user profile
    - disliked_movie_ids: Negative signal - can down-weight but not hard exclude
    - not_interested_ids: Hard exclusion - these movies should NEVER appear in recommendations
    """
    user_id: Optional[str] = None
    liked_movie_ids: list[int] = None
    disliked_movie_ids: list[int] = None
    not_interested_ids: list[int] = None  # Hard exclusion set
    preferred_genres: list[str] = None
    services: list[str] = None
    runtime_min: Optional[int] = None
    runtime_max: Optional[int] = None
    
    def __post_init__(self):
        # Initialize empty lists if None
        self.liked_movie_ids = self.liked_movie_ids or []
        self.disliked_movie_ids = self.disliked_movie_ids or []
        self.not_interested_ids = self.not_interested_ids or []  # Hard exclusion
        self.preferred_genres = self.preferred_genres or []
        self.services = self.services or []


class CineMatchRecommender:
    """Content-based movie recommender using TF-IDF + genres + cosine similarity"""
    
    # TMDb image base URL
    TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/"
    POSTER_SIZE = "w500"  # Options: w92, w154, w185, w342, w500, w780, original
    
    def __init__(self, artifacts_dir: str = "ml/artifacts"):
        """Load pre-trained artifacts"""
        self.artifacts_dir = Path(artifacts_dir)
        
        print(f"Loading recommender artifacts from {self.artifacts_dir}...")
        
        # Load feature matrix
        self.item_features = load_npz(self.artifacts_dir / "item_features.npz")
        
        # Load vectorizers
        with open(self.artifacts_dir / "tfidf_vectorizer.pkl", 'rb') as f:
            self.tfidf_vectorizer = pickle.load(f)
        
        with open(self.artifacts_dir / "genre_mlb.pkl", 'rb') as f:
            self.genre_mlb = pickle.load(f)
        
        with open(self.artifacts_dir / "numeric_scaler.pkl", 'rb') as f:
            self.numeric_scaler = pickle.load(f)
        
        # Load movie metadata
        with open(self.artifacts_dir / "movies_meta.json", 'r') as f:
            self.movies_meta = json.load(f)
        
        # Create movie_id to index mapping
        self.movie_id_to_idx = {
            movie['movieId']: idx 
            for idx, movie in enumerate(self.movies_meta)
        }
        
        print(f"✓ Loaded {len(self.movies_meta)} movies")
        print(f"✓ Feature matrix shape: {self.item_features.shape}")
    
    def build_user_profile(self, prefs: UserPreferences) -> np.ndarray:
        """
        Build user profile vector from preferences
        
        **How per-user profiles are built (NO hard-coded data):**
        
        Strategy (in order of preference):
        1. **Collaborative signal** (if user has liked movies):
           - Average feature vectors of liked movies
           - This captures user's actual taste from their feedback
           - Example: User liked "Inception" and "Matrix" → profile is sci-fi/action
        
        2. **Explicit preferences** (if no likes but has preferred genres):
           - Build synthetic profile from preferred genres
           - Boost genre features in profile vector
           - Example: User selected "Action" and "Comedy" → profile has those genres
        
        3. **Cold-start fallback** (if no likes and no preferences):
           - Use average of all movies in catalog
           - This is NOT a "demo behavior" - it's proper cold-start handling
           - Provides baseline recommendations until user gives feedback
        
        The cold-start fallback is intentional and ensures new users
        still get recommendations. As users like movies or set preferences,
        the profile becomes increasingly personalized.
        """
        user_profile = None
        
        # Strategy 1: Average liked movies
        if prefs.liked_movie_ids:
            liked_indices = [
                self.movie_id_to_idx[mid] 
                for mid in prefs.liked_movie_ids 
                if mid in self.movie_id_to_idx
            ]
            
            if liked_indices:
                liked_features = self.item_features[liked_indices]
                user_profile = np.asarray(liked_features.mean(axis=0))
                print(f"Built profile from {len(liked_indices)} liked movies")
        
        # Strategy 2: Build from explicit preferences if no likes
        if user_profile is None and (prefs.preferred_genres or prefs.services):
            # Create a synthetic "ideal movie" with preferred genres
            user_profile = np.zeros((1, self.item_features.shape[1]))
            
            # Boost genre features
            if prefs.preferred_genres:
                genre_indices = [
                    i for i, g in enumerate(self.genre_mlb.classes_)
                    if g in prefs.preferred_genres
                ]
                if genre_indices:
                    # Genres start after TF-IDF features
                    tfidf_size = len(self.tfidf_vectorizer.get_feature_names_out())
                    for idx in genre_indices:
                        user_profile[0, tfidf_size + idx] = 1.0
                    
                    print(f"Built profile from {len(genre_indices)} preferred genres")
        
        # Fallback: return average of all movies (cold start)
        if user_profile is None:
            user_profile = np.asarray(self.item_features.mean(axis=0))
            print("Using average profile (cold start)")
        
        return user_profile
    
    def apply_filters(
        self, 
        prefs: UserPreferences,
        candidate_indices: list[int]
    ) -> list[int]:
        """
        Apply filters to candidate movies
        
        Filter order:
        1. Hard exclusions (not_interested_ids) - NEVER show these
        2. Already liked/disliked - avoid duplicates
        3. Runtime, genre, service filters - user preferences
        """
        filtered = []
        
        for idx in candidate_indices:
            movie = self.movies_meta[idx]
            movie_id = movie['movieId']
            
            # HARD EXCLUSION: "Not interested" movies should NEVER appear
            if movie_id in prefs.not_interested_ids:
                continue
            
            # Exclude already liked (to avoid duplicates)
            if movie_id in prefs.liked_movie_ids:
                continue
            
            # Exclude disliked (can optionally down-weight instead, but for now exclude)
            if movie_id in prefs.disliked_movie_ids:
                continue
            
            # Runtime filter
            runtime = movie['runtime']
            if prefs.runtime_min and runtime < prefs.runtime_min:
                continue
            if prefs.runtime_max and runtime > prefs.runtime_max:
                continue
            
            # Genre filter
            if prefs.preferred_genres:
                movie_genres = movie['genres'].split('|')
                if not any(g in movie_genres for g in prefs.preferred_genres):
                    continue
            
            # Service filter
            if prefs.services:
                movie_services = movie['services'].split('|')
                if not any(s in movie_services for s in prefs.services):
                    continue
            
            filtered.append(idx)
        
        return filtered
    
    def generate_explanation(self, movie: dict, prefs: UserPreferences) -> str:
        """Generate human-readable explanation for recommendation"""
        reasons = []
        
        movie_genres = movie['genres'].split('|')
        movie_services = movie['services'].split('|')
        
        # Check genre matches
        if prefs.preferred_genres:
            matching_genres = [g for g in movie_genres if g in prefs.preferred_genres]
            if matching_genres:
                reasons.append(f"Matches your preferred genres: {', '.join(matching_genres)}")
        
        # Check service availability
        if prefs.services:
            matching_services = [s for s in movie_services if s in prefs.services]
            if matching_services:
                reasons.append(f"Available on {', '.join(matching_services)}")
        
        # Check if similar to liked movies
        if prefs.liked_movie_ids:
            reasons.append("Similar to movies you've liked")
        
        # Default explanation
        if not reasons:
            reasons.append(f"Popular {', '.join(movie_genres[:2])} movie")
        
        return " • ".join(reasons)
    
    def recommend(
        self, 
        prefs: UserPreferences, 
        top_k: int = 20
    ) -> list[dict]:
        """
        Generate top-k movie recommendations
        
        Returns list of dicts with movie metadata + score + explanation
        """
        print(f"\n{'='*60}")
        print(f"Generating recommendations for user: {prefs.user_id}")
        print(f"{'='*60}")
        
        # Build user profile vector
        user_profile = self.build_user_profile(prefs)
        
        # Compute cosine similarity with all movies
        similarities = cosine_similarity(user_profile, self.item_features)[0]
        
        # Get top candidates (before filtering)
        top_indices = np.argsort(similarities)[::-1][:top_k * 3]  # Get 3x for filtering
        
        # Apply filters
        filtered_indices = self.apply_filters(prefs, top_indices.tolist())
        
        # Take top_k after filtering
        final_indices = filtered_indices[:top_k]
        
        print(f"✓ Filtered to {len(final_indices)} recommendations")
        
        # Build result list
        recommendations = []
        for idx in final_indices:
            movie = self.movies_meta[idx]
            poster_path = movie.get('poster_path')
            
            rec = {
                "movie_id": movie['movieId'],
                "title": movie['title'],
                "year": movie['year'],
                "runtime": movie['runtime'],
                "overview": movie['overview'],
                "genres": movie['genres'].split('|'),
                "services": movie['services'].split('|'),
                "poster_url": self.build_poster_url(poster_path),
                "poster_path": poster_path,  # Keep raw path for debugging
                "score": float(similarities[idx]),
                "explanation": self.generate_explanation(movie, prefs)
            }
            recommendations.append(rec)
        
        return recommendations
    
    def build_poster_url(self, poster_path: Optional[str]) -> Optional[str]:
        """
        Build full TMDb poster URL from poster_path
        
        Args:
            poster_path: TMDb poster path (e.g., "/abc123.jpg") or None/NaN
        
        Returns:
            Full URL (e.g., "https://image.tmdb.org/t/p/w500/abc123.jpg") or None
        """
        # Handle None, NaN, empty string, or the string "nan" (from JSON serialization)
        if not poster_path or pd.isna(poster_path) or str(poster_path).lower() == 'nan' or str(poster_path).strip() == '':
            return None
        
        # poster_path should start with '/', but handle cases where it doesn't
        poster_path_str = str(poster_path).strip()
        if not poster_path_str.startswith('/'):
            poster_path_str = '/' + poster_path_str
        
        return f"{self.TMDB_IMAGE_BASE}{self.POSTER_SIZE}{poster_path_str}"
    
    def get_movie_by_id(self, movie_id: int) -> Optional[dict]:
        """Get movie metadata by ID"""
        for movie in self.movies_meta:
            if movie['movieId'] == movie_id:
                poster_path = movie.get('poster_path')
                return {
                    "movie_id": movie['movieId'],
                    "title": movie['title'],
                    "year": movie['year'],
                    "runtime": movie['runtime'],
                    "overview": movie['overview'],
                    "genres": movie['genres'].split('|'),
                    "services": movie['services'].split('|'),
                    "poster_url": self.build_poster_url(poster_path),
                    "poster_path": poster_path
                }
        return None
    
    def get_all_genres(self) -> list[str]:
        """Get list of all genres in the dataset"""
        return self.genre_mlb.classes_.tolist()
    
    def get_all_services(self) -> list[str]:
        """Get list of all streaming services in the dataset"""
        services_set = set()
        for movie in self.movies_meta:
            for service in movie['services'].split('|'):
                services_set.add(service)
        return sorted(list(services_set))


# Singleton instance for FastAPI
_recommender_instance = None


def get_recommender() -> CineMatchRecommender:
    """Get or create recommender singleton"""
    global _recommender_instance
    if _recommender_instance is None:
        _recommender_instance = CineMatchRecommender()
    return _recommender_instance


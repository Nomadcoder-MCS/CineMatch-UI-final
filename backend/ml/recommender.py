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
        
        **Hybrid approach - combines learned taste with stated preferences:**
        
        Strategy (in order of preference):
        1. **Hybrid signal** (if user has both likes AND preferred genres):
           - 80% weight from liked movies (learned taste)
           - 20% boost from preferred genres (stated preferences)
           - This ensures preferred genres are ALWAYS considered, not just on cold start
           - Example: User liked Action movies but prefers Animation → gets both
        
        2. **Collaborative signal only** (if user has liked movies but no stated preferences):
           - Average feature vectors of liked movies
           - Falls back to learned taste when preferences aren't set
        
        3. **Explicit preferences** (if no likes but has preferred genres):
           - Build synthetic profile from preferred genres
           - Boost genre features in profile vector
           - Example: User selected "Animation" and "Sci-Fi" → profile has those genres
        
        4. **Cold-start fallback** (if no likes and no preferences):
           - Use average of all movies in catalog
           - Provides baseline recommendations until user gives feedback
        """
        user_profile = None
        genre_boost_profile = None
        
        # Build base profile from liked movies
        if prefs.liked_movie_ids:
            liked_indices = [
                self.movie_id_to_idx[mid] 
                for mid in prefs.liked_movie_ids 
                if mid in self.movie_id_to_idx
            ]
            
            if liked_indices:
                liked_features = self.item_features[liked_indices]
                user_profile = np.asarray(liked_features.mean(axis=0))
                print(f"Built base profile from {len(liked_indices)} liked movies")
        
        # Build genre boost from preferred genres
        if prefs.preferred_genres:
            genre_indices = [
                i for i, g in enumerate(self.genre_mlb.classes_)
                if g.lower() in [pg.lower() for pg in prefs.preferred_genres]
            ]
            if genre_indices:
                # Create genre boost vector
                tfidf_size = len(self.tfidf_vectorizer.get_feature_names_out())
                genre_boost_profile = np.zeros((1, self.item_features.shape[1]))
                for idx in genre_indices:
                    genre_boost_profile[0, tfidf_size + idx] = 1.0
                
                print(f"Created genre boost from {len(genre_indices)} preferred genres: {prefs.preferred_genres}")
        
        # Combine profiles based on what's available
        if user_profile is not None and genre_boost_profile is not None:
            # Hybrid: 80% liked movies + 20% preferred genres
            user_profile = 0.8 * user_profile + 0.2 * genre_boost_profile
            print("  → Using hybrid profile (80% likes + 20% preferred genres)")
        elif user_profile is None and genre_boost_profile is not None:
            # Only preferences available
            user_profile = genre_boost_profile
            print("  → Using genre-based profile (no likes yet)")
        elif user_profile is None:
            # Cold start: no likes, no preferences
            user_profile = np.asarray(self.item_features.mean(axis=0))
            print("  → Using cold-start profile (no likes or preferences)")
        else:
            # Only likes available
            print("  → Using likes-only profile (no genre preferences set)")
        
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
    
    def filter_by_year_bucket(self, movie: dict, year_bucket: str) -> bool:
        """Check if movie falls in the given year bucket"""
        year = movie.get('year')
        if not year:
            return False
        
        if year_bucket == 'recent':
            return year >= 2018
        elif year_bucket == '2010s':
            return 2010 <= year <= 2019
        elif year_bucket == '2000s':
            return 2000 <= year <= 2009
        elif year_bucket == '90s':
            return 1990 <= year <= 1999
        elif year_bucket == 'classic':
            return year < 1990
        return True
    
    def filter_by_runtime_bucket(self, movie: dict, runtime_bucket: str) -> bool:
        """Check if movie falls in the given runtime bucket"""
        runtime = movie.get('runtime')
        if not runtime:
            return False
        
        if runtime_bucket == 'short':
            return runtime < 90
        elif runtime_bucket == 'medium':
            return 90 <= runtime <= 150
        elif runtime_bucket == 'long':
            return runtime > 150
        return True
    
    def compute_popularity_scores(self) -> np.ndarray:
        """
        Compute popularity scores for all movies
        Simple heuristic: normalize year (recent = more popular)
        In production, you'd use actual view counts, ratings, etc.
        """
        years = []
        for movie in self.movies_meta:
            year = movie.get('year', 2000)
            # Handle NaN values in year metadata
            if year is None or (isinstance(year, float) and not np.isfinite(year)):
                year = 2000
            years.append(year)
        
        years = np.array(years)
        
        # Normalize to [0, 1] with recent years scoring higher
        min_year = years.min()
        max_year = years.max()
        if max_year > min_year:
            popularity = (years - min_year) / (max_year - min_year)
        else:
            popularity = np.ones(len(years))
        
        # Ensure no NaN values in output
        popularity = np.nan_to_num(popularity, nan=0.5, posinf=1.0, neginf=0.0)
        
        return popularity
    
    def diversify_by_genre(
        self,
        ranked_indices: list[int],
        preferred_genres: list[str],
        k: int,
        max_per_genre: int = 6
    ) -> list[int]:
        """
        Diversify recommendations by limiting movies per genre
        
        Args:
            ranked_indices: Movie indices sorted by score (descending)
            preferred_genres: User's preferred genres (case-insensitive)
            k: Target number of recommendations
            max_per_genre: Maximum movies allowed per genre
        
        Returns:
            Diversified list of movie indices
        """
        preferred_genres_lower = [g.lower() for g in preferred_genres]
        genre_counts = {}
        diversified = []
        
        for idx in ranked_indices:
            if len(diversified) >= k:
                break
            
            movie = self.movies_meta[idx]
            movie_genres = movie.get('genres', '').split('|')
            
            # Find primary genre (prefer preferred genres if present)
            primary_genre = None
            for g in movie_genres:
                if g.lower() in preferred_genres_lower:
                    primary_genre = g.lower()
                    break
            
            # If no preferred genre found, use first genre
            if primary_genre is None and movie_genres:
                primary_genre = movie_genres[0].lower()
            
            if primary_genre is None:
                continue  # Skip movies with no genres
            
            # Check if we've hit the limit for this genre
            count = genre_counts.get(primary_genre, 0)
            if count < max_per_genre:
                diversified.append(idx)
                genre_counts[primary_genre] = count + 1
        
        return diversified
    
    def add_exploration_movies(
        self,
        current_recommendations: list[int],
        preferred_genres: list[str],
        all_scores: np.ndarray,
        prefs: UserPreferences,
        num_explore: int = 3
    ) -> list[int]:
        """
        Add exploration movies from underrepresented preferred genres
        
        Args:
            current_recommendations: Current list of recommended indices
            preferred_genres: User's preferred genres
            all_scores: Similarity scores for all movies
            prefs: User preferences (for exclusions)
            num_explore: Number of exploration movies to add
        
        Returns:
            Updated list with exploration movies mixed in
        """
        if not preferred_genres:
            return current_recommendations
        
        # Count genres in current recommendations
        genre_counts = {}
        current_set = set(current_recommendations)
        
        for idx in current_recommendations:
            movie = self.movies_meta[idx]
            movie_genres = movie.get('genres', '').split('|')
            for g in movie_genres:
                g_lower = g.lower()
                if g_lower in [pg.lower() for pg in preferred_genres]:
                    genre_counts[g_lower] = genre_counts.get(g_lower, 0) + 1
        
        # Find underrepresented genres (< 2 movies)
        underrep_genres = [
            g for g in preferred_genres
            if genre_counts.get(g.lower(), 0) < 2
        ]
        
        if not underrep_genres:
            return current_recommendations  # All genres well represented
        
        print(f"  Adding exploration for underrepresented genres: {underrep_genres}")
        
        # Find high-scoring movies in underrepresented genres
        exploration_candidates = []
        for idx, score in enumerate(all_scores):
            if idx in current_set:
                continue
            
            movie = self.movies_meta[idx]
            movie_id = movie['movieId']
            
            # Skip excluded movies
            if (movie_id in prefs.not_interested_ids or
                movie_id in prefs.liked_movie_ids or
                movie_id in prefs.disliked_movie_ids):
                continue
            
            # Check if movie matches underrepresented genre
            movie_genres = [g.lower() for g in movie.get('genres', '').split('|')]
            for underrep_genre in underrep_genres:
                if underrep_genre.lower() in movie_genres:
                    exploration_candidates.append((idx, score))
                    break
        
        # Sort by score and take top num_explore
        exploration_candidates.sort(key=lambda x: x[1], reverse=True)
        exploration_indices = [idx for idx, _ in exploration_candidates[:num_explore]]
        
        # Mix exploration movies into recommendations (every ~7th position)
        if exploration_indices:
            result = list(current_recommendations)
            insert_positions = [7, 14, 19]  # Positions to insert exploration movies
            
            for i, explore_idx in enumerate(exploration_indices):
                if i < len(insert_positions) and insert_positions[i] < len(result):
                    result.insert(insert_positions[i], explore_idx)
                else:
                    result.append(explore_idx)
            
            print(f"  → Added {len(exploration_indices)} exploration movies")
            return result[:len(current_recommendations) + len(exploration_indices)]
        
        return current_recommendations
    
    def recommend(
        self, 
        prefs: UserPreferences, 
        top_k: int = 20,
        mode: str = "because_liked",
        filter_genre: str = None,
        filter_service: str = None,
        filter_year_bucket: str = None,
        filter_runtime_bucket: str = None
    ) -> list[dict]:
        """
        Generate top-k movie recommendations
        
        Args:
            prefs: User preferences (likes, dislikes, etc.)
            top_k: Number of recommendations to return
            mode: Recommendation mode (because_liked, trending, genre, service, year, runtime)
            filter_genre: Genre to filter by (for genre mode)
            filter_service: Service to filter by (for service mode)
            filter_year_bucket: Year bucket to filter by (for year mode)
            filter_runtime_bucket: Runtime bucket to filter by (for runtime mode)
        
        Returns list of dicts with movie metadata + score + explanation
        """
        print(f"\n{'='*60}")
        print(f"Generating recommendations for user: {prefs.user_id}")
        print(f"  Mode: {mode}")
        print(f"{'='*60}")
        
        # Build user profile vector
        user_profile = self.build_user_profile(prefs)
        
        # Compute cosine similarity with all movies
        similarities = cosine_similarity(user_profile, self.item_features)[0]
        
        # Handle NaN values in similarities (can occur with sparse/zero vectors)
        similarities = np.nan_to_num(similarities, nan=0.0, posinf=1.0, neginf=0.0)
        
        # Apply mode-specific scoring
        if mode == "trending":
            # Blend similarity with popularity
            popularity = self.compute_popularity_scores()
            combined_scores = 0.7 * similarities + 0.3 * popularity
            print("  Applied trending boost (70% similarity + 30% popularity)")
        else:
            combined_scores = similarities.copy()
        
        # Apply genre boosting if user has preferred genres
        if prefs.preferred_genres and mode not in ["genre"]:  # Don't double-boost in genre mode
            preferred_genres_lower = [g.lower() for g in prefs.preferred_genres]
            for idx, movie in enumerate(self.movies_meta):
                movie_genres = [g.lower() for g in movie.get('genres', '').split('|')]
                # Boost score by 0.15 if movie has at least one preferred genre
                if any(g in preferred_genres_lower for g in movie_genres):
                    combined_scores[idx] += 0.15
            print(f"  Applied genre boost for preferred genres: {prefs.preferred_genres}")
        
        # Get top candidates (before filtering)
        top_indices = np.argsort(combined_scores)[::-1][:top_k * 10]  # Get 10x for filtering
        
        # Apply mode-specific filters
        filtered_indices = []
        for idx in top_indices:
            movie = self.movies_meta[idx]
            movie_id = movie['movieId']
            
            # Always exclude not_interested, liked, and disliked
            if movie_id in prefs.not_interested_ids:
                continue
            if movie_id in prefs.liked_movie_ids:
                continue
            if movie_id in prefs.disliked_movie_ids:
                continue
            
            # Mode-specific filters
            if mode == "genre" and filter_genre:
                movie_genres = movie['genres'].split('|')
                if filter_genre.lower() not in [g.lower() for g in movie_genres]:
                    continue
            
            if mode == "service" and filter_service:
                movie_services = movie['services'].split('|')
                if filter_service not in movie_services:
                    continue
            
            if mode == "year" and filter_year_bucket:
                if not self.filter_by_year_bucket(movie, filter_year_bucket):
                    continue
            
            if mode == "runtime" and filter_runtime_bucket:
                if not self.filter_by_runtime_bucket(movie, filter_runtime_bucket):
                    continue
            
            # Apply user preference filters (for all modes)
            # Runtime filter
            runtime = movie['runtime']
            if prefs.runtime_min and runtime < prefs.runtime_min:
                continue
            if prefs.runtime_max and runtime > prefs.runtime_max:
                continue
            
            # Genre filter (only if not in genre mode to avoid double-filtering)
            if mode != "genre" and prefs.preferred_genres:
                movie_genres = movie['genres'].split('|')
                if not any(g in movie_genres for g in prefs.preferred_genres):
                    continue
            
            # Service filter (only if not in service mode)
            if mode != "service" and prefs.services:
                movie_services = movie['services'].split('|')
                if not any(s in movie_services for s in prefs.services):
                    continue
            
            filtered_indices.append(idx)
            
            # Stop once we have enough (get extra for diversification)
            if len(filtered_indices) >= top_k * 2:
                break
        
        print(f"✓ Filtered to {len(filtered_indices)} candidate recommendations")
        
        # Apply genre diversification if user has preferred genres
        if prefs.preferred_genres and len(filtered_indices) > top_k:
            diversified_indices = self.diversify_by_genre(
                filtered_indices,
                prefs.preferred_genres,
                k=top_k,
                max_per_genre=6
            )
            print(f"  → Diversified to {len(diversified_indices)} recommendations (max 6 per genre)")
        else:
            diversified_indices = filtered_indices[:top_k]
        
        # Add exploration component for underrepresented genres
        if prefs.preferred_genres and mode == "because_liked":
            final_indices = self.add_exploration_movies(
                diversified_indices,
                prefs.preferred_genres,
                combined_scores,
                prefs,
                num_explore=2
            )
        else:
            final_indices = diversified_indices
        
        # Ensure we don't exceed top_k (exploration might add a few extra)
        final_indices = final_indices[:top_k + 2]  # Allow 2 extra for exploration
        
        print(f"✓ Final: {len(final_indices)} personalized recommendations")
        
        # Build result list
        recommendations = []
        for idx in final_indices:
            movie = self.movies_meta[idx]
            poster_path = movie.get('poster_path')
            
            # Ensure score is JSON-serializable (handle NaN, inf, etc.)
            score = float(combined_scores[idx])
            if not np.isfinite(score):
                score = 0.0
            
            # Sanitize year and runtime (can be NaN in metadata)
            year = movie.get('year')
            if year is None or (isinstance(year, float) and not np.isfinite(year)):
                year = 2000  # Default fallback year
            else:
                year = int(year)
            
            runtime = movie.get('runtime')
            if runtime is None or (isinstance(runtime, float) and not np.isfinite(runtime)):
                runtime = 120  # Default fallback runtime
            else:
                runtime = int(runtime)
            
            rec = {
                "movie_id": movie['movieId'],
                "title": movie['title'],
                "year": year,
                "runtime": runtime,
                "overview": movie['overview'],
                "genres": movie['genres'].split('|'),
                "services": movie['services'].split('|'),
                "poster_url": self.build_poster_url(poster_path),
                "poster_path": poster_path,  # Keep raw path for debugging
                "score": score,
                "explanation": self.generate_explanation(movie, prefs)
            }
            recommendations.append(rec)
        
        # Final sanitization pass to ensure JSON compliance
        recommendations = self.sanitize_for_json(recommendations)
        
        return recommendations
    
    def sanitize_for_json(self, obj):
        """
        Recursively sanitize an object to ensure JSON compliance
        Handles NaN, inf, and other non-JSON-compliant values
        """
        if isinstance(obj, dict):
            return {k: self.sanitize_for_json(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [self.sanitize_for_json(item) for item in obj]
        elif isinstance(obj, float):
            if not np.isfinite(obj):
                return None  # or 0, or some default
            return obj
        elif isinstance(obj, (np.integer, np.floating)):
            val = float(obj)
            if not np.isfinite(val):
                return None
            return val
        elif pd.isna(obj):
            return None
        else:
            return obj
    
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


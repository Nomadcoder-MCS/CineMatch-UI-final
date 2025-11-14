"""
Tests for ML recommender
"""

import pytest
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from ml.recommender import CineMatchRecommender, UserPreferences


def test_recommender_loads():
    """Test that recommender loads artifacts successfully"""
    recommender = CineMatchRecommender()
    
    assert recommender is not None
    assert len(recommender.movies_meta) > 0
    assert recommender.item_features.shape[0] == len(recommender.movies_meta)


def test_recommend_cold_start():
    """Test recommendations with no user history"""
    recommender = CineMatchRecommender()
    
    prefs = UserPreferences(
        user_id="test_user",
        preferred_genres=["Sci-Fi", "Action"],
        services=["Netflix"]
    )
    
    recs = recommender.recommend(prefs, top_k=5)
    
    assert len(recs) > 0
    assert len(recs) <= 5
    
    # Check structure
    for rec in recs:
        assert "movie_id" in rec
        assert "title" in rec
        assert "score" in rec
        assert "explanation" in rec
        assert isinstance(rec["genres"], list)


def test_recommend_with_likes():
    """Test recommendations based on liked movies"""
    recommender = CineMatchRecommender()
    
    # Like first sci-fi movie
    prefs = UserPreferences(
        user_id="test_user",
        liked_movie_ids=[1],  # Neon City (Sci-Fi)
        services=["Netflix"]
    )
    
    recs = recommender.recommend(prefs, top_k=10)
    
    assert len(recs) > 0
    
    # Should not include the liked movie
    rec_ids = [r["movie_id"] for r in recs]
    assert 1 not in rec_ids


def test_genre_filtering():
    """Test that genre filtering works"""
    recommender = CineMatchRecommender()
    
    prefs = UserPreferences(
        user_id="test_user",
        preferred_genres=["Comedy"]
    )
    
    recs = recommender.recommend(prefs, top_k=10)
    
    # All recommendations should have Comedy genre
    for rec in recs:
        assert "Comedy" in rec["genres"], f"Expected Comedy in {rec['genres']}"


def test_runtime_filtering():
    """Test runtime filtering"""
    recommender = CineMatchRecommender()
    
    prefs = UserPreferences(
        user_id="test_user",
        runtime_min=90,
        runtime_max=120
    )
    
    recs = recommender.recommend(prefs, top_k=10)
    
    # All recommendations should be within runtime range
    for rec in recs:
        assert 90 <= rec["runtime"] <= 120, f"Runtime {rec['runtime']} outside range"


def test_get_movie_by_id():
    """Test fetching movie by ID"""
    recommender = CineMatchRecommender()
    
    movie = recommender.get_movie_by_id(1)
    
    assert movie is not None
    assert movie["movie_id"] == 1
    assert "title" in movie
    assert "genres" in movie


def test_get_all_genres():
    """Test getting all genres"""
    recommender = CineMatchRecommender()
    
    genres = recommender.get_all_genres()
    
    assert isinstance(genres, list)
    assert len(genres) > 0
    assert "Sci-Fi" in genres or "Action" in genres


if __name__ == "__main__":
    pytest.main([__file__, "-v"])


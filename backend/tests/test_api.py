"""
Tests for FastAPI endpoints
"""

import pytest
import sys
from pathlib import Path
from fastapi.testclient import TestClient

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.main import app

client = TestClient(app)


def test_root():
    """Test root endpoint"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "CineMatch ML Backend"
    assert data["status"] == "running"


def test_health():
    """Test health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "num_items" in data
    assert data["num_items"] > 0


def test_get_recommendations():
    """Test recommendations endpoint"""
    payload = {
        "user_id": "test_user",
        "liked_movie_ids": [],
        "disliked_movie_ids": [],
        "preferred_genres": ["Sci-Fi", "Action"],
        "services": ["Netflix"],
        "runtime_min": None,
        "runtime_max": None
    }
    
    response = client.post("/api/recommendations", json=payload)
    assert response.status_code == 200
    
    data = response.json()
    assert "recommendations" in data
    assert "count" in data
    assert data["count"] > 0
    
    # Check recommendation structure
    rec = data["recommendations"][0]
    assert "movie_id" in rec
    assert "title" in rec
    assert "score" in rec
    assert "explanation" in rec


def test_get_genres():
    """Test genres endpoint"""
    response = client.get("/api/genres")
    assert response.status_code == 200
    data = response.json()
    assert "genres" in data
    assert isinstance(data["genres"], list)
    assert len(data["genres"]) > 0


def test_get_services():
    """Test services endpoint"""
    response = client.get("/api/services")
    assert response.status_code == 200
    data = response.json()
    assert "services" in data
    assert isinstance(data["services"], list)


def test_get_movie():
    """Test get movie endpoint"""
    response = client.get("/api/movies/1")
    assert response.status_code == 200
    data = response.json()
    assert data["movie_id"] == 1
    assert "title" in data


def test_get_movie_not_found():
    """Test get movie with invalid ID"""
    response = client.get("/api/movies/99999")
    assert response.status_code == 404


def test_watchlist_operations():
    """Test watchlist CRUD operations"""
    user_id = "test_user_watchlist"
    
    # Get empty watchlist
    response = client.get(f"/api/watchlist/{user_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 0
    
    # Add movie to watchlist
    response = client.post(
        f"/api/watchlist/{user_id}",
        json={"movie_id": 1}
    )
    assert response.status_code == 200
    
    # Get watchlist (should have 1 item)
    response = client.get(f"/api/watchlist/{user_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 1
    assert data["items"][0]["movie_id"] == 1
    
    # Mark as watched
    response = client.put(f"/api/watchlist/{user_id}/1/watched?watched=true")
    assert response.status_code == 200
    
    # Remove from watchlist
    response = client.delete(f"/api/watchlist/{user_id}/1")
    assert response.status_code == 200
    
    # Verify empty again
    response = client.get(f"/api/watchlist/{user_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])


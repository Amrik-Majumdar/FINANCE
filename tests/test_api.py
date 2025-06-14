import pytest
from fastapi.testclient import TestClient
from app.main import app
import numpy as np

client = TestClient(app)

def test_predict_authorized():
    """Test prediction with valid API key"""
    test_data = np.random.rand(30, 6).tolist()
    response = client.post(
        "/predict/Amazon",
        json={"values": test_data},
        headers={"X-API-Key": "your-secret-key-here"}
    )
    assert response.status_code == 200
    assert "prediction" in response.json()

def test_predict_unauthorized():
    """Test without API key"""
    response = client.post("/predict/Amazon", json={"values": []})
    assert response.status_code == 403

def test_invalid_ticker():
    """Test with invalid stock ticker"""
    response = client.post(
        "/predict/INVALID",
        json={"values": np.random.rand(30, 6).tolist()},
        headers={"X-API-Key": "your-secret-key-here"}
    )
    assert response.status_code == 400
from fastapi import FastAPI, Request, Depends, HTTPException
from fastapi.security import APIKeyHeader
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import numpy as np
from .models import load_models, predict
from .schemas import PredictionInput
import os
from datetime import datetime
from typing import List
from pydantic import BaseModel

app = FastAPI(title="FAANG Stock Predictor")

# Mount static files and templates
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# Security
API_KEY = os.getenv("API_KEY", "your-secret-key-here")
api_key_header = APIKeyHeader(name="X-API-Key")

# In-memory storage for demonstration (replace with database in production)
prediction_history = []

class HistoryEntry(BaseModel):
    date: str
    ticker: str
    prediction: float
    actual: float = None
    confidence: float = None

async def verify_api_key(api_key: str = Depends(api_key_header)):
    if api_key != API_KEY:
        raise HTTPException(status_code=403, detail="Invalid API Key")

# Load models at startup
model, scalers = load_models()

@app.get("/")
async def read_root(request: Request):
    """Serve the frontend"""
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/predict/{ticker}", dependencies=[Depends(verify_api_key)])
async def predict_stock(ticker: str, data: PredictionInput):
    """Prediction endpoint"""
    try:
        # Get prediction and confidence
        prediction = predict(model, scalers[ticker], data.values)
        confidence = calculate_confidence(data.values)  # Implement your confidence calculation
        
        # Store in history
        history_entry = HistoryEntry(
            date=datetime.now().isoformat(),
            ticker=ticker,
            prediction=prediction,
            confidence=confidence
        )
        prediction_history.append(history_entry)
        
        return {
            "ticker": ticker,
            "prediction": prediction,
            "confidence": confidence
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/history/{ticker}", dependencies=[Depends(verify_api_key)])
async def get_history(ticker: str):
    """Get prediction history for a ticker"""
    try:
        return [
            entry for entry in prediction_history
            if entry.ticker == ticker
        ]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/news/{ticker}", dependencies=[Depends(verify_api_key)])
async def get_news(ticker: str):
    """Get news sentiment for a ticker"""
    try:
        # In a real app, replace with news API call
        return {
            "sentiment": 0.75,  # -1 to 1 scale
            "headlines": [
                {"text": f"{ticker} announces new product", "sentiment": 0.8},
                {"text": f"{ticker} faces regulatory challenges", "sentiment": -0.3}
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

def calculate_confidence(data: np.ndarray) -> float:
    """Calculate prediction confidence (0-1 scale)"""
    # Replace with your actual confidence calculation
    volatility = np.std(data[:, 0])  # Using closing price volatility
    confidence = 0.9 - (volatility / 100)  # Simple heuristic
    return max(0.5, min(0.95, confidence))  # Keep within reasonable bounds

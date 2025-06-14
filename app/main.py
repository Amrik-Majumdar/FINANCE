from fastapi import FastAPI, Request, Depends, HTTPException
from fastapi.security import APIKeyHeader
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import numpy as np
from .models import load_models, predict
from .schemas import PredictionInput
import os

app = FastAPI(title="FAANG Stock Predictor")

# Mount static files and templates
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# Security
API_KEY = os.getenv("API_KEY", "your-secret-key-here")
api_key_header = APIKeyHeader(name="X-API-Key")

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
        prediction = predict(model, scalers[ticker], data.values)
        return {"ticker": ticker, "prediction": prediction}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
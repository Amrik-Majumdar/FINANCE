import joblib
import numpy as np
from tensorflow.keras.models import load_model

def load_models():
    """Load model and scalers from disk"""
    model = load_model("models/transformer_model.h5")
    scalers = joblib.load("models/scalers.pkl")
    return model, scalers

def predict(model, scaler, data: np.ndarray):
    """Make a prediction"""
    data_scaled = scaler.transform(np.array(data).reshape(-1, 6))
    prediction = model.predict(data_scaled.reshape(1, 30, 6))
    
    # Inverse transform the prediction
    dummy = np.zeros((1, 6))
    dummy[0,0] = prediction[0,0]
    return float(scaler.inverse_transform(dummy)[0,0])
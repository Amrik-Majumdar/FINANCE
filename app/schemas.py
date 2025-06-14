from pydantic import BaseModel, conlist

class PredictionInput(BaseModel):
    """Input validation schema"""
    values: conlist(
        conlist(float, min_length=6, max_length=6), 
        min_length=30, 
        max_length=30
    )
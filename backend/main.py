import os
import joblib
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from database import get_db, ReviewRecord

app = FastAPI(title="CritiqueLens API")

# Allow Next.js (port 3000) to communicate with FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the trained model
MODEL_PATH = os.path.join("models", "sentiment_model.pkl")
if not os.path.exists(MODEL_PATH):
    raise RuntimeError(f"Model file not found at {MODEL_PATH}")

model = joblib.load(MODEL_PATH)

class ReviewRequest(BaseModel):
    text: str = Field(..., min_length=3, description="Review text to analyze")

@app.post("/predict")
def predict_sentiment(payload: ReviewRequest, db: Session = Depends(get_db)):
    text = payload.text.strip()
    
    # Run model prediction
    pred = int(model.predict([text])[0])
    probs = model.predict_proba([text])[0]
    
    label = "Positive" if pred == 1 else "Negative"
    confidence = round(float(probs[pred]) * 100, 2)
    pos_score = round(float(probs[1]) * 100, 2)
    neg_score = round(float(probs[0]) * 100, 2)

    # Persist record into SQLite
    record = ReviewRecord(text=text, sentiment=label, confidence=confidence)
    db.add(record)
    db.commit()
    db.refresh(record)

    return {
        "id": record.id,
        "text": text,
        "sentiment": label,
        "confidence": confidence,
        "breakdown": {
            "positive": pos_score,
            "negative": neg_score
        }
    }

@app.get("/history")
def get_history(limit: int = 10, db: Session = Depends(get_db)):
    records = db.query(ReviewRecord).order_by(ReviewRecord.created_at.desc()).limit(limit).all()
    return records
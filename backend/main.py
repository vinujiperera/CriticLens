from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
import joblib
import os
import re
import math
from datetime import datetime

import nltk
from nltk.tokenize import sent_tokenize
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker, Session

# ---------------------------------------------------------
# 1. DATABASE SETUP (SQLite + SQLAlchemy)
# ---------------------------------------------------------
DATABASE_URL = "sqlite:///./sentiment_history.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class ReviewRecord(Base):
    __tablename__ = "review_history"

    id = Column(Integer, primary_key=True, index=True)
    text = Column(String, nullable=False)
    sentiment = Column(String, nullable=False)
    confidence = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ---------------------------------------------------------
# 2. LOAD TRAINED MODEL & INITIALIZE ANALYZERS
# ---------------------------------------------------------
MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "sentiment_model.pkl")

if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(f"Model file not found at: {MODEL_PATH}")

pipeline = joblib.load(MODEL_PATH)
vader_analyzer = SentimentIntensityAnalyzer()

# Extract TF-IDF vectorizer and logistic regression classifier for XAI
try:
    vectorizer = pipeline.named_steps["tfidf"]
    classifier = pipeline.named_steps["classifier"]
    vocab = vectorizer.vocabulary_
    feature_names = vectorizer.get_feature_names_out()
    coefs = classifier.coef_[0]
except Exception as e:
    vectorizer = None
    classifier = None
    vocab = {}
    coefs = []

# ---------------------------------------------------------
# 3. ANALYTICAL EXTRACTION ENGINES
# ---------------------------------------------------------

# Pillar 1: Aspect-Based Extraction
ASPECT_LEXICON = {
    "Acting & Cast": [
        "acting", "actor", "actors", "actress", "actresses", "cast", "performance",
        "performances", "role", "character", "characters", "lead", "supporting"
    ],
    "Story & Writing": [
        "story", "plot", "writing", "script", "screenplay", "dialogue", "dialogues",
        "ending", "premise", "twist", "narrative", "arc"
    ],
    "Visuals & Audio": [
        "visuals", "cinematography", "camera", "shots", "effects", "cgi", "lighting",
        "soundtrack", "score", "music", "audio", "sound"
    ],
    "Pacing & Direction": [
        "pacing", "pace", "direction", "director", "directed", "slow", "dragged",
        "length", "runtime", "boring", "engaging", "editing"
    ]
}

def analyze_aspects(text: str) -> Dict[str, Optional[float]]:
    try:
        sentences = sent_tokenize(text)
    except Exception:
        sentences = re.split(r'[.!?]+', text)
        sentences = [s.strip() for s in sentences if s.strip()]

    aspect_scores: Dict[str, Optional[float]] = {}

    for aspect, keywords in ASPECT_LEXICON.items():
        matched_sentences = [
            s for s in sentences if any(re.search(rf"\b{k}\b", s, re.IGNORECASE) for k in keywords)
        ]
        if matched_sentences:
            compound_scores = [vader_analyzer.polarity_scores(s)["compound"] for s in matched_sentences]
            avg_compound = sum(compound_scores) / len(compound_scores)
            # Map VADER compound score (-1.0 to 1.0) to percentage (0% to 100%)
            aspect_scores[aspect] = round((avg_compound + 1.0) * 50.0, 1)
        else:
            aspect_scores[aspect] = None

    return aspect_scores

# Pillar 2: Narrative Trajectory
def analyze_trajectory(text: str) -> List[Dict[str, Any]]:
    try:
        sentences = sent_tokenize(text)
    except Exception:
        sentences = re.split(r'[.!?]+', text)
        sentences = [s.strip() for s in sentences if s.strip()]

    if not sentences:
        return []

    trajectory = []
    for idx, sentence in enumerate(sentences):
        if not sentence.strip():
            continue
        scores = vader_analyzer.polarity_scores(sentence)
        trajectory.append({
            "sentence_index": idx + 1,
            "snippet": sentence.strip() if len(sentence) <= 60 else sentence[:57] + "...",
            "compound": round(scores["compound"], 2),
            "pos": round(scores["pos"] * 100, 1),
            "neg": round(scores["neg"] * 100, 1),
            "neu": round(scores["neu"] * 100, 1)
        })
    return trajectory

# Pillar 3: Token Explainability (XAI)
def analyze_token_impacts(text: str) -> List[Dict[str, Any]]:
    if vectorizer is None or classifier is None:
        return []

    tokens = re.findall(r"\b\w+\b", text)
    token_impacts = []

    for token in tokens:
        lower_token = token.lower()
        if lower_token in vocab:
            idx = vocab[lower_token]
            weight = float(coefs[idx])
            token_impacts.append({
                "word": token,
                "weight": round(weight, 3),
                "influence": "Positive" if weight > 0 else "Negative"
            })
        else:
            token_impacts.append({
                "word": token,
                "weight": 0.0,
                "influence": "Neutral"
            })
    return token_impacts

# Pillar 4: Lexical & Readability Metrics
def compute_lexical_metrics(text: str) -> Dict[str, Any]:
    words = re.findall(r"\b\w+\b", text)
    word_count = len(words)
    unique_words = len(set(w.lower() for w in words))
    lexical_diversity = round((unique_words / word_count * 100), 1) if word_count > 0 else 0.0

    try:
        sentences = sent_tokenize(text)
    except Exception:
        sentences = [s for s in re.split(r'[.!?]+', text) if s.strip()]
    sentence_count = max(len(sentences), 1)

    # Count syllables approximately
    def count_syllables(w: str) -> int:
        w = w.lower()
        count = len(re.findall(r'[aeiouy]+', w))
        if w.endswith('e') and not w.endswith('le') and len(w) > 2:
            count = max(count - 1, 1)
        return max(count, 1)

    total_syllables = sum(count_syllables(w) for w in words) if words else 0

    # Flesch Reading Ease Formula
    if word_count > 0 and sentence_count > 0:
        words_per_sentence = word_count / sentence_count
        syllables_per_word = total_syllables / word_count
        reading_ease = 206.835 - (1.015 * words_per_sentence) - (84.6 * syllables_per_word)
        reading_ease = round(max(min(reading_ease, 100.0), 0.0), 1)
    else:
        reading_ease = 100.0

    # Contrastive marker count (indicators of mixed criticism)
    contrast_markers = ["but", "however", "although", "yet", "nevertheless", "though", "despite"]
    contrast_count = sum(1 for w in words if w.lower() in contrast_markers)

    return {
        "word_count": word_count,
        "sentence_count": sentence_count,
        "lexical_diversity_pct": lexical_diversity,
        "reading_ease": reading_ease,
        "contrast_marker_count": contrast_count,
        "estimated_read_time_sec": round(word_count / 3.3, 1)  # ~200 words/min
    }

# ---------------------------------------------------------
# 4. FASTAPI APP & ROUTES
# ---------------------------------------------------------
app = FastAPI(title="CriticLens API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ReviewRequest(BaseModel):
    text: str

@app.post("/predict")
def predict_sentiment(payload: ReviewRequest, db: Session = Depends(get_db)):
    raw_text = payload.text.strip()
    if not raw_text:
        raise HTTPException(status_code=400, detail="Text cannot be empty.")

    # Primary ML Model Inference
    prediction = pipeline.predict([raw_text])[0]
    probabilities = pipeline.predict_proba([raw_text])[0]

    label = "Positive" if prediction == 1 else "Negative"
    confidence = float(max(probabilities) * 100)

    # Persist in SQLite
    record = ReviewRecord(
        text=raw_text,
        sentiment=label,
        confidence=round(confidence, 2)
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    # Compute Enriched Analytics
    aspects = analyze_aspects(raw_text)
    trajectory = analyze_trajectory(raw_text)
    token_impacts = analyze_token_impacts(raw_text)
    lexical = compute_lexical_metrics(raw_text)

    return {
        "id": record.id,
        "text": raw_text,
        "sentiment": label,
        "confidence": round(confidence, 2),
        "breakdown": {
            "positive": round(float(probabilities[1]) * 100, 2),
            "negative": round(float(probabilities[0]) * 100, 2),
        },
        "analytics": {
            "aspects": aspects,
            "trajectory": trajectory,
            "token_impacts": token_impacts,
            "lexical": lexical
        }
    }

@app.get("/history")
def get_history(db: Session = Depends(get_db)):
    records = db.query(ReviewRecord).order_by(ReviewRecord.timestamp.desc()).limit(10).all()
    return [
        {
            "id": r.id,
            "text": r.text,
            "sentiment": r.sentiment,
            "confidence": r.confidence,
            "timestamp": r.timestamp.isoformat() if r.timestamp else None,
        }
        for r in records
    ]

@app.delete("/history/{record_id}")
def delete_history_item(record_id: int, db: Session = Depends(get_db)):
    record = db.query(ReviewRecord).filter(ReviewRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found.")
    db.delete(record)
    db.commit()
    return {"status": "success", "deleted_id": record_id}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
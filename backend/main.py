from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
import joblib
import os
import re
import math
from datetime import datetime
from collections import defaultdict

try:
    from dotenv import load_dotenv

    load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
except ImportError:
    pass

import nltk
from nltk.tokenize import sent_tokenize
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, ForeignKey, Text, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session, relationship

import tmdb_client
from tmdb_client import TMDBError, poster_url as tmdb_poster_url

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


class Movie(Base):
    __tablename__ = "movies"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False, index=True)
    year = Column(Integer, nullable=False)
    director = Column(String(120), nullable=False)
    genre = Column(String(80), nullable=False)
    synopsis = Column(Text, nullable=False)
    poster_accent = Column(String(32), default="coral")
    tmdb_id = Column(Integer, nullable=True, unique=True, index=True)
    poster_path = Column(String(255), nullable=True)

    reviews = relationship("MovieReview", back_populates="movie", cascade="all, delete-orphan")


class MovieReview(Base):
    __tablename__ = "movie_reviews"

    id = Column(Integer, primary_key=True, index=True)
    movie_id = Column(Integer, ForeignKey("movies.id"), nullable=False, index=True)
    author_name = Column(String(80), default="Anonymous")
    text = Column(Text, nullable=False)
    sentiment = Column(String(20), nullable=False)
    confidence = Column(Float, nullable=False)
    positive_pct = Column(Float, nullable=False)
    negative_pct = Column(Float, nullable=False)
    neutral_pct = Column(Float, nullable=False)
    vader_compound = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

    movie = relationship("Movie", back_populates="reviews")

Base.metadata.create_all(bind=engine)


def ensure_movie_schema() -> None:
    with engine.begin() as conn:
        rows = conn.execute(text("PRAGMA table_info(movies)")).fetchall()
        existing = {row[1] for row in rows}
        if "tmdb_id" not in existing:
            conn.execute(text("ALTER TABLE movies ADD COLUMN tmdb_id INTEGER"))
        if "poster_path" not in existing:
            conn.execute(text("ALTER TABLE movies ADD COLUMN poster_path VARCHAR(255)"))
        conn.execute(
            text(
                "CREATE UNIQUE INDEX IF NOT EXISTS uq_movies_tmdb_id "
                "ON movies (tmdb_id) WHERE tmdb_id IS NOT NULL"
            )
        )


ensure_movie_schema()


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
# 3b. MOVIE PLATFORM HELPERS
# ---------------------------------------------------------

SEED_MOVIES = [
    {
        "title": "Midnight Echoes",
        "year": 2024,
        "director": "Ava Chen",
        "genre": "Thriller",
        "synopsis": "A sound engineer uncovers a conspiracy hidden in archived broadcast tapes beneath a decaying cinema.",
        "poster_accent": "burgundy",
    },
    {
        "title": "Solar Drift",
        "year": 2023,
        "director": "Marcus Hale",
        "genre": "Sci-Fi",
        "synopsis": "A stranded pilot must cross an unstable asteroid belt using only a failing AI co-pilot and instinct.",
        "poster_accent": "coral",
    },
    {
        "title": "The Last Verdict",
        "year": 2022,
        "director": "Priya Nair",
        "genre": "Drama",
        "synopsis": "A retired judge reopens a cold case that forces her to confront the town she once protected.",
        "poster_accent": "peach",
    },
    {
        "title": "Neon Harbor",
        "year": 2025,
        "director": "Diego Alvarez",
        "genre": "Action",
        "synopsis": "Undercover agents infiltrate a smuggling ring operating from floating markets in a flooded megacity.",
        "poster_accent": "coral",
    },
    {
        "title": "Paper Planets",
        "year": 2021,
        "director": "Lena Okonkwo",
        "genre": "Animation",
        "synopsis": "Two siblings fold origami worlds that begin to collide with their real-life neighborhood.",
        "poster_accent": "peach",
    },
    {
        "title": "Quiet Frequency",
        "year": 2020,
        "director": "Tomás Rivera",
        "genre": "Mystery",
        "synopsis": "Radio listeners report the same whisper on different stations—leading to an abandoned observatory.",
        "poster_accent": "burgundy",
    },
]


def run_sentiment_inference(raw_text: str) -> Dict[str, Any]:
    prediction = pipeline.predict([raw_text])[0]
    probabilities = pipeline.predict_proba([raw_text])[0]
    vader = vader_analyzer.polarity_scores(raw_text)

    label = "Positive" if prediction == 1 else "Negative"
    confidence = float(max(probabilities) * 100)

    return {
        "sentiment": label,
        "confidence": round(confidence, 2),
        "positive_pct": round(float(probabilities[1]) * 100, 2),
        "negative_pct": round(float(probabilities[0]) * 100, 2),
        "neutral_pct": round(float(vader["neu"]) * 100, 2),
        "vader_compound": round(float(vader["compound"]), 3),
    }


def summarize_movie_reviews(reviews: List[MovieReview]) -> Dict[str, Any]:
    if not reviews:
        return {
            "review_count": 0,
            "overall_label": "No reviews yet",
            "positive_pct": 0.0,
            "negative_pct": 0.0,
            "neutral_pct": 0.0,
            "avg_confidence": 0.0,
        }

    pos = sum(1 for r in reviews if r.sentiment == "Positive")
    neg = len(reviews) - pos
    avg_pos = sum(r.positive_pct for r in reviews) / len(reviews)
    avg_neg = sum(r.negative_pct for r in reviews) / len(reviews)
    avg_neu = sum(r.neutral_pct for r in reviews) / len(reviews)
    avg_conf = sum(r.confidence for r in reviews) / len(reviews)

    if pos > neg:
        overall = "Positive"
    elif neg > pos:
        overall = "Negative"
    else:
        overall = "Mixed"

    return {
        "review_count": len(reviews),
        "overall_label": overall,
        "positive_pct": round(avg_pos, 2),
        "negative_pct": round(avg_neg, 2),
        "neutral_pct": round(avg_neu, 2),
        "avg_confidence": round(avg_conf, 2),
        "positive_count": pos,
        "negative_count": neg,
    }


def import_movie_from_tmdb(db: Session, tmdb_id: int) -> Movie:
    existing = db.query(Movie).filter(Movie.tmdb_id == tmdb_id).first()
    if existing:
        return existing

    details = tmdb_client.normalize_movie_details(tmdb_client.get_movie(tmdb_id))
    movie = Movie(
        tmdb_id=details["tmdb_id"],
        title=details["title"],
        year=details["year"] or 2000,
        director=details["director"],
        genre=details["genre"],
        synopsis=details["synopsis"],
        poster_path=details["poster_path"],
        poster_accent="coral",
    )
    db.add(movie)
    db.commit()
    db.refresh(movie)
    return movie


def sync_tmdb_search(db: Session, query: str, limit: int = 8) -> None:
    if not tmdb_client.is_configured() or not query.strip():
        return
    try:
        for item in tmdb_client.search_results(query, limit=limit):
            tmdb_id = item.get("id")
            if tmdb_id:
                import_movie_from_tmdb(db, int(tmdb_id))
    except TMDBError:
        pass


def seed_tmdb_popular(db: Session, limit: int = 12) -> None:
    if not tmdb_client.is_configured():
        return
    try:
        for item in tmdb_client.popular_results(limit=limit):
            tmdb_id = item.get("id")
            if tmdb_id:
                import_movie_from_tmdb(db, int(tmdb_id))
    except TMDBError:
        pass


def movie_to_dict(movie: Movie, db: Session) -> Dict[str, Any]:
    reviews = db.query(MovieReview).filter(MovieReview.movie_id == movie.id).all()
    summary = summarize_movie_reviews(reviews)
    return {
        "id": movie.id,
        "tmdb_id": movie.tmdb_id,
        "title": movie.title,
        "year": movie.year,
        "director": movie.director,
        "genre": movie.genre,
        "synopsis": movie.synopsis,
        "poster_accent": movie.poster_accent,
        "poster_path": movie.poster_path,
        "poster_url": tmdb_poster_url(movie.poster_path),
        "sentiment": summary,
    }


def seed_platform_data(db: Session) -> None:
    if tmdb_client.is_configured():
        if db.query(Movie).filter(Movie.tmdb_id.isnot(None)).count() == 0:
            seed_tmdb_popular(db, limit=12)
        return

    if db.query(Movie).count() > 0:
        return

    movies = [Movie(**item) for item in SEED_MOVIES]
    db.add_all(movies)
    db.commit()

    sample_reviews = [
        (1, "A gripping thriller with sharp sound design and a tense final act.", "Jordan"),
        (1, "The plot loses steam in the middle and the villain twist feels unearned.", "Sam"),
        (2, "Visually stunning space sequences and a heartfelt AI performance.", "Riley"),
        (2, "Too many scientific loopholes and the ending rushed every emotional beat.", "Casey"),
        (3, "Brilliant courtroom dialogue and a powerful lead performance.", "Morgan"),
        (4, "Relentless action set pieces with creative choreography in the harbor.", "Alex"),
        (5, "Whimsical animation with thoughtful metaphors about growing up.", "Jamie"),
    ]

    for movie_id, text, author in sample_reviews:
        movie = db.query(Movie).filter(Movie.id == movie_id).first()
        if not movie:
            continue
        scores = run_sentiment_inference(text)
        db.add(
            MovieReview(
                movie_id=movie.id,
                author_name=author,
                text=text,
                sentiment=scores["sentiment"],
                confidence=scores["confidence"],
                positive_pct=scores["positive_pct"],
                negative_pct=scores["negative_pct"],
                neutral_pct=scores["neutral_pct"],
                vader_compound=scores["vader_compound"],
            )
        )
    db.commit()


# ---------------------------------------------------------
# 4. FASTAPI APP & ROUTES
# ---------------------------------------------------------
app = FastAPI(title="CriticLens API", version="3.1.0")


@app.on_event("startup")
def on_startup() -> None:
    db = SessionLocal()
    try:
        seed_platform_data(db)
    finally:
        db.close()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ReviewRequest(BaseModel):
    text: str


class MovieReviewCreate(BaseModel):
    text: str
    author_name: str = "Anonymous"


@app.post("/predict")
def predict_sentiment(payload: ReviewRequest, db: Session = Depends(get_db)):
    raw_text = payload.text.strip()
    if not raw_text:
        raise HTTPException(status_code=400, detail="Text cannot be empty.")

    scores = run_sentiment_inference(raw_text)

    record = ReviewRecord(
        text=raw_text,
        sentiment=scores["sentiment"],
        confidence=scores["confidence"],
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    aspects = analyze_aspects(raw_text)
    trajectory = analyze_trajectory(raw_text)
    token_impacts = analyze_token_impacts(raw_text)
    lexical = compute_lexical_metrics(raw_text)

    return {
        "id": record.id,
        "text": raw_text,
        "sentiment": scores["sentiment"],
        "confidence": scores["confidence"],
        "breakdown": {
            "positive": scores["positive_pct"],
            "negative": scores["negative_pct"],
        },
        "analytics": {
            "aspects": aspects,
            "trajectory": trajectory,
            "token_impacts": token_impacts,
            "lexical": lexical,
        },
    }


@app.get("/tmdb/status")
def tmdb_status():
    return {"configured": tmdb_client.is_configured()}


@app.post("/movies/sync/popular")
def sync_popular_movies(db: Session = Depends(get_db)):
    if not tmdb_client.is_configured():
        raise HTTPException(status_code=503, detail="TMDB_API_KEY is not configured on the server.")
    try:
        seed_tmdb_popular(db, limit=20)
    except TMDBError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    count = db.query(Movie).filter(Movie.tmdb_id.isnot(None)).count()
    return {"tmdb_movies_in_catalog": count}


@app.post("/movies/import/tmdb/{tmdb_id}")
def import_tmdb_movie(tmdb_id: int, db: Session = Depends(get_db)):
    if not tmdb_client.is_configured():
        raise HTTPException(status_code=503, detail="TMDB_API_KEY is not configured on the server.")
    try:
        movie = import_movie_from_tmdb(db, tmdb_id)
    except TMDBError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    return movie_to_dict(movie, db)


@app.get("/movies")
def search_movies(q: Optional[str] = None, db: Session = Depends(get_db)):
    if q and q.strip():
        sync_tmdb_search(db, q.strip(), limit=8)

    query = db.query(Movie)
    if q:
        like = f"%{q.strip()}%"
        query = query.filter(
            (Movie.title.ilike(like))
            | (Movie.director.ilike(like))
            | (Movie.genre.ilike(like))
        )
    movies = query.order_by(Movie.title.asc()).all()
    return [movie_to_dict(movie, db) for movie in movies]


@app.get("/movies/compare")
def compare_movies(ids: str, db: Session = Depends(get_db)):
    try:
        movie_ids = [int(x) for x in ids.split(",") if x.strip()]
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid movie id list.") from exc

    if len(movie_ids) < 2 or len(movie_ids) > 5:
        raise HTTPException(status_code=400, detail="Provide between 2 and 5 movie ids.")

    comparisons = []
    for mid in movie_ids:
        movie = db.query(Movie).filter(Movie.id == mid).first()
        if not movie:
            raise HTTPException(status_code=404, detail=f"Movie {mid} not found.")
        reviews = db.query(MovieReview).filter(MovieReview.movie_id == mid).all()
        comparisons.append(
            {
                "id": movie.id,
                "title": movie.title,
                "year": movie.year,
                "poster_url": tmdb_poster_url(movie.poster_path),
                "sentiment": summarize_movie_reviews(reviews),
            }
        )
    return comparisons


@app.get("/movies/{movie_id}")
def get_movie(movie_id: int, db: Session = Depends(get_db)):
    movie = db.query(Movie).filter(Movie.id == movie_id).first()
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found.")

    reviews = (
        db.query(MovieReview)
        .filter(MovieReview.movie_id == movie_id)
        .order_by(MovieReview.timestamp.desc())
        .all()
    )
    payload = movie_to_dict(movie, db)
    payload["sentiment"] = summarize_movie_reviews(reviews)
    payload["reviews"] = [
            {
                "id": r.id,
                "author_name": r.author_name,
                "text": r.text,
                "sentiment": r.sentiment,
                "confidence": r.confidence,
                "positive_pct": r.positive_pct,
                "negative_pct": r.negative_pct,
                "neutral_pct": r.neutral_pct,
                "vader_compound": r.vader_compound,
                "timestamp": r.timestamp.isoformat() if r.timestamp else None,
            }
            for r in reviews
        ]
    return payload


@app.get("/movies/{movie_id}/sentiment/trends")
def get_sentiment_trends(movie_id: int, db: Session = Depends(get_db)):
    movie = db.query(Movie).filter(Movie.id == movie_id).first()
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found.")

    reviews = (
        db.query(MovieReview)
        .filter(MovieReview.movie_id == movie_id)
        .order_by(MovieReview.timestamp.asc())
        .all()
    )

    buckets: Dict[str, List[float]] = defaultdict(list)
    for review in reviews:
        if not review.timestamp:
            continue
        day_key = review.timestamp.date().isoformat()
        buckets[day_key].append(review.vader_compound)

    trend = []
    for day in sorted(buckets.keys()):
        values = buckets[day]
        trend.append(
            {
                "date": day,
                "avg_compound": round(sum(values) / len(values), 3),
                "review_count": len(values),
            }
        )
    return trend


@app.post("/movies/{movie_id}/reviews")
def submit_movie_review(movie_id: int, payload: MovieReviewCreate, db: Session = Depends(get_db)):
    movie = db.query(Movie).filter(Movie.id == movie_id).first()
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found.")

    raw_text = payload.text.strip()
    if len(raw_text) < 3:
        raise HTTPException(status_code=400, detail="Review must be at least 3 characters.")

    author = payload.author_name.strip() or "Anonymous"
    scores = run_sentiment_inference(raw_text)

    review = MovieReview(
        movie_id=movie_id,
        author_name=author,
        text=raw_text,
        sentiment=scores["sentiment"],
        confidence=scores["confidence"],
        positive_pct=scores["positive_pct"],
        negative_pct=scores["negative_pct"],
        neutral_pct=scores["neutral_pct"],
        vader_compound=scores["vader_compound"],
    )
    db.add(review)
    db.commit()
    db.refresh(review)

    return {
        "id": review.id,
        "movie_id": movie_id,
        "author_name": review.author_name,
        "text": review.text,
        "sentiment": review.sentiment,
        "confidence": review.confidence,
        "positive_pct": review.positive_pct,
        "negative_pct": review.negative_pct,
        "neutral_pct": review.neutral_pct,
        "vader_compound": review.vader_compound,
        "timestamp": review.timestamp.isoformat() if review.timestamp else None,
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
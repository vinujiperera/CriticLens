# CriticLens

Explore reviews. Reveal the sentiment.

CriticLens is a full-stack app for **movie review sentiment**: browse a TMDB-backed catalog, compare titles, run a paste-in review lab, and export PDF intelligence reports. A scikit-learn classifier plus VADER-powered analytics drive scores, aspect breakdowns, and explainable word drivers.

## Features

- **Movies** — Search and filter by genre; import popular titles from [TMDB](https://www.themoviedb.org/).
- **Auto audience scores** — When local reviews are sparse, top TMDB reviews are analyzed on load so pages stay useful.
- **Compare** — Side-by-side sentiment and an overlaid aspect radar (2–3 films).
- **Review analyzer (Lab)** — Paste any critique for classification, topic scores, mood trajectory, and token explainability.
- **PDF exports** — Film intelligence dossiers and per-review analysis reports.

## Project structure

```
ML/
├── backend/          # FastAPI API, SQLite, ML model, TMDB client
├── frontend/         # Next.js 16 app
└── notebooks/        # Training / exploration (optional)
```

## Prerequisites

- **Python 3.10+** (3.11+ recommended)
- **Node.js 18+**
- **TMDB API key** (free) for posters, search, genre browse, and community reviews

## Backend setup

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Copy environment template and add your key:

```powershell
copy .env.example .env
```

Edit `backend/.env`:

```env
TMDB_API_KEY=your_key_here
```

Ensure the trained model exists at `backend/models/sentiment_model.pkl` (train or copy from your notebook workflow if missing).

Run the API:

```powershell
uvicorn main:app --reload --port 8000
```

- API: http://127.0.0.1:8000  
- Interactive docs: http://127.0.0.1:8000/docs  
- TMDB status: http://127.0.0.1:8000/tmdb/status → `{ "configured": true }`

## Frontend setup

```powershell
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

The app expects the API at `http://127.0.0.1:8000` (see `frontend/lib/api.ts`).

Production build:

```powershell
npm run build
npm start
```

## Main routes

| Route | Description |
|-------|-------------|
| `/` | Marketing landing |
| `/movies` | Browse & search catalog, genre filters |
| `/movies/[id]` | Detail, reviews, aspects, PDF export |
| `/movies/compare` | Multi-movie comparison & radar chart |
| `/dashboard` | Review analyzer lab |

## Tech stack

- **Frontend:** Next.js, React, Tailwind CSS, Recharts, jsPDF  
- **Backend:** FastAPI, SQLAlchemy (SQLite), scikit-learn, NLTK, VaderSentiment  
- **Data:** TMDB API for metadata and optional community reviews  

## Notes

- `backend/sentiment_history.db` stores movies, reviews, and lab history locally.
- Do not commit `backend/.env` or API keys.
- First load of a thin genre may take a few seconds while TMDB imports popular titles into the catalog.

## License

Use and modify for learning and portfolio purposes unless you add a separate license file.

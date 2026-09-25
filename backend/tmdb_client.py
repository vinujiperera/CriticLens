"""Thin TMDB v3 client (stdlib only). Reads TMDB_API_KEY from env or backend/.env."""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any, Dict, List, Optional
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

TMDB_BASE = "https://api.themoviedb.org/3"
POSTER_SIZE = "w500"
POSTER_BASE = f"https://image.tmdb.org/t/p/{POSTER_SIZE}"
_ENV_LOADED = False


class TMDBError(Exception):
    pass


def _load_env_file() -> None:
    global _ENV_LOADED
    if _ENV_LOADED:
        return
    _ENV_LOADED = True

    try:
        from dotenv import load_dotenv

        load_dotenv(Path(__file__).resolve().parent / ".env")
        return
    except ImportError:
        pass

    env_path = Path(__file__).resolve().parent / ".env"
    if not env_path.is_file():
        return

    for raw_line in env_path.read_text(encoding="utf-8-sig").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


def get_api_key() -> str:
    _load_env_file()
    return os.getenv("TMDB_API_KEY", "").strip()


def is_configured() -> bool:
    return bool(get_api_key())


def poster_url(poster_path: Optional[str]) -> Optional[str]:
    if not poster_path:
        return None
    return f"{POSTER_BASE}{poster_path}"


def _request(path: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    api_key = get_api_key()
    if not api_key:
        raise TMDBError("TMDB_API_KEY is not set. Add it to backend/.env and restart FastAPI.")

    query = dict(params or {})
    query["api_key"] = api_key
    url = f"{TMDB_BASE}{path}?{urlencode(query)}"
    req = Request(url, headers={"Accept": "application/json", "User-Agent": "CriticLens/1.0"})

    try:
        with urlopen(req, timeout=20) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except HTTPError as exc:
        raise TMDBError(f"TMDB HTTP {exc.code}") from exc
    except URLError as exc:
        raise TMDBError(f"TMDB network error: {exc.reason}") from exc


def search_movies(query: str, page: int = 1) -> Dict[str, Any]:
    return _request("/search/movie", {"query": query.strip(), "page": page, "include_adult": "false"})


def popular_movies(page: int = 1) -> Dict[str, Any]:
    return _request("/movie/popular", {"page": page})


def get_movie(tmdb_id: int) -> Dict[str, Any]:
    return _request(f"/movie/{tmdb_id}", {"append_to_response": "credits"})


def extract_director(credits: Dict[str, Any]) -> str:
    for person in credits.get("crew", []):
        if person.get("job") == "Director":
            return person.get("name") or "Unknown"
    return "Unknown"


def extract_genre(details: Dict[str, Any]) -> str:
    genres = details.get("genres") or []
    if genres:
        return genres[0].get("name") or "Film"
    return "Film"


def extract_year(details: Dict[str, Any]) -> int:
    release = details.get("release_date") or ""
    if len(release) >= 4 and release[:4].isdigit():
        return int(release[:4])
    return 0


def normalize_movie_details(details: Dict[str, Any]) -> Dict[str, Any]:
    credits = details.get("credits") or {}
    return {
        "tmdb_id": details["id"],
        "title": details.get("title") or "Untitled",
        "year": extract_year(details),
        "director": extract_director(credits),
        "genre": extract_genre(details),
        "synopsis": (details.get("overview") or "No synopsis available on TMDB.").strip(),
        "poster_path": details.get("poster_path"),
    }


def popular_results(limit: int = 12) -> List[Dict[str, Any]]:
    data = popular_movies(page=1)
    return list(data.get("results") or [])[:limit]


def search_results(query: str, limit: int = 8) -> List[Dict[str, Any]]:
    data = search_movies(query, page=1)
    return list(data.get("results") or [])[:limit]

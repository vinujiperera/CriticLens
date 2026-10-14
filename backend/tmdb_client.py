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
BACKDROP_SIZE = "w1280"
BACKDROP_BASE = f"https://image.tmdb.org/t/p/{BACKDROP_SIZE}"
PROFILE_SIZE = "w185"
PROFILE_BASE = f"https://image.tmdb.org/t/p/{PROFILE_SIZE}"
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


def backdrop_url(backdrop_path: Optional[str]) -> Optional[str]:
    if not backdrop_path:
        return None
    return f"{BACKDROP_BASE}{backdrop_path}"


def profile_url(profile_path: Optional[str]) -> Optional[str]:
    if not profile_path:
        return None
    return f"{PROFILE_BASE}{profile_path}"


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


def get_movie_reviews(tmdb_id: int, page: int = 1) -> Dict[str, Any]:
    return _request(f"/movie/{tmdb_id}/reviews", {"page": page})


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


def extract_cast(credits: Dict[str, Any], limit: int = 12) -> List[Dict[str, Any]]:
    cast_out: List[Dict[str, Any]] = []
    for person in (credits.get("cast") or [])[:limit]:
        name = (person.get("name") or "").strip()
        if not name:
            continue
        cast_out.append(
            {
                "name": name,
                "character": (person.get("character") or "").strip() or None,
                "profile_url": profile_url(person.get("profile_path")),
            }
        )
    return cast_out


def normalize_movie_details(details: Dict[str, Any]) -> Dict[str, Any]:
    credits = details.get("credits") or {}
    genre_names = [
        (g.get("name") or "").strip()
        for g in (details.get("genres") or [])
        if (g.get("name") or "").strip()
    ]
    return {
        "tmdb_id": details["id"],
        "title": details.get("title") or "Untitled",
        "year": extract_year(details),
        "director": extract_director(credits),
        "genre": genre_names[0] if genre_names else extract_genre(details),
        "genres": genre_names,
        "synopsis": (details.get("overview") or "No synopsis available on TMDB.").strip(),
        "poster_path": details.get("poster_path"),
    }


def parse_movie_page_extras(details: Dict[str, Any]) -> Dict[str, Any]:
    """Rich TMDB payload for movie detail pages (cast, backdrop, runtime, etc.)."""
    credits = details.get("credits") or {}
    genre_names = [
        (g.get("name") or "").strip()
        for g in (details.get("genres") or [])
        if (g.get("name") or "").strip()
    ]
    runtime = details.get("runtime")
    runtime_minutes = int(runtime) if isinstance(runtime, int) and runtime > 0 else None
    tagline = (details.get("tagline") or "").strip() or None
    vote = details.get("vote_average")
    vote_average = round(float(vote), 1) if vote is not None else None

    return {
        "synopsis": (details.get("overview") or "").strip(),
        "tagline": tagline,
        "runtime_minutes": runtime_minutes,
        "genres": genre_names,
        "director": extract_director(credits),
        "cast": extract_cast(credits, limit=12),
        "poster_path": details.get("poster_path"),
        "backdrop_url": backdrop_url(details.get("backdrop_path")),
        "vote_average": vote_average,
        "release_date": details.get("release_date") or None,
    }


def popular_results(limit: int = 12) -> List[Dict[str, Any]]:
    data = popular_movies(page=1)
    return list(data.get("results") or [])[:limit]


def search_results(query: str, limit: int = 8) -> List[Dict[str, Any]]:
    data = search_movies(query, page=1)
    return list(data.get("results") or [])[:limit]


def year_from_release(release_date: Optional[str]) -> int:
    release = release_date or ""
    if len(release) >= 4 and release[:4].isdigit():
        return int(release[:4])
    return 0


_GENRE_NAME_TO_ID: Dict[str, int] = {}


def movie_genre_list() -> Dict[str, Any]:
    return _request("/genre/movie/list", {})


def resolve_genre_id(genre_name: str) -> Optional[int]:
    global _GENRE_NAME_TO_ID
    if not _GENRE_NAME_TO_ID:
        data = movie_genre_list()
        for item in data.get("genres") or []:
            name = (item.get("name") or "").strip()
            gid = item.get("id")
            if name and gid is not None:
                _GENRE_NAME_TO_ID[name.lower()] = int(gid)

    key = genre_name.strip().lower()
    if key in _GENRE_NAME_TO_ID:
        return _GENRE_NAME_TO_ID[key]
    for name, gid in _GENRE_NAME_TO_ID.items():
        if name.startswith(key) or key.startswith(name):
            return gid
    return None


def discover_movies_by_genre(genre_id: int, page: int = 1) -> Dict[str, Any]:
    return _request(
        "/discover/movie",
        {
            "with_genres": str(genre_id),
            "sort_by": "popularity.desc",
            "page": page,
            "include_adult": "false",
        },
    )


def discover_genre_results(genre_name: str, limit: int = 60) -> List[Dict[str, Any]]:
    genre_id = resolve_genre_id(genre_name)
    if genre_id is None:
        return []

    collected: List[Dict[str, Any]] = []
    page = 1
    max_pages = 5
    while len(collected) < limit and page <= max_pages:
        data = discover_movies_by_genre(genre_id, page=page)
        batch = list(data.get("results") or [])
        if not batch:
            break
        collected.extend(batch)
        total_pages = int(data.get("total_pages") or page)
        if page >= total_pages:
            break
        page += 1
    return collected[:limit]


def standard_genre_names() -> List[str]:
    try:
        data = movie_genre_list()
        return sorted(
            [(g.get("name") or "").strip() for g in data.get("genres") or [] if g.get("name")],
            key=str.lower,
        )
    except TMDBError:
        return []

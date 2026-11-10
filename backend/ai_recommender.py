import os
import json
import httpx
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
TMDB_API_KEY = os.getenv("TMDB_API_KEY")

if not GROQ_API_KEY:
    print("❌ ERROR: GROQ_API_KEY is missing in backend/.env")
if not TMDB_API_KEY:
    print("❌ ERROR: TMDB_API_KEY is missing in backend/.env")

groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

TMDB_GENRE_MAP = {
    "action": 28,
    "adventure": 12,
    "animation": 16,
    "comedy": 35,
    "crime": 80,
    "documentary": 99,
    "drama": 18,
    "family": 10751,
    "fantasy": 14,
    "history": 36,
    "horror": 27,
    "music": 10402,
    "musical": 10402,
    "mystery": 9648,
    "romance": 10749,
    "science fiction": 878,
    "sci-fi": 878,
    "thriller": 53,
    "war": 10752,
    "western": 37,
}

LANGUAGE_MAP = {
    "english": "en",
    "en": "en",
    "hindi": "hi",
    "hi": "hi",
    "tamil": "ta",
    "telugu": "te",
    "malayalam": "ml",
    "bengali": "bn",
    "punjabi": "pa",
    "marathi": "mr",
    "spanish": "es",
    "french": "fr",
    "japanese": "ja",
    "korean": "ko",
}

MOOD_GENRE_SUGGESTIONS = {
    "comfort": ["Romance", "Comedy", "Family", "Drama"],
    "cozy": ["Romance", "Comedy", "Family"],
    "feel-good": ["Comedy", "Family", "Romance"],
    "uplifting": ["Comedy", "Family", "Drama"],
    "melancholic": ["Drama", "Romance"],
    "moody": ["Drama", "Mystery", "Thriller"],
    "sad": ["Drama", "Romance"],
    "scary": ["Horror", "Thriller"],
    "intense": ["Thriller", "Drama", "Action"],
    "relaxing": ["Comedy", "Romance", "Animation", "Family"],
}

PREFERRED_MODELS = [
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "qwen/qwen3.8-27b",
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
]


def get_active_groq_model() -> str:
    """Selects an active Groq chat model safely."""
    if not groq_client:
        return PREFERRED_MODELS[0]
    try:
        models_response = groq_client.models.list()
        available_ids = {m.id for m in models_response.data}
        for candidate in PREFERRED_MODELS:
            if candidate in available_ids:
                return candidate
        blocked = ("whisper", "guard", "safeguard", "orpheus", "allam")
        for model_id in sorted(available_ids):
            low = model_id.lower()
            if any(b in low for b in blocked):
                continue
            if "gpt-oss" in low or "llama" in low or "qwen" in low:
                return model_id
    except Exception as e:
        print(f"Model selection fallback note: {e}")
    return PREFERRED_MODELS[0]


def normalize_extraction(raw: dict) -> dict:
    """Ensures consistent shape and ISO language codes."""
    base = {
        "genres": [],
        "people": [],
        "keywords": [],
        "year": None,
        "languages": [],
        "mood": None,
        "summary": None,
    }
    if not isinstance(raw, dict):
        return base

    base["genres"] = [str(g).strip() for g in raw.get("genres") or [] if str(g).strip()]
    base["people"] = [str(p).strip() for p in raw.get("people") or [] if str(p).strip()]
    base["keywords"] = [str(k).strip() for k in raw.get("keywords") or [] if str(k).strip()][:4]
    base["mood"] = (raw.get("mood") or raw.get("vibe") or None)
    if base["mood"]:
        base["mood"] = str(base["mood"]).strip() or None
    base["summary"] = (raw.get("summary") or raw.get("interpretation") or None)
    if base["summary"]:
        base["summary"] = str(base["summary"]).strip() or None

    year = raw.get("year")
    if isinstance(year, int):
        base["year"] = year
    elif isinstance(year, str) and year.isdigit():
        base["year"] = int(year)

    langs = raw.get("languages") or raw.get("language") or []
    if isinstance(langs, str):
        langs = [langs]
    iso_langs = []
    for lang in langs:
        key = str(lang).lower().strip()
        code = LANGUAGE_MAP.get(key) or (key if len(key) == 2 else None)
        if code and code not in iso_langs:
            iso_langs.append(code)
    base["languages"] = iso_langs

    mood_key = (base["mood"] or "").lower()
    keyword_blob = " ".join(base["keywords"]).lower()
    summary_blob = (base["summary"] or "").lower()
    blend = f"{mood_key} {keyword_blob} {summary_blob}"

    for token, genres in MOOD_GENRE_SUGGESTIONS.items():
        if token in blend:
            for g in genres:
                if g not in base["genres"]:
                    base["genres"].append(g)

    if any(w in blend for w in ("comfort", "cozy", "feel-good", "heartwarming", "warm")):
        base["mood"] = "comfort"
        base["genres"] = [
            g for g in base["genres"] if g.lower() not in ("horror", "thriller", "mystery")
        ]
        for g in ("Romance", "Comedy", "Family", "Drama"):
            if g not in base["genres"]:
                base["genres"].append(g)

    return base


async def extract_search_entities(user_prompt: str) -> dict:
    """Uses LLM via Groq to convert natural language into structured TMDB query tags."""
    if not groq_client:
        raise RuntimeError("GROQ_API_KEY is not set. Add it to backend/.env and restart uvicorn.")

    system_prompt = """
You are a film curator for CriticLens. Users describe mood, weather, feelings, languages, and actors—not just plot.

Turn their message into JSON with these keys:
- "summary": one short sentence on what they want (mood + situation in plain English)
- "mood": primary emotional tone (e.g. "comfort", "cozy", "moody", "feel-good", "energizing")
- "genres": TMDB-style genres that fit the mood (e.g. comfort → Comedy, Romance, Family, Drama; not Horror unless they want scares)
- "people": actor or director names, correctly spelled (e.g. "Anne Hathaway", "Deepika Padukone"); empty if none
- "keywords": optional plot/setting themes (e.g. "winter", "rain", "friendship") — not duplicates of genre names
- "languages": ISO-friendly names when they mention language — e.g. ["English"], ["Hindi"], or ["English", "Hindi"] when they say "Hindi or English"
- "year": release year integer or null

Rules:
- Map feelings and context (cold day, lonely, stressed) to suitable genres and keywords.
- "Comfort film" / "feel better" → warm, uplifting genres; avoid horror unless requested.
- Fix casual spelling (anna hathaway → Anne Hathaway).
- If they want either of two actors, still list both in "people".

Return ONLY raw JSON. No markdown.
"""

    selected_model = get_active_groq_model()

    chat_completion = groq_client.chat.completions.create(
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        model=selected_model,
        temperature=0.25,
    )

    content = chat_completion.choices[0].message.content.strip()

    if content.startswith("```"):
        content = content.strip("`").replace("json\n", "", 1).strip()

    try:
        return normalize_extraction(json.loads(content))
    except Exception:
        return normalize_extraction({})


async def resolve_tmdb_person_id(client: httpx.AsyncClient, name: str):
    """Finds TMDB person ID for an actor or director."""
    if not name or not TMDB_API_KEY:
        return None
    url = "https://api.themoviedb.org/3/search/person"
    params = {"api_key": TMDB_API_KEY, "query": name}
    try:
        res = await client.get(url, params=params)
        if res.status_code == 200:
            results = res.json().get("results", [])
            if results:
                return results[0]["id"]
    except Exception as e:
        print(f"Person search error: {e}")
    return None


async def resolve_tmdb_keyword_id(client: httpx.AsyncClient, keyword: str):
    """Finds TMDB keyword ID for a specific setting or motif."""
    if not keyword or not TMDB_API_KEY:
        return None
    url = "https://api.themoviedb.org/3/search/keyword"
    params = {"api_key": TMDB_API_KEY, "query": keyword}
    try:
        res = await client.get(url, params=params)
        if res.status_code == 200:
            results = res.json().get("results", [])
            if results:
                return results[0]["id"]
    except Exception as e:
        print(f"Keyword search error: {e}")
    return None


def genre_ids_from_extraction(extracted: dict) -> list[str]:
    genre_ids = []
    for g in extracted.get("genres", []):
        key = g.lower().strip()
        gid = TMDB_GENRE_MAP.get(key) or TMDB_GENRE_MAP.get(key.replace("-", " "))
        if gid:
            genre_ids.append(str(gid))
    return genre_ids


def movie_to_payload(m: dict) -> dict:
    return {
        "id": m.get("id"),
        "title": m.get("title"),
        "overview": m.get("overview"),
        "poster_path": m.get("poster_path"),
        "poster_url": (
            f"https://image.tmdb.org/t/p/w500{m.get('poster_path')}"
            if m.get("poster_path")
            else None
        ),
        "release_date": m.get("release_date", ""),
        "vote_average": m.get("vote_average", 0.0),
        "original_language": m.get("original_language"),
    }


def merge_discover_results(
    lists: list[list[dict]], limit: int = 12, *, interleave: bool = False
) -> list[dict]:
    if interleave and len(lists) > 1:
        seen: set[int] = set()
        merged: list[dict] = []
        max_len = max((len(b) for b in lists), default=0)
        for i in range(max_len):
            for batch in lists:
                if i >= len(batch):
                    continue
                m = batch[i]
                mid = m.get("id")
                if not mid or mid in seen:
                    continue
                seen.add(mid)
                merged.append(m)
                if len(merged) >= limit:
                    return merged
        if merged:
            return merged

    by_id: dict[int, dict] = {}
    for batch in lists:
        for m in batch:
            mid = m.get("id")
            if not mid:
                continue
            if mid not in by_id:
                by_id[mid] = m
            else:
                prev = by_id[mid]
                if (m.get("popularity") or 0) > (prev.get("popularity") or 0):
                    by_id[mid] = m
    ordered = sorted(
        by_id.values(),
        key=lambda x: ((x.get("vote_average") or 0) * 0.4 + (x.get("popularity") or 0) * 0.6),
        reverse=True,
    )
    return ordered[:limit]


async def discover_movies_with_ai(user_prompt: str):
    """User prompt (mood, language, people, themes) -> Groq JSON -> TMDB discover."""
    if not TMDB_API_KEY:
        raise RuntimeError("TMDB_API_KEY is not set. Add it to backend/.env and restart uvicorn.")

    extracted = await extract_search_entities(user_prompt)
    print(f"DEBUG Extracted Intent: {extracted}")

    discover_url = "https://api.themoviedb.org/3/discover/movie"

    async with httpx.AsyncClient() as client:
        genre_ids = genre_ids_from_extraction(extracted)

        person_ids = []
        for p in extracted.get("people", [])[:4]:
            pid = await resolve_tmdb_person_id(client, p)
            if pid:
                person_ids.append(pid)

        keyword_ids = []
        for kw in extracted.get("keywords", [])[:3]:
            kid = await resolve_tmdb_keyword_id(client, kw)
            if kid:
                keyword_ids.append(str(kid))

        languages = extracted.get("languages") or []

        comfort = (extracted.get("mood") or "").lower() == "comfort"

        def base_params(
            *,
            cast_id: int | None = None,
            language: str | None = None,
            use_keywords: bool = True,
            genre_or: bool | None = None,
        ) -> dict:
            use_genre_or = genre_or if genre_or is not None else (comfort or len(genre_ids) > 2)
            params = {
                "api_key": TMDB_API_KEY,
                "sort_by": "popularity.desc",
                "include_adult": "false",
                "page": 1,
                "vote_count.gte": 25 if language == "hi" else 50,
                "vote_average.gte": 5.0 if language == "hi" else 5.5,
            }
            if genre_ids:
                params["with_genres"] = "|".join(genre_ids) if use_genre_or else ",".join(genre_ids)
            if cast_id:
                params["with_cast"] = str(cast_id)
            if language:
                params["with_original_language"] = language
            if use_keywords and keyword_ids:
                params["with_keywords"] = "|".join(keyword_ids)
            if extracted.get("year"):
                params["primary_release_year"] = extracted["year"]
            return params

        async def fetch_discover(query_params: dict) -> list[dict]:
            r = await client.get(discover_url, params=query_params)
            if r.status_code == 200:
                return r.json().get("results", [])
            return []

        cast_variants: list[int | None] = person_ids if person_ids else [None]
        if len(person_ids) > 1:
            cast_variants = person_ids

        lang_variants: list[str | None] = languages if languages else [None]
        if len(languages) > 1:
            lang_variants = languages

        result_batches: list[list[dict]] = []
        for cast_id in cast_variants:
            for lang in lang_variants:
                batch = await fetch_discover(
                    base_params(cast_id=cast_id, language=lang, use_keywords=False)
                )
                if batch:
                    result_batches.append(batch)

        interleave = len(person_ids) > 1
        raw_results = merge_discover_results(
            result_batches, limit=12, interleave=interleave
        )

        if not raw_results and keyword_ids:
            for cast_id in cast_variants:
                for lang in lang_variants:
                    batch = await fetch_discover(
                        base_params(cast_id=cast_id, language=lang, use_keywords=True)
                    )
                    if batch:
                        result_batches.append(batch)
            raw_results = merge_discover_results(
                result_batches, limit=12, interleave=interleave
            )

        if not raw_results and genre_ids:
            result_batches = []
            for cast_id in cast_variants:
                for lang in lang_variants:
                    batch = await fetch_discover(
                        base_params(
                            cast_id=cast_id,
                            language=lang,
                            use_keywords=False,
                            genre_or=True,
                        )
                    )
                    if batch:
                        result_batches.append(batch)
            raw_results = merge_discover_results(
                result_batches, limit=12, interleave=interleave
            )

        if not raw_results and person_ids:
            for cast_id in person_ids:
                batch = await fetch_discover(
                    {
                        "api_key": TMDB_API_KEY,
                        "sort_by": "popularity.desc",
                        "include_adult": "false",
                        "with_cast": str(cast_id),
                        "page": 1,
                    }
                )
                if batch:
                    result_batches.append(batch)
            raw_results = merge_discover_results(
                result_batches, limit=12, interleave=True
            )

        movies = [movie_to_payload(m) for m in raw_results]

        return {
            "query_parsed": extracted,
            "results_count": len(movies),
            "movies": movies,
        }

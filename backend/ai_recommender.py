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
    "action": 28, "adventure": 12, "animation": 16, "comedy": 35,
    "crime": 80, "documentary": 99, "drama": 18, "family": 10751,
    "fantasy": 14, "history": 36, "horror": 27, "music": 10402,
    "mystery": 9648, "romance": 10749, "science fiction": 878,
    "sci-fi": 878, "thriller": 53, "war": 10752, "western": 37
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


async def extract_search_entities(user_prompt: str) -> dict:
    """Uses LLM via Groq to convert natural language into structured TMDB query tags."""
    if not groq_client:
        raise RuntimeError("GROQ_API_KEY is not set. Add it to backend/.env and restart uvicorn.")

    system_prompt = """
    You are a movie metadata parser for CriticLens.
    Extract the search intent from the user's description into valid JSON with these keys:
    - "genres": list of standard genre names (e.g. ["Action", "Thriller", "Sci-Fi"])
    - "people": list of actor or director names mentioned (e.g. ["Tom Cruise", "Anne Hathaway", "Leonardo DiCaprio"])
    - "keywords": list of short plot themes or setting keywords (e.g. ["university", "space", "time travel", "heist"])
    - "year": integer release year or null if not specified

    Return ONLY the raw JSON object. Do not add markdown or code fences.
    """

    selected_model = get_active_groq_model()

    chat_completion = groq_client.chat.completions.create(
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        model=selected_model,
        temperature=0.1,
    )

    content = chat_completion.choices[0].message.content.strip()
    
    if content.startswith("```"):
        content = content.strip("`").replace("json\n", "", 1).strip()
        
    try:
        return json.loads(content)
    except Exception:
        return {"genres": [], "people": [], "keywords": [], "year": None}


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


async def discover_movies_with_ai(user_prompt: str):
    """Executes the pipeline: User prompt -> LLM JSON -> TMDB Discover API."""
    if not TMDB_API_KEY:
        raise RuntimeError("TMDB_API_KEY is not set. Add it to backend/.env and restart uvicorn.")

    extracted = await extract_search_entities(user_prompt)
    print(f"DEBUG Extracted Intent: {extracted}")

    async with httpx.AsyncClient() as client:
        # 1. Resolve Genre IDs
        genre_ids = []
        for g in extracted.get("genres", []):
            key = g.lower().strip()
            gid = TMDB_GENRE_MAP.get(key) or TMDB_GENRE_MAP.get(key.replace("-", " "))
            if gid:
                genre_ids.append(str(gid))

        # 2. Resolve People IDs
        person_ids = []
        for p in extracted.get("people", []):
            pid = await resolve_tmdb_person_id(client, p)
            if pid:
                person_ids.append(str(pid))

        # 3. Resolve Keyword IDs
        keyword_ids = []
        for kw in extracted.get("keywords", [])[:2]:
            kid = await resolve_tmdb_keyword_id(client, kw)
            if kid:
                keyword_ids.append(str(kid))

        # 4. Build TMDB Discover Query Parameters
        params = {
            "api_key": TMDB_API_KEY,
            "sort_by": "popularity.desc",
            "include_adult": "false",
            "page": 1
        }

        if genre_ids:
            params["with_genres"] = ",".join(genre_ids)
        if person_ids:
            params["with_people"] = ",".join(person_ids)
        if keyword_ids:
            params["with_keywords"] = "|".join(keyword_ids)
        if extracted.get("year"):
            params["primary_release_year"] = extracted["year"]

        discover_url = "https://api.themoviedb.org/3/discover/movie"

        async def fetch_discover(query_params: dict):
            r = await client.get(discover_url, params=query_params)
            if r.status_code == 200:
                return r.json().get("results", [])
            return []

        raw_results = await fetch_discover(params)
        if not raw_results and keyword_ids:
            relaxed = {k: v for k, v in params.items() if k != "with_keywords"}
            raw_results = await fetch_discover(relaxed)
        if not raw_results and person_ids and genre_ids:
            relaxed = {
                "api_key": TMDB_API_KEY,
                "sort_by": "popularity.desc",
                "include_adult": "false",
                "page": 1,
                "with_genres": params.get("with_genres", ""),
                "with_people": params.get("with_people", ""),
            }
            raw_results = await fetch_discover(relaxed)

        movies = []
        if raw_results:
            for m in raw_results[:12]:
                movies.append({
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
                    "vote_average": m.get("vote_average", 0.0)
                })

        return {
            "query_parsed": extracted,
            "results_count": len(movies),
            "movies": movies
        }
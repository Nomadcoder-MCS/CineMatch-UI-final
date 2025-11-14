# Fetch TMDb metadata for MovieLens tmdbIds and write data/interim/tmdb_metadata.csv
import os, time, math
import pandas as pd
import requests
from dotenv import load_dotenv

ML_LINKS = "raw/ml-32m/links.csv"
OUT_CSV  = "raw/tmdb/tmdb_metadata.csv"
LANG     = "en-US"
APPENDS  = "credits,keywords"

# Safety: start small for testing, then set to None for full run
MAX_IDS  = 500   # Start with 500, then set to None for production

def bearer_headers():
    load_dotenv()
    token = os.getenv("TMDB_BEARER_TOKEN")
    if not token:
        raise SystemExit("Missing TMDB_BEARER_TOKEN in .env")
    return {"Authorization": f"Bearer {token}"}

def read_tmdb_ids(path):
    links = pd.read_csv(path, usecols=["movieId", "tmdbId"])  # type: ignore
    ids = pd.to_numeric(links["tmdbId"], errors="coerce").dropna().astype("int64").unique()  # type: ignore
    return ids.tolist()

def parse_record(j):
    # Keywords structure is {"id":..., "keywords":[{id,name},...]}
    kw = j.get("keywords", {})
    kw_list = kw.get("keywords", []) if isinstance(kw, dict) else []
    keywords = "|".join(sorted({k.get("name","").strip().lower() for k in kw_list if k.get("name")}))

    # Credits structure: {"cast":[...], "crew":[...]}
    cr = j.get("credits", {}) or {}
    cast = cr.get("cast", []) or []
    crew = cr.get("crew", []) or []

    # Top 3 billed cast names by 'order'
    cast_sorted = sorted([c for c in cast if "name" in c], key=lambda c: c.get("order", 999))
    cast_top = "|".join([c["name"] for c in cast_sorted[:3]])

    # Director
    director = next((m["name"] for m in crew if m.get("job") == "Director" and "name" in m), None)

    genres = "|".join(sorted({g.get("name","").strip().lower() for g in j.get("genres", []) if g.get("name")}))

    return {
        "tmdb_id": j.get("id"),
        "title": j.get("title"),
        "release_date": j.get("release_date"),
        "runtime": j.get("runtime"),
        "popularity": j.get("popularity"),
        "vote_count": j.get("vote_count"),        # <-- add
        "vote_average": j.get("vote_average"),    # <-- add
        "genres": genres,
        "overview": j.get("overview"),
        "keywords": keywords,
        "cast_top": cast_top,
        "director": director
    }

def fetch_one(session, tmdb_id, headers, backoff=0.5, retries=3):
    url = f"https://api.themoviedb.org/3/movie/{tmdb_id}"
    params = {"append_to_response": APPENDS, "language": LANG}
    for attempt in range(retries):
        r = session.get(url, headers=headers, params=params, timeout=30)
        if r.status_code == 200:
            return parse_record(r.json())
        if r.status_code == 429:
            wait = float(r.headers.get("Retry-After", backoff))
            time.sleep(wait)
            backoff = min(backoff * 2, 8.0)
            continue
        if 500 <= r.status_code < 600:
            time.sleep(backoff)
            backoff = min(backoff * 2, 8.0)
            continue
        # 4xx other than 429: give up on this id
        return {"tmdb_id": tmdb_id, "error": f"{r.status_code}"}
    return {"tmdb_id": tmdb_id, "error": "max_retries"}

def main():
    os.makedirs(os.path.dirname(OUT_CSV), exist_ok=True)
    headers = bearer_headers()
    all_ids = read_tmdb_ids(ML_LINKS)
    if MAX_IDS:
        all_ids = all_ids[:MAX_IDS]
    print(f"Fetching TMDb for {len(all_ids)} ids...")

    out = []
    with requests.Session() as s:
        for i, tid in enumerate(all_ids, 1):
            rec = fetch_one(s, tid, headers)
            out.append(rec)
            if i % 200 == 0:
                print(f"...{i}/{len(all_ids)}")
            # polite pacing; official guidance suggests ~50 rps upper bound
            time.sleep(0.02)

    df = pd.DataFrame(out)
    # Drop rows that totally failed if you want
    # df = df[df["error"].isna()]  # uncomment to exclude error rows

    df.to_csv(OUT_CSV, index=False, encoding="utf-8")
    ok = df["tmdb_id"].notna().sum()
    print(f"Wrote {OUT_CSV} with {len(df)} rows ({ok} ok).")

if __name__ == "__main__":
    main()

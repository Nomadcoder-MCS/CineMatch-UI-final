import argparse
import pandas as pd

DEF_ITEMS = "data/interim/items_clean.csv"
DEF_TMDB  = "data/interim/tmdb_metadata.csv"
DEF_OUT   = "data/interim/items_with_tmdb.csv"

def coalesce(df: pd.DataFrame, base: str) -> None:
    """Create df[base] by preferring base_tmdb, then base_items, then leaving NA."""
    tm = f"{base}_tmdb"
    it = f"{base}_items"
    have = [c for c in (tm, it, base) if c in df.columns]
    if not have:
        df[base] = pd.NA
        return
    s = df[have[0]].copy()
    for c in have[1:]:
        s = s.where(s.notna(), df[c])
    df[base] = s
    # clean up suffixed columns if present
    drop_cols = [c for c in (tm, it) if c in df.columns]
    if drop_cols:
        df.drop(columns=drop_cols, inplace=True)

def main(in_items: str, in_tmdb: str, out_path: str):
    items = pd.read_csv(in_items)
    tmdb  = pd.read_csv(in_tmdb)

    # ---- Normalize TMDb columns ----
    # Year from release_date
    if "release_date" in tmdb.columns:
        tmdb["release_year"] = tmdb["release_date"].astype(str).str[:4]
    else:
        tmdb["release_year"] = pd.NA

    # keywords -> tags_text
    if "keywords" in tmdb.columns:
        tmdb["tags_text"] = (
            tmdb["keywords"].fillna("").astype(str)
            .str.replace(",", " ", regex=False)
            .str.replace("|", " ", regex=False)
        )
    else:
        tmdb["tags_text"] = ""

    # genres -> genres_list
    if "genres" in tmdb.columns:
        tmdb["genres_list"] = tmdb["genres"].fillna("").apply(
            lambda s: [g.strip() for g in str(s).split("|") if g.strip()]
        )
    else:
        tmdb["genres_list"] = [[] for _ in range(len(tmdb))]

    # Harmonize names
    if "cast_top" in tmdb.columns and "cast" not in tmdb.columns:
        tmdb = tmdb.rename(columns={"cast_top": "cast"})
    if "director" in tmdb.columns and "crew_director" not in tmdb.columns:
        tmdb = tmdb.rename(columns={"director": "crew_director"})

    # Ensure expected numeric cols exist (will fill NA if missing)
    for c in ["runtime", "vote_count", "vote_average", "popularity"]:
        if c not in tmdb.columns:
            tmdb[c] = pd.NA

    # ---- Merge with explicit suffixes ----
    key = "tmdb_id" if ("tmdb_id" in items.columns and "tmdb_id" in tmdb.columns) else "movie_id"
    keep_tmdb = ["tmdb_id","release_year","runtime","vote_count","vote_average",
                 "popularity","overview","tags_text","genres_list","cast","crew_director"]
    keep_tmdb = [c for c in keep_tmdb if c in tmdb.columns]
    merged = items.merge(
        tmdb[keep_tmdb],
        on=key, how="left", suffixes=("_items", "_tmdb")
    )

    # ---- Coalesce columns (prefer TMDb) ----
    for col in ["overview","runtime","vote_count","vote_average","popularity",
                "cast","crew_director","genres_list","tags_text","release_year"]:
        coalesce(merged, col)

    # If you want a single 'year' column, fill missing from release_year
    if "year" in merged.columns:
        merged["year"] = merged["year"].fillna(merged["release_year"])
    else:
        merged["year"] = merged["release_year"]

    # Save
    merged.to_csv(out_path, index=False, encoding="utf-8")
    print(f"[OK] wrote {out_path} with {len(merged)} rows")
    # Quick visibility
    cols_show = ["movie_id","title","tmdb_id","runtime","vote_count","vote_average","year","overview"]
    print("[sample cols present]", [c for c in cols_show if c in merged.columns])

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--in-items", default=DEF_ITEMS)
    ap.add_argument("--in-tmdb",  default=DEF_TMDB)
    ap.add_argument("--out",      default=DEF_OUT)
    args = ap.parse_args()
    main(args.in_items, args.in_tmdb, args.out)

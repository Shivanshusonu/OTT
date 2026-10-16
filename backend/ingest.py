"""
backend/ingest.py
-----------------
CLI script: load Kaggle CSV files from data/ into the SQLite database.

Run from the workspace root:
    python backend/ingest.py

CSVs expected in data/:
    netflix_titles.csv   – Netflix/OTT catalogue
    imdb_titles.csv      – IMDb title basics  (tconst, primaryTitle, startYear, genres, …)
    imdb_ratings.csv     – IMDb ratings       (tconst, averageRating, numVotes)
    box_office.csv       – Box-office figures (title, budget, worldwide_gross, …)
"""

import os
import re
import sys

# Allow "python backend/ingest.py" from workspace root to find sibling modules
sys.path.insert(0, os.path.dirname(__file__))

import pandas as pd
from sqlalchemy import text

from database import SessionLocal, engine
from models import (
    Award,
    Base,
    BoxOffice,
    CastMember,
    Country,
    Genre,
    Rating,
    Title,
    TitleCast,
    TitleCountry,
    TitleGenre,
)

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
WORKSPACE_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(WORKSPACE_ROOT, "data")

NETFLIX_CSV = os.path.join(DATA_DIR, "netflix_titles.csv")
IMDB_TITLES_CSV = os.path.join(DATA_DIR, "imdb_titles.csv")
IMDB_RATINGS_CSV = os.path.join(DATA_DIR, "imdb_ratings.csv")
BOX_OFFICE_CSV = os.path.join(DATA_DIR, "box_office.csv")

ORIGINALS_KEYWORDS = {"original", "netflix original", "netflix exclusive"}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _split_pipe_or_comma(value: str) -> list[str]:
    """Split a multi-value string by pipe or comma, strip whitespace."""
    if not value or not isinstance(value, str):
        return []
    sep = "|" if "|" in value else ","
    return [v.strip() for v in value.split(sep) if v.strip()]


def _parse_duration(duration_str: str, title_type: str) -> tuple[int | None, int | None]:
    """
    Return (duration_minutes, episode_count).
    For Movies  → parse "120 min"  → (120, None)
    For TV Show → parse "3 Seasons"/"12 episodes" → (None, number)
    """
    duration_minutes = None
    episode_count = None
    if not duration_str or not isinstance(duration_str, str):
        return duration_minutes, episode_count
    lower = duration_str.lower().strip()
    m = re.search(r"(\d+)", lower)
    if not m:
        return duration_minutes, episode_count
    n = int(m.group(1))
    if title_type == "Movie":
        duration_minutes = n
    else:
        # TV Show — "2 Seasons" treated as season count (use as episode_count proxy)
        episode_count = n
    return duration_minutes, episode_count


def _is_original(description: str) -> bool:
    if not description or not isinstance(description, str):
        return False
    lower = description.lower()
    return any(kw in lower for kw in ORIGINALS_KEYWORDS)


def _safe_int(val) -> int | None:
    try:
        v = str(val).replace(",", "").replace("$", "").strip()
        return int(float(v))
    except Exception:
        return None


def _safe_float(val) -> float | None:
    try:
        return float(val)
    except Exception:
        return None


# ---------------------------------------------------------------------------
# Truncate
# ---------------------------------------------------------------------------

def truncate_all(db):
    """Delete all rows in reverse FK order so constraints are not violated."""
    print("Truncating all tables …")
    # SQLite does not support TRUNCATE; DELETE FROM is equivalent
    for table in [
        "awards",
        "title_cast",
        "title_countries",
        "title_genres",
        "box_office",
        "ratings",
        "cast_members",
        "countries",
        "genres",
        "titles",
    ]:
        db.execute(text(f"DELETE FROM {table}"))
    db.commit()
    print("  All tables cleared.\n")


# ---------------------------------------------------------------------------
# Netflix CSV  →  Title, Genre, TitleGenre, Country, TitleCountry, CastMember, TitleCast
# ---------------------------------------------------------------------------

def ingest_netflix(db, path: str):
    if not os.path.exists(path):
        print(f"  [SKIP] {path} not found — skipping Netflix ingestion.\n")
        return

    print(f"Reading {path} …")
    df = pd.read_csv(path, dtype=str).fillna("")
    print(f"  {len(df)} rows loaded.")

    genre_cache: dict[str, int] = {}
    country_cache: dict[str, int] = {}
    cast_cache: dict[tuple[str, str], int] = {}

    titles_inserted = 0

    for _, row in df.iterrows():
        show_id = row.get("show_id", "").strip()
        title_str = row.get("title", "").strip()
        title_type = row.get("type", "").strip()  # "Movie" | "TV Show"
        if not show_id or not title_str or not title_type:
            continue

        # Duration
        duration_raw = row.get("duration", "").strip()
        dur_min, ep_count = _parse_duration(duration_raw, title_type)

        # Release year
        release_year = _safe_int(row.get("release_year", ""))

        # is_original
        description = row.get("description", "").strip()
        original_flag = _is_original(description)

        title_obj = Title(
            show_id=show_id,
            title=title_str,
            type=title_type,
            release_year=release_year,
            duration_str=duration_raw or None,
            duration_minutes=dur_min,
            episode_count=ep_count,
            description=description or None,
            platform="Netflix",
            language=None,
            is_original=original_flag,
        )
        db.add(title_obj)
        db.flush()  # get title_obj.id

        # --- Genres (listed_in column) ---
        genres_raw = row.get("listed_in", "").strip()
        for g_name in _split_pipe_or_comma(genres_raw):
            if g_name not in genre_cache:
                g = Genre(name=g_name)
                db.add(g)
                db.flush()
                genre_cache[g_name] = g.id
            db.add(TitleGenre(title_id=title_obj.id, genre_id=genre_cache[g_name]))

        # --- Countries ---
        country_raw = row.get("country", "").strip()
        for c_name in _split_pipe_or_comma(country_raw):
            if c_name not in country_cache:
                c = Country(name=c_name)
                db.add(c)
                db.flush()
                country_cache[c_name] = c.id
            db.add(TitleCountry(title_id=title_obj.id, country_id=country_cache[c_name]))

        # --- Cast (actors) ---
        cast_raw = row.get("cast", "").strip()
        for person in _split_pipe_or_comma(cast_raw):
            key = (person, "actor")
            if key not in cast_cache:
                cm = CastMember(name=person, role="actor")
                db.add(cm)
                db.flush()
                cast_cache[key] = cm.id
            db.add(TitleCast(title_id=title_obj.id, cast_id=cast_cache[key]))

        # --- Director ---
        director_raw = row.get("director", "").strip()
        for person in _split_pipe_or_comma(director_raw):
            key = (person, "director")
            if key not in cast_cache:
                cm = CastMember(name=person, role="director")
                db.add(cm)
                db.flush()
                cast_cache[key] = cm.id
            db.add(TitleCast(title_id=title_obj.id, cast_id=cast_cache[key]))

        titles_inserted += 1

        # Batch commit every 500 rows to keep memory manageable
        if titles_inserted % 500 == 0:
            db.commit()
            print(f"    … {titles_inserted} titles committed")

    db.commit()
    print(f"  Netflix ingestion done: {titles_inserted} titles.\n")


# ---------------------------------------------------------------------------
# IMDb CSVs  →  Rating
# ---------------------------------------------------------------------------

def ingest_imdb_ratings(db, titles_path: str, ratings_path: str):
    if not os.path.exists(titles_path) or not os.path.exists(ratings_path):
        missing = [p for p in (titles_path, ratings_path) if not os.path.exists(p)]
        print(f"  [SKIP] Missing IMDb files: {missing} — skipping ratings ingestion.\n")
        return

    print(f"Reading {titles_path} …")
    sep_t = "\t" if titles_path.lower().endswith((".tsv", ".tsv.gz")) else ","
    titles_df = pd.read_csv(titles_path, sep=sep_t, dtype=str, low_memory=False, na_values=["\\N"]).fillna("")

    print(f"Reading {ratings_path} …")
    sep_r = "\t" if ratings_path.lower().endswith((".tsv", ".tsv.gz")) else ","
    ratings_df = pd.read_csv(ratings_path, sep=sep_r, dtype=str, na_values=["\\N"]).fillna("")

    # Merge on tconst
    merged = titles_df.merge(ratings_df, on="tconst", how="inner")
    print(f"  {len(merged)} IMDb rows after merge.")

    # Build a quick title-name → title_id lookup from the DB
    print("  Building title name lookup …")
    db_titles = db.query(Title.id, Title.title).all()
    name_to_id: dict[str, int] = {t.title.lower().strip(): t.id for t in db_titles}

    inserted = 0
    for _, row in merged.iterrows():
        primary_title = row.get("primaryTitle", "").strip().lower()
        title_id = name_to_id.get(primary_title)
        if not title_id:
            continue

        imdb_score = _safe_float(row.get("averageRating", ""))
        imdb_votes = _safe_int(row.get("numVotes", ""))

        db.add(Rating(
            title_id=title_id,
            imdb_score=imdb_score,
            imdb_votes=imdb_votes,
            rt_score=None,
            meta_score=None,
            audience_score=None,
        ))
        inserted += 1
        if inserted % 500 == 0:
            db.commit()

    db.commit()
    print(f"  IMDb ratings ingestion done: {inserted} rows.\n")


# ---------------------------------------------------------------------------
# Box Office CSV  →  BoxOffice
# ---------------------------------------------------------------------------

def ingest_box_office(db, path: str):
    if not os.path.exists(path):
        print(f"  [SKIP] {path} not found — skipping box office ingestion.\n")
        return

    print(f"Reading {path} …")
    df = pd.read_csv(path, dtype=str).fillna("")
    print(f"  {len(df)} rows loaded.")

    # Build title name → id lookup
    db_titles = db.query(Title.id, Title.title).all()
    name_to_id: dict[str, int] = {t.title.lower().strip(): t.id for t in db_titles}

    # Detect column names defensively (Kaggle box-office CSVs vary)
    cols = {c.lower().strip(): c for c in df.columns}

    def _col(*candidates) -> str | None:
        for c in candidates:
            if c in cols:
                return cols[c]
        return None

    title_col = _col("title", "movie", "movie title", "film")
    budget_col = _col("budget", "production_budget", "production budget")
    worldwide_col = _col("worldwide_gross", "worldwide gross", "worldwide", "world gross", "total gross")
    domestic_col = _col("domestic_gross", "domestic gross", "domestic", "us gross")
    opening_col = _col("opening_weekend", "opening weekend", "opening")
    release_col = _col("release_date", "release date", "date")

    if not title_col:
        print("  [WARN] Cannot identify title column in box_office.csv — skipping.\n")
        return

    inserted = 0
    for _, row in df.iterrows():
        title_str = row.get(title_col, "").strip().lower()
        title_id = name_to_id.get(title_str)
        if not title_id:
            continue

        db.add(BoxOffice(
            title_id=title_id,
            budget=_safe_int(row.get(budget_col, "") if budget_col else ""),
            worldwide_gross=_safe_int(row.get(worldwide_col, "") if worldwide_col else ""),
            domestic_gross=_safe_int(row.get(domestic_col, "") if domestic_col else ""),
            opening_weekend=_safe_int(row.get(opening_col, "") if opening_col else ""),
            release_date=row.get(release_col, "").strip() if release_col else None,
        ))
        inserted += 1
        if inserted % 500 == 0:
            db.commit()

    db.commit()
    print(f"  Box office ingestion done: {inserted} rows.\n")


# ---------------------------------------------------------------------------
# Row counts
# ---------------------------------------------------------------------------

def print_row_counts(db):
    tables = [
        ("titles",         Title),
        ("genres",         Genre),
        ("title_genres",   TitleGenre),
        ("countries",      Country),
        ("title_countries",TitleCountry),
        ("ratings",        Rating),
        ("box_office",     BoxOffice),
        ("cast_members",   CastMember),
        ("title_cast",     TitleCast),
        ("awards",         Award),
    ]
    print("=" * 40)
    print(f"{'Table':<20} {'Rows':>8}")
    print("=" * 40)
    for label, model in tables:
        count = db.query(model).count()
        print(f"{label:<20} {count:>8,}")
    print("=" * 40)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    # Ensure DB tables exist (idempotent)
    Base.metadata.create_all(bind=engine)

    # Ensure data directory exists
    os.makedirs(DATA_DIR, exist_ok=True)

    db = SessionLocal()
    try:
        truncate_all(db)
        ingest_netflix(db, NETFLIX_CSV)
        ingest_imdb_ratings(db, IMDB_TITLES_CSV, IMDB_RATINGS_CSV)
        ingest_box_office(db, BOX_OFFICE_CSV)

        # Auto-seed synthetic ratings/box_office/awards if those tables are still empty
        # (happens when the optional IMDb/TMDB CSVs are not present)
        import seed_missing
        if db.query(Rating).count() == 0:
            print("\nNo ratings found after ingestion — running synthetic seed …")
            seed_missing.seed(db)

        print("\nFinal row counts:")
        print_row_counts(db)
    finally:
        db.close()


if __name__ == "__main__":
    main()

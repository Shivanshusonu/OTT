"""
backend/seed_missing.py
-----------------------
Fills ratings, box office, and awards for titles already in the DB.
Does NOT touch titles, genres, countries, or cast — real Netflix data stays intact.
Safe to re-run — clears only ratings, box_office, awards before inserting.

Run from repo root:
    python backend/seed_missing.py
"""
import os
import sys
import random

sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy import text
from database import SessionLocal, engine
from models import Base, Title, Rating, BoxOffice, Award

rng = random.Random(99)

CEREMONIES = ["Oscars", "Emmys", "BAFTA", "Golden Globes", "SAG Awards"]
AWARD_CATEGORIES = [
    "Best Picture", "Best Director", "Best Actor", "Best Actress",
    "Best Supporting Actor", "Best Supporting Actress",
    "Best Original Screenplay", "Best Cinematography",
    "Best Drama Series", "Best Comedy Series", "Best Documentary",
    "Best Animated Feature", "Best International Film",
]
MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
]


def clear_tables(db):
    print("Clearing ratings, box_office, awards ...")
    for tbl in ["awards", "box_office", "ratings"]:
        db.execute(text(f"DELETE FROM {tbl}"))
    db.commit()
    print("  Done.\n")


def seed_ratings(db, titles):
    print(f"Seeding ratings for {len(titles)} titles ...")
    inserted = 0
    for t in titles:
        if rng.random() > 0.10:
            year_bonus = max(0.0, (1990 - (t.release_year or 2000)) * 0.005)
            imdb = round(min(10.0, max(1.5, rng.gauss(6.8 + year_bonus, 1.3))), 1)
            votes = int(rng.lognormvariate(10, 2))
            votes = max(100, min(votes, 3_000_000))
            rt   = min(100, max(0, int(imdb * 9.8  + rng.gauss(0, 9))))
            meta = min(100, max(0, int(imdb * 9.3  + rng.gauss(0, 11))))
            aud  = min(100, max(0, int(imdb * 9.6  + rng.gauss(0, 8))))
            db.add(Rating(
                title_id=t.id,
                imdb_score=imdb,
                imdb_votes=votes,
                rt_score=rt,
                meta_score=meta,
                audience_score=aud,
            ))
            inserted += 1
        if inserted % 500 == 0 and inserted > 0:
            db.commit()
            print(f"  ... {inserted} ratings committed")
    db.commit()
    print(f"  Ratings done: {inserted} rows.\n")


def seed_box_office(db, titles):
    movies = [t for t in titles if t.type == "Movie"]
    print(f"Seeding box office for {len(movies)} movies ...")
    inserted = 0
    for t in movies:
        if rng.random() > 0.25:
            budget = int(rng.lognormvariate(17.5, 1.2))
            budget = max(500_000, min(budget, 350_000_000))
            budget = round(budget / 500_000) * 500_000
            if budget < 10_000_000:
                mult = max(0.05, rng.gauss(4.0, 3.0))
            elif budget < 50_000_000:
                mult = max(0.05, rng.gauss(2.8, 1.8))
            else:
                mult = max(0.05, rng.gauss(2.0, 1.2))
            gross    = int(budget * mult)
            domestic = int(gross * rng.uniform(0.30, 0.65))
            opening  = int(domestic * rng.uniform(0.12, 0.38))
            month    = rng.choice(MONTHS)
            day      = rng.randint(1, 28)
            year     = t.release_year or rng.randint(2000, 2024)
            db.add(BoxOffice(
                title_id=t.id,
                budget=budget,
                worldwide_gross=gross,
                domestic_gross=domestic,
                opening_weekend=opening,
                release_date=f"{month} {day}, {year}",
            ))
            inserted += 1
        if inserted % 500 == 0 and inserted > 0:
            db.commit()
    db.commit()
    print(f"  Box office done: {inserted} rows.\n")


def seed_awards(db, titles):
    n_award_titles = max(50, len(titles) // 4)
    award_pool = rng.sample(titles, min(n_award_titles, len(titles)))
    print(f"Seeding awards for {len(award_pool)} titles ...")
    inserted = 0
    for t in award_pool:
        for _ in range(rng.randint(1, 6)):
            year = (t.release_year or 2020) + rng.randint(0, 2)
            db.add(Award(
                title_id=t.id,
                ceremony=rng.choice(CEREMONIES),
                category=rng.choice(AWARD_CATEGORIES),
                is_winner=rng.random() < 0.30,
                year=min(year, 2025),
            ))
            inserted += 1
    db.commit()
    print(f"  Awards done: {inserted} rows.\n")


def print_counts(db):
    for tbl in ["titles", "ratings", "box_office", "awards"]:
        n = db.execute(text(f"SELECT COUNT(*) FROM {tbl}")).scalar()
        print(f"  {tbl:<20} {n:>8,}")


def seed(db):
    """Seed ratings, box_office, awards using an existing DB session.
    Clears the three tables first then re-populates from all current titles.
    Called by main.py on startup when tables are empty, and by main() below.
    """
    titles = db.query(Title).all()
    if not titles:
        return
    clear_tables(db)
    seed_ratings(db, titles)
    seed_box_office(db, titles)
    seed_awards(db, titles)


def main():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        titles = db.query(Title).all()
        if not titles:
            print("ERROR: No titles found. Run ingest.py first, then re-run this script.")
            return
        print(f"Found {len(titles)} titles in DB.\n")
        seed(db)
        print("=" * 40)
        print_counts(db)
        print("=" * 40)
        print("\nDone! Restart uvicorn and refresh http://localhost:5173")
    finally:
        db.close()


if __name__ == "__main__":
    main()

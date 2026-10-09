from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from models import Genre, Rating, Title, TitleGenre

router = APIRouter(prefix="/ratings", tags=["ratings"])


@router.get("/distribution")
def imdb_distribution(db: Session = Depends(get_db)):
    rows = db.query(Rating.imdb_score).filter(Rating.imdb_score.isnot(None)).all()
    buckets: dict[str, int] = {}
    for i in range(20):
        low = i * 0.5
        high = low + 0.5
        label = f"{low:.1f}-{high:.1f}"
        buckets[label] = 0
    for (score,) in rows:
        idx = min(int(score / 0.5), 19)
        low = idx * 0.5
        high = low + 0.5
        label = f"{low:.1f}-{high:.1f}"
        buckets[label] = buckets.get(label, 0) + 1
    return [{"bucket": k, "count": v} for k, v in buckets.items()]


@router.get("/critic-vs-audience")
def critic_vs_audience(db: Session = Depends(get_db)):
    rows = (
        db.query(Title.title, Rating.rt_score, Rating.audience_score, Title.platform)
        .join(Rating, Rating.title_id == Title.id)
        .filter(Rating.rt_score.isnot(None), Rating.audience_score.isnot(None))
        .limit(500)
        .all()
    )
    return [
        {"title": r[0], "rt_score": r[1], "audience_score": r[2], "platform": r[3]}
        for r in rows
    ]


@router.get("/top-rated")
def top_rated(
    limit: int = Query(20, ge=1, le=200),
    genre: Optional[str] = None,
    platform: Optional[str] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db),
):
    q = (
        db.query(Title.id, Title.title, Title.type, Title.release_year, Title.platform,
                 Rating.imdb_score, Rating.imdb_votes)
        .join(Rating, Rating.title_id == Title.id)
        .filter(Rating.imdb_score.isnot(None))
    )
    if platform:
        q = q.filter(Title.platform == platform)
    if year:
        q = q.filter(Title.release_year == year)
    if genre:
        q = (
            q.join(TitleGenre, TitleGenre.title_id == Title.id)
            .join(Genre, Genre.id == TitleGenre.genre_id)
            .filter(Genre.name == genre)
        )
    rows = q.order_by(Rating.imdb_score.desc()).limit(limit).all()
    return [
        {
            "id": r[0],
            "title": r[1],
            "type": r[2],
            "release_year": r[3],
            "platform": r[4],
            "imdb_score": r[5],
            "imdb_votes": r[6],
        }
        for r in rows
    ]


@router.get("/by-genre")
def ratings_by_genre(db: Session = Depends(get_db)):
    rows = (
        db.query(Genre.name, func.avg(Rating.imdb_score).label("avg"), func.count(Rating.id).label("cnt"))
        .join(TitleGenre, TitleGenre.genre_id == Genre.id)
        .join(Rating, Rating.title_id == TitleGenre.title_id)
        .filter(Rating.imdb_score.isnot(None))
        .group_by(Genre.name)
        .order_by(func.avg(Rating.imdb_score).desc())
        .all()
    )
    return [{"genre": r[0], "avg_imdb_score": round(r[1], 2), "count": r[2]} for r in rows]

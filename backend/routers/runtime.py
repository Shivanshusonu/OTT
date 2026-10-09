from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from models import Genre, Title, TitleGenre

router = APIRouter(prefix="/runtime", tags=["runtime"])


@router.get("/avg-by-year")
def avg_by_year(db: Session = Depends(get_db)):
    rows = (
        db.query(Title.release_year, func.avg(Title.duration_minutes).label("avg_min"))
        .filter(
            Title.type == "Movie",
            Title.duration_minutes.isnot(None),
            Title.release_year.isnot(None),
        )
        .group_by(Title.release_year)
        .order_by(Title.release_year)
        .all()
    )
    return [{"release_year": r[0], "avg_minutes": round(r[1], 1)} for r in rows]


@router.get("/format-trends")
def format_trends(db: Session = Depends(get_db)):
    rows = (
        db.query(Title.release_year, Title.type, func.count(Title.id).label("count"))
        .filter(Title.release_year.isnot(None))
        .group_by(Title.release_year, Title.type)
        .order_by(Title.release_year, Title.type)
        .all()
    )
    return [{"release_year": r[0], "type": r[1], "count": r[2]} for r in rows]


@router.get("/series-length")
def series_length(db: Session = Depends(get_db)):
    rows = (
        db.query(Genre.name, func.avg(Title.episode_count).label("avg_ep"))
        .join(TitleGenre, TitleGenre.title_id == Title.id)
        .join(Genre, Genre.id == TitleGenre.genre_id)
        .filter(Title.type == "TV Show", Title.episode_count.isnot(None))
        .group_by(Genre.name)
        .order_by(func.avg(Title.episode_count).desc())
        .all()
    )
    return [{"genre": r[0], "avg_episode_count": round(r[1], 1)} for r in rows]


@router.get("/runtime-distribution")
def runtime_distribution(db: Session = Depends(get_db)):
    rows = (
        db.query(Title.duration_minutes)
        .filter(Title.type == "Movie", Title.duration_minutes.isnot(None))
        .all()
    )
    buckets: dict[str, int] = {}
    for i in range(30):  # 0-300 in 10-min increments
        low = i * 10
        high = low + 10
        label = f"{low}-{high}"
        buckets[label] = 0
    for (mins,) in rows:
        if 0 <= mins < 300:
            idx = min(mins // 10, 29)
            low = idx * 10
            label = f"{low}-{low + 10}"
            buckets[label] = buckets.get(label, 0) + 1
    return [{"bucket": k, "count": v} for k, v in buckets.items()]

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from models import Genre, Rating, Title, TitleGenre

router = APIRouter(prefix="/platforms", tags=["platforms"])


@router.get("/summary")
def summary(db: Session = Depends(get_db)):
    platform_counts = (
        db.query(Title.platform, Title.type, func.count(Title.id))
        .group_by(Title.platform, Title.type)
        .all()
    )
    platform_avg = (
        db.query(Title.platform, func.avg(Rating.imdb_score))
        .join(Rating, Rating.title_id == Title.id)
        .filter(Rating.imdb_score.isnot(None))
        .group_by(Title.platform)
        .all()
    )
    avg_map = {p: round(a, 2) if a else None for p, a in platform_avg}
    data: dict = {}
    for platform, type_, count in platform_counts:
        if platform not in data:
            data[platform] = {"platform": platform, "total_titles": 0, "movie_count": 0, "show_count": 0}
        data[platform]["total_titles"] += count
        if type_ == "Movie":
            data[platform]["movie_count"] += count
        elif type_ == "TV Show":
            data[platform]["show_count"] += count
    return [
        {**v, "avg_imdb_score": avg_map.get(v["platform"])}
        for v in data.values()
    ]


@router.get("/genre-distribution")
def genre_distribution(db: Session = Depends(get_db)):
    rows = (
        db.query(Title.platform, Genre.name, func.count(TitleGenre.title_id).label("count"))
        .join(TitleGenre, TitleGenre.title_id == Title.id)
        .join(Genre, Genre.id == TitleGenre.genre_id)
        .group_by(Title.platform, Genre.name)
        .order_by(Title.platform, func.count(TitleGenre.title_id).desc())
        .all()
    )
    return [{"platform": r[0], "genre": r[1], "count": r[2]} for r in rows]


@router.get("/release-cadence")
def release_cadence(db: Session = Depends(get_db)):
    rows = (
        db.query(Title.platform, Title.release_year, func.count(Title.id).label("count"))
        .filter(Title.release_year.isnot(None))
        .group_by(Title.platform, Title.release_year)
        .order_by(Title.platform, Title.release_year)
        .all()
    )
    return [{"platform": r[0], "release_year": r[1], "count": r[2]} for r in rows]


@router.get("/originals-vs-licensed")
def originals_vs_licensed(db: Session = Depends(get_db)):
    rows = (
        db.query(Title.platform, Title.is_original, func.count(Title.id).label("count"))
        .group_by(Title.platform, Title.is_original)
        .all()
    )
    return [{"platform": r[0], "is_original": r[1], "count": r[2]} for r in rows]

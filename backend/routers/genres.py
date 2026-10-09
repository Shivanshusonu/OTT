from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from models import Country, Genre, Title, TitleCountry, TitleGenre

router = APIRouter(prefix="/genres", tags=["genres"])


@router.get("/popularity-over-time")
def popularity_over_time(db: Session = Depends(get_db)):
    rows = (
        db.query(Title.release_year, Genre.name, func.count(TitleGenre.title_id).label("count"))
        .join(TitleGenre, TitleGenre.title_id == Title.id)
        .join(Genre, Genre.id == TitleGenre.genre_id)
        .filter(Title.release_year.isnot(None))
        .group_by(Title.release_year, Genre.name)
        .all()
    )
    # compute decade in Python
    result = []
    for year, genre, count in rows:
        decade = (year // 10) * 10
        result.append({"decade": decade, "genre": genre, "count": count})
    # aggregate by decade+genre
    agg: dict[tuple, int] = {}
    for item in result:
        key = (item["decade"], item["genre"])
        agg[key] = agg.get(key, 0) + item["count"]
    return [{"decade": k[0], "genre": k[1], "count": v} for k, v in sorted(agg.items())]


@router.get("/top-genres")
def top_genres(db: Session = Depends(get_db)):
    rows = (
        db.query(Genre.name, func.count(TitleGenre.title_id).label("count"))
        .join(TitleGenre, TitleGenre.genre_id == Genre.id)
        .group_by(Genre.name)
        .order_by(func.count(TitleGenre.title_id).desc())
        .all()
    )
    return [{"genre": r[0], "count": r[1]} for r in rows]


@router.get("/language-growth")
def language_growth(db: Session = Depends(get_db)):
    rows = (
        db.query(Title.language, Title.release_year, func.count(Title.id).label("count"))
        .filter(Title.language.isnot(None), Title.release_year.isnot(None))
        .group_by(Title.language, Title.release_year)
        .order_by(Title.language, Title.release_year)
        .all()
    )
    return [{"language": r[0], "release_year": r[1], "count": r[2]} for r in rows]


@router.get("/regional")
def regional(db: Session = Depends(get_db)):
    # find top 10 countries by total title count
    top_countries_rows = (
        db.query(Country.name, func.count(TitleCountry.title_id).label("total"))
        .join(TitleCountry, TitleCountry.country_id == Country.id)
        .group_by(Country.name)
        .order_by(func.count(TitleCountry.title_id).desc())
        .limit(10)
        .all()
    )
    top_country_names = [r[0] for r in top_countries_rows]
    if not top_country_names:
        return []
    rows = (
        db.query(Country.name, Title.release_year, func.count(TitleCountry.title_id).label("count"))
        .join(TitleCountry, TitleCountry.country_id == Country.id)
        .join(Title, Title.id == TitleCountry.title_id)
        .filter(Country.name.in_(top_country_names), Title.release_year.isnot(None))
        .group_by(Country.name, Title.release_year)
        .order_by(Country.name, Title.release_year)
        .all()
    )
    return [{"country": r[0], "release_year": r[1], "count": r[2]} for r in rows]

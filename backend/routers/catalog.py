from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from database import get_db
from models import Country, Genre, Rating, Title, TitleCountry, TitleGenre, TitleCast, CastMember

router = APIRouter(prefix="/catalog", tags=["catalog"])


@router.get("")
def list_catalog(
    platform: Optional[str] = None,
    type: Optional[str] = None,
    genre: Optional[str] = None,
    release_year: Optional[int] = None,
    page: int = Query(0, ge=0),
    page_size: int = Query(20, ge=1, le=200),
    db: Session = Depends(get_db),
):
    q = db.query(Title)
    if platform:
        q = q.filter(Title.platform == platform)
    if type:
        q = q.filter(Title.type == type)
    if release_year:
        q = q.filter(Title.release_year == release_year)
    if genre:
        q = (
            q.join(TitleGenre, TitleGenre.title_id == Title.id)
            .join(Genre, Genre.id == TitleGenre.genre_id)
            .filter(Genre.name == genre)
        )
    total = q.count()
    items = q.offset(page * page_size).limit(page_size).all()
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": [
            {
                "id": t.id,
                "show_id": t.show_id,
                "title": t.title,
                "type": t.type,
                "release_year": t.release_year,
                "platform": t.platform,
                "duration_str": t.duration_str,
                "is_original": t.is_original,
            }
            for t in items
        ],
    }


@router.get("/filters")
def get_filters(db: Session = Depends(get_db)):
    platforms = [r[0] for r in db.query(Title.platform).distinct().order_by(Title.platform).all() if r[0]]
    types = [r[0] for r in db.query(Title.type).distinct().order_by(Title.type).all() if r[0]]
    genres = [r[0] for r in db.query(Genre.name).distinct().order_by(Genre.name).all() if r[0]]
    years = [
        r[0]
        for r in db.query(Title.release_year).distinct().order_by(Title.release_year).all()
        if r[0] is not None
    ]
    return {"platforms": platforms, "types": types, "genres": genres, "years": years}


@router.get("/{title_id}")
def get_title(title_id: int, db: Session = Depends(get_db)):
    title = db.query(Title).filter(Title.id == title_id).first()
    if title is None:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Title not found")

    genres = (
        db.query(Genre.name)
        .join(TitleGenre, TitleGenre.genre_id == Genre.id)
        .filter(TitleGenre.title_id == title_id)
        .all()
    )
    countries = (
        db.query(Country.name)
        .join(TitleCountry, TitleCountry.country_id == Country.id)
        .filter(TitleCountry.title_id == title_id)
        .all()
    )
    rating = db.query(Rating).filter(Rating.title_id == title_id).first()
    cast = (
        db.query(CastMember.id, CastMember.name, CastMember.role)
        .join(TitleCast, TitleCast.cast_id == CastMember.id)
        .filter(TitleCast.title_id == title_id)
        .all()
    )
    return {
        "id": title.id,
        "show_id": title.show_id,
        "title": title.title,
        "type": title.type,
        "release_year": title.release_year,
        "platform": title.platform,
        "duration_str": title.duration_str,
        "duration_minutes": title.duration_minutes,
        "episode_count": title.episode_count,
        "description": title.description,
        "language": title.language,
        "is_original": title.is_original,
        "genres": [g[0] for g in genres],
        "countries": [c[0] for c in countries],
        "rating": {
            "imdb_score": rating.imdb_score,
            "imdb_votes": rating.imdb_votes,
            "rt_score": rating.rt_score,
            "meta_score": rating.meta_score,
            "audience_score": rating.audience_score,
        } if rating else None,
        "cast": [{"id": c[0], "name": c[1], "role": c[2]} for c in cast],
    }

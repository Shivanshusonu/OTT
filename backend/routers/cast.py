from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from models import CastMember, Genre, Rating, Title, TitleCast, TitleGenre

router = APIRouter(prefix="/cast", tags=["cast"])


@router.get("/prolific")
def prolific(
    role: str = Query("actor"),
    limit: int = Query(20, ge=1, le=200),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(
            CastMember.id,
            CastMember.name,
            CastMember.role,
            func.count(TitleCast.title_id).label("title_count"),
            func.avg(Rating.imdb_score).label("avg_imdb"),
        )
        .join(TitleCast, TitleCast.cast_id == CastMember.id)
        .outerjoin(Rating, Rating.title_id == TitleCast.title_id)
        .filter(CastMember.role == role)
        .group_by(CastMember.id, CastMember.name, CastMember.role)
        .order_by(func.count(TitleCast.title_id).desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "cast_id": r[0],
            "name": r[1],
            "role": r[2],
            "title_count": r[3],
            "avg_imdb_score": round(r[4], 2) if r[4] else None,
        }
        for r in rows
    ]


@router.get("/career-trajectory/{person_id}")
def career_trajectory(person_id: int, db: Session = Depends(get_db)):
    rows = (
        db.query(
            Title.release_year,
            func.avg(Rating.imdb_score).label("avg_imdb"),
            func.count(Title.id).label("title_count"),
        )
        .join(TitleCast, TitleCast.title_id == Title.id)
        .outerjoin(Rating, Rating.title_id == Title.id)
        .filter(TitleCast.cast_id == person_id, Title.release_year.isnot(None))
        .group_by(Title.release_year)
        .order_by(Title.release_year)
        .all()
    )
    return [
        {
            "release_year": r[0],
            "avg_imdb_score": round(r[1], 2) if r[1] else None,
            "title_count": r[2],
        }
        for r in rows
    ]


@router.get("/genre-specialization/{person_id}")
def genre_specialization(person_id: int, db: Session = Depends(get_db)):
    rows = (
        db.query(Genre.name, func.count(TitleGenre.title_id).label("count"))
        .join(TitleGenre, TitleGenre.genre_id == Genre.id)
        .join(TitleCast, TitleCast.title_id == TitleGenre.title_id)
        .filter(TitleCast.cast_id == person_id)
        .group_by(Genre.name)
        .order_by(func.count(TitleGenre.title_id).desc())
        .all()
    )
    return [{"genre": r[0], "count": r[1]} for r in rows]


@router.get("/search")
def search_cast(q: str = Query(..., min_length=1), db: Session = Depends(get_db)):
    rows = (
        db.query(CastMember.id, CastMember.name, CastMember.role)
        .filter(CastMember.name.ilike(f"%{q}%"))
        .limit(20)
        .all()
    )
    return [{"id": r[0], "name": r[1], "role": r[2]} for r in rows]

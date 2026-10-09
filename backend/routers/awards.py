from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from database import get_db
from models import Award, Genre, Title, TitleGenre

router = APIRouter(prefix="/awards", tags=["awards"])


@router.get("/by-platform")
def by_platform(db: Session = Depends(get_db)):
    platform_data: dict = {}
    all_rows = (
        db.query(Title.platform, Award.is_winner)
        .join(Award, Award.title_id == Title.id)
        .all()
    )
    for platform, is_winner in all_rows:
        if platform not in platform_data:
            platform_data[platform] = {"platform": platform, "wins": 0, "nominations": 0}
        platform_data[platform]["nominations"] += 1
        if is_winner:
            platform_data[platform]["wins"] += 1
    return list(platform_data.values())


@router.get("/by-genre")
def by_genre(db: Session = Depends(get_db)):
    all_rows = (
        db.query(Genre.name, Award.is_winner)
        .join(TitleGenre, TitleGenre.genre_id == Genre.id)
        .join(Award, Award.title_id == TitleGenre.title_id)
        .all()
    )
    genre_data: dict = {}
    for genre, is_winner in all_rows:
        if genre not in genre_data:
            genre_data[genre] = {"genre": genre, "wins": 0, "nominations": 0}
        genre_data[genre]["nominations"] += 1
        if is_winner:
            genre_data[genre]["wins"] += 1
    return sorted(genre_data.values(), key=lambda x: x["wins"], reverse=True)


@router.get("/by-ceremony")
def by_ceremony(db: Session = Depends(get_db)):
    all_rows = (
        db.query(Award.ceremony, Award.is_winner)
        .all()
    )
    ceremony_data: dict = {}
    for ceremony, is_winner in all_rows:
        if ceremony not in ceremony_data:
            ceremony_data[ceremony] = {"ceremony": ceremony, "wins": 0, "nominations": 0}
        ceremony_data[ceremony]["nominations"] += 1
        if is_winner:
            ceremony_data[ceremony]["wins"] += 1
    return sorted(ceremony_data.values(), key=lambda x: x["nominations"], reverse=True)


@router.get("/top-winners")
def top_winners(
    limit: int = Query(20, ge=1, le=200),
    db: Session = Depends(get_db),
):
    all_rows = (
        db.query(Title.title, Title.platform, Award.is_winner)
        .join(Award, Award.title_id == Title.id)
        .all()
    )
    title_data: dict = {}
    for title, platform, is_winner in all_rows:
        if title not in title_data:
            title_data[title] = {"title": title, "platform": platform, "wins": 0}
        if is_winner:
            title_data[title]["wins"] += 1
    results = sorted(title_data.values(), key=lambda x: x["wins"], reverse=True)
    return results[:limit]

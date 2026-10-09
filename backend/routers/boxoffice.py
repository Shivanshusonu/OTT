import calendar
from collections import defaultdict
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from models import BoxOffice, Title

router = APIRouter(prefix="/boxoffice", tags=["boxoffice"])


@router.get("/roi")
def roi(db: Session = Depends(get_db)):
    rows = (
        db.query(Title.title, BoxOffice.budget, BoxOffice.worldwide_gross, Title.platform)
        .join(BoxOffice, BoxOffice.title_id == Title.id)
        .filter(BoxOffice.budget > 0, BoxOffice.worldwide_gross > 0)
        .all()
    )
    return [
        {
            "title": r[0],
            "budget": r[1],
            "worldwide_gross": r[2],
            "roi_pct": round((r[2] - r[1]) / r[1] * 100, 2),
            "platform": r[3],
        }
        for r in rows
    ]


@router.get("/top-grossing")
def top_grossing(
    limit: int = Query(20, ge=1, le=200),
    year: Optional[str] = None,
    db: Session = Depends(get_db),
):
    q = (
        db.query(Title.id, Title.title, Title.release_year, Title.platform, BoxOffice.worldwide_gross)
        .join(BoxOffice, BoxOffice.title_id == Title.id)
        .filter(BoxOffice.worldwide_gross.isnot(None))
    )
    if year:
        q = q.filter(Title.release_year == int(year))
    rows = q.order_by(BoxOffice.worldwide_gross.desc()).limit(limit).all()
    return [
        {"id": r[0], "title": r[1], "release_year": r[2], "platform": r[3], "worldwide_gross": r[4]}
        for r in rows
    ]


@router.get("/seasonal")
def seasonal(db: Session = Depends(get_db)):
    rows = (
        db.query(BoxOffice.release_date, BoxOffice.worldwide_gross)
        .filter(BoxOffice.release_date.isnot(None), BoxOffice.worldwide_gross.isnot(None))
        .all()
    )
    # Build month-name → number lookup (handles "January 5, 2016" and "2016-01-05")
    month_name_to_num = {name.lower(): i for i, name in enumerate(calendar.month_name) if i}
    monthly: dict[int, int] = defaultdict(int)
    for release_date, gross in rows:
        if not release_date:
            continue
        date_str = str(release_date).strip()
        month = None
        # Try ISO format: "2016-01-05"
        parts = date_str.split("-")
        if len(parts) >= 2:
            try:
                month = int(parts[1])
            except ValueError:
                pass
        # Try "January 5, 2016" or "Jan 5, 2016"
        if month is None:
            first_word = date_str.split()[0].lower().rstrip(",") if date_str else ""
            month = month_name_to_num.get(first_word)
            if month is None:
                # try 3-letter abbreviation
                for full, num in month_name_to_num.items():
                    if full.startswith(first_word[:3]):
                        month = num
                        break
        if month and 1 <= month <= 12:
            monthly[month] += gross
    return [
        {"month": m, "month_name": calendar.month_name[m], "total_gross": monthly.get(m, 0)}
        for m in range(1, 13)
    ]


@router.get("/franchises")
def franchises(db: Session = Depends(get_db)):
    rows = (
        db.query(Title.title, BoxOffice.worldwide_gross)
        .join(BoxOffice, BoxOffice.title_id == Title.id)
        .filter(BoxOffice.worldwide_gross.isnot(None))
        .all()
    )
    # collect all words (min 3 chars) from every title
    word_titles: dict[str, list] = defaultdict(list)
    for title, gross in rows:
        words = set(w.lower() for w in title.split() if len(w) >= 3)
        for word in words:
            word_titles[word].append((title, gross))

    results = []
    for keyword, entries in word_titles.items():
        if len(entries) >= 2:
            total = sum(g for _, g in entries)
            results.append(
                {
                    "keyword": keyword,
                    "total_gross": total,
                    "title_count": len(entries),
                    "avg_gross": round(total / len(entries)),
                }
            )
    results.sort(key=lambda x: x["total_gross"], reverse=True)
    return results[:100]

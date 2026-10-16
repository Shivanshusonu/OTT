from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine, SessionLocal
import models  # noqa: F401 — registers all ORM classes with Base.metadata
from models import Rating, BoxOffice, Award, Title

from routers import catalog, ratings, boxoffice, platforms, genres, cast, runtime, awards

app = FastAPI(title="OTT Analytics API")

# Register all routers before adding middleware to avoid Starlette _IncludedRouter wrapping
app.include_router(catalog.router, prefix="/api")
app.include_router(ratings.router, prefix="/api")
app.include_router(boxoffice.router, prefix="/api")
app.include_router(platforms.router, prefix="/api")
app.include_router(genres.router, prefix="/api")
app.include_router(cast.router, prefix="/api")
app.include_router(runtime.router, prefix="/api")
app.include_router(awards.router, prefix="/api")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)
    # Auto-seed synthetic data if dependent tables are empty but titles exist
    db = SessionLocal()
    try:
        has_titles = db.query(Title.id).first() is not None
        needs_seed = (
            has_titles
            and db.query(Rating.id).first() is None
            and db.query(BoxOffice.id).first() is None
            and db.query(Award.id).first() is None
        )
        if needs_seed:
            import seed_missing
            seed_missing.seed(db)
            print("[startup] Auto-seeded ratings, box_office, awards.")
    finally:
        db.close()


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}

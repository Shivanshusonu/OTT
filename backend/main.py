from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine
import models  # noqa: F401 — registers all ORM classes with Base.metadata

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


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}

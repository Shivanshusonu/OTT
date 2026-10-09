import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Always resolve relative to this file's directory so the DB path is stable
# regardless of which directory uvicorn / scripts are launched from.
_DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ott_analytics.db")
DATABASE_URL = f"sqlite:///{_DB_PATH}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

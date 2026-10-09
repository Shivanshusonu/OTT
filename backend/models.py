from sqlalchemy import (
    BigInteger,
    Boolean,
    Column,
    Float,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
)

from database import Base


class Title(Base):
    __tablename__ = "titles"

    id = Column(Integer, primary_key=True, index=True)
    show_id = Column(String, unique=True, nullable=False)
    title = Column(String, nullable=False)
    type = Column(String, nullable=False)          # "Movie" | "TV Show"
    release_year = Column(Integer, nullable=True)
    duration_str = Column(String, nullable=True)   # raw value from CSV
    duration_minutes = Column(Integer, nullable=True)
    episode_count = Column(Integer, nullable=True)
    description = Column(String, nullable=True)
    platform = Column(String, nullable=False)
    language = Column(String, nullable=True)
    is_original = Column(Boolean, default=False, nullable=False)


class Genre(Base):
    __tablename__ = "genres"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)


class TitleGenre(Base):
    __tablename__ = "title_genres"

    title_id = Column(Integer, ForeignKey("titles.id"), primary_key=True)
    genre_id = Column(Integer, ForeignKey("genres.id"), primary_key=True)


class Country(Base):
    __tablename__ = "countries"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)


class TitleCountry(Base):
    __tablename__ = "title_countries"

    title_id = Column(Integer, ForeignKey("titles.id"), primary_key=True)
    country_id = Column(Integer, ForeignKey("countries.id"), primary_key=True)


class Rating(Base):
    __tablename__ = "ratings"

    id = Column(Integer, primary_key=True, index=True)
    title_id = Column(Integer, ForeignKey("titles.id"), unique=True, nullable=False)
    imdb_score = Column(Float, nullable=True)
    imdb_votes = Column(Integer, nullable=True)
    rt_score = Column(Integer, nullable=True)
    meta_score = Column(Integer, nullable=True)
    audience_score = Column(Integer, nullable=True)


class BoxOffice(Base):
    __tablename__ = "box_office"

    id = Column(Integer, primary_key=True, index=True)
    title_id = Column(Integer, ForeignKey("titles.id"), unique=True, nullable=False)
    budget = Column(BigInteger, nullable=True)
    worldwide_gross = Column(BigInteger, nullable=True)
    domestic_gross = Column(BigInteger, nullable=True)
    opening_weekend = Column(BigInteger, nullable=True)
    release_date = Column(String, nullable=True)


class CastMember(Base):
    __tablename__ = "cast_members"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    role = Column(String, nullable=False)          # "actor" | "director"

    __table_args__ = (UniqueConstraint("name", "role", name="uq_cast_name_role"),)


class TitleCast(Base):
    __tablename__ = "title_cast"

    title_id = Column(Integer, ForeignKey("titles.id"), primary_key=True)
    cast_id = Column(Integer, ForeignKey("cast_members.id"), primary_key=True)


class Award(Base):
    __tablename__ = "awards"

    id = Column(Integer, primary_key=True, index=True)
    title_id = Column(Integer, ForeignKey("titles.id"), nullable=False)
    ceremony = Column(String, nullable=False)
    category = Column(String, nullable=False)
    is_winner = Column(Boolean, nullable=False)
    year = Column(Integer, nullable=True)

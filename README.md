# OTT & Movie Content Analytics Dashboard

Full-stack analytics dashboard that ingests Kaggle CSV datasets into a local SQLite database and serves aggregated analytics via a **FastAPI** backend with a **React + TypeScript** frontend. Runs entirely on localhost — no cloud, no API keys, no AI/ML.

---

## Prerequisites

| Tool | Minimum Version |
|------|----------------|
| Python | 3.11+ |
| Node.js | 18+ |
| npm | 9+ |

---

## Project Structure

```
OTT/
├── data/                        ← Place Kaggle CSV files here before ingesting
│   ├── netflix_titles.csv
│   ├── imdb_titles.csv
│   ├── imdb_ratings.csv
│   ├── box_office.csv
│   └── awards.csv               (optional)
├── backend/
│   ├── main.py                  ← FastAPI app entry point
│   ├── database.py              ← SQLAlchemy engine + session factory
│   ├── models.py                ← ORM table definitions (10 tables)
│   ├── ingest.py                ← One-time CSV → SQLite loader
│   ├── routers/                 ← One router per analytics module
│   │   ├── catalog.py
│   │   ├── ratings.py
│   │   ├── boxoffice.py
│   │   ├── platforms.py
│   │   ├── genres.py
│   │   ├── cast.py
│   │   ├── runtime.py
│   │   └── awards.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/                 ← Typed Axios wrappers (one file per module)
│   │   ├── components/
│   │   │   ├── charts/          ← BarChart, LineChart, PieChart, ScatterChart, DoughnutChart
│   │   │   ├── common/          ← LoadingSpinner, ErrorMessage
│   │   │   └── layout/          ← Sidebar, PageShell
│   │   └── pages/               ← One page per module
│   ├── vite.config.ts           ← Proxies /api → http://localhost:8000
│   └── package.json
└── README.md
```

---

## Data Sources (Kaggle)

Download the following datasets and place them in the `data/` directory with the **exact filenames** shown:

| File | Dataset |
|------|---------|
| `netflix_titles.csv` | [Netflix Movies and TV Shows](https://www.kaggle.com/datasets/shivamb/netflix-shows) |
| `imdb_titles.csv` | [IMDb title.basics.tsv](https://datasets.imdbws.com/title.basics.tsv.gz) (rename after download) |
| `imdb_ratings.csv` | [IMDb title.ratings.tsv](https://datasets.imdbws.com/title.ratings.tsv.gz) (rename after download) |
| `box_office.csv` | [TMDB 5000 Movie Dataset](https://www.kaggle.com/datasets/tmdb/tmdb-movie-metadata) — use `tmdb_5000_movies.csv` renamed to `box_office.csv` |
| `awards.csv` | *(optional)* Any awards CSV with columns: `title, ceremony, category, is_winner, year` |

> The ingestion script handles missing files gracefully — it skips any CSV that is not present and prints `[SKIP]`.

---

## Setup

### 1. Backend

```bash
# From the repo root
cd backend

# Create and activate a virtual environment
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt
```

### 2. Frontend

```bash
# From the repo root
cd frontend
npm install
```

---

## Running

### Start the backend (port 8000)

```bash
cd backend
# Activate the venv first (see Setup above)
uvicorn main:app --reload
```

Verify it is running: open `http://localhost:8000/health` — should return `{"status":"ok"}`.

Browse all 32 API endpoints: `http://localhost:8000/docs`

### Start the frontend (port 5173)

Open a **second terminal**:

```bash
cd frontend
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Data Ingestion

After placing the CSV files in `data/`, run the ingestion script **once**:

```bash
cd backend
# Activate the venv first
python ingest.py
```

The script:
- **Truncates** all tables before inserting (idempotent — safe to re-run)
- Parses genres, countries, and cast from comma/pipe-separated columns
- Extracts `duration_minutes` for movies and `episode_count` for TV shows
- Joins IMDb ratings to titles by name match
- Prints a row-count table for all 10 database tables at the end

---

## Dashboard Modules

| Module | URL | Key Charts |
|--------|-----|------------|
| 🎬 Catalog Explorer | `/` | Filterable table, detail drawer, shareable URL filters |
| ⭐ Ratings Analytics | `/ratings` | Score histogram, critic vs audience scatter, top-rated table |
| 💰 Box Office & Revenue | `/boxoffice` | ROI scatter, seasonal line, top-grossing, franchise comparison |
| 📺 Platform Comparison | `/platforms` | Summary cards, genre stacked bar, release cadence, originals vs licensed |
| 🎭 Genre & Trends | `/genres` | Popularity over time, top genres, language growth, regional growth |
| 👥 Cast & Crew | `/cast` | Prolific bar, person search, career trajectory, genre specialization |
| ⏱ Runtime & Format | `/runtime` | Avg runtime by year, movies vs shows, runtime histogram, episode count |
| 🏆 Awards | `/awards` | Wins vs nominations by platform/genre/ceremony, top winners table |

---

## API Reference

| Module | Endpoints |
|--------|-----------|
| Health | `GET /health` |
| Catalog | `GET /api/catalog` · `/api/catalog/filters` · `/api/catalog/{id}` |
| Ratings | `GET /api/ratings/distribution` · `/critic-vs-audience` · `/top-rated` · `/by-genre` |
| Box Office | `GET /api/boxoffice/roi` · `/top-grossing` · `/seasonal` · `/franchises` |
| Platforms | `GET /api/platforms/summary` · `/genre-distribution` · `/release-cadence` · `/originals-vs-licensed` |
| Genres | `GET /api/genres/popularity-over-time` · `/top-genres` · `/language-growth` · `/regional` |
| Cast | `GET /api/cast/prolific` · `/career-trajectory/{id}` · `/genre-specialization/{id}` · `/search` |
| Runtime | `GET /api/runtime/avg-by-year` · `/format-trends` · `/series-length` · `/runtime-distribution` |
| Awards | `GET /api/awards/by-platform` · `/by-genre` · `/by-ceremony` · `/top-winners` |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.11, FastAPI, SQLAlchemy, SQLite, Pandas |
| Frontend | React 18, TypeScript, Vite |
| Charts | Chart.js 4 via react-chartjs-2 |
| Tables | TanStack Table v8 |
| HTTP client | Axios |
| Routing | React Router v6 |

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `uvicorn: command not found` | Activate the virtual environment first: `.venv\Scripts\activate` (Windows) |
| Port 8000 already in use | `uvicorn main:app --reload --port 8001` and update `vite.config.ts` target accordingly |
| Port 5173 already in use | `npm run dev -- --port 5174` |
| `ModuleNotFoundError: fastapi` | Run `pip install -r requirements.txt` inside the activated venv |
| Charts show "Loading…" forever | Check the browser console — the backend may not be running or the proxy is misconfigured |
| All tables show 0 rows | Place CSV files in `data/` and re-run `python ingest.py` |
| IMDb scores all null | Ensure `imdb_titles.csv` and `imdb_ratings.csv` are present and title names match |
| `ott_analytics.db` not found | Start uvicorn once — it creates the DB automatically on startup via `create_all()` |

---

## Seed Synthetic Data

If you don't have all the optional Kaggle CSVs (IMDb ratings, box office, awards), run the seed script after ingestion to generate realistic synthetic data for those tables so every dashboard page has something to display:

```bash
cd backend
# Activate the venv first
python seed_missing.py
```

The script:
- Generates **IMDb-style ratings** for all titles that have no rating row
- Generates **box office figures** for all movies that have no revenue row
- Generates **award records** (wins + nominations) for a random subset of titles
- Prints a final row-count table — restart uvicorn after running

> Safe to re-run at any time. It clears and re-seeds only the three dependent tables, never touching `titles`, `genres`, `cast_members`, or `countries`.

---

## Notes

- The SQLite database file is created at `backend/ott_analytics.db` on first backend startup.
- The Vite dev server proxies all `/api/*` requests to `http://localhost:8000`, eliminating CORS issues.
- The ingestion script can be re-run any number of times — it always truncates before inserting.
- No authentication, no cloud services, no AI/ML features — the entire app runs on localhost.
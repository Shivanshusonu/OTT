# OTT & Movie Content Analytics Dashboard — MVP Plan

## Top-Level Overview

Build a full-stack web application that ingests pre-downloaded Kaggle CSV datasets
(Netflix titles, IMDb ratings, box office data) into a local SQLite database and
exposes aggregated analytics via a Python FastAPI backend. A React + TypeScript
frontend renders interactive dashboards using Chart.js (react-chartjs-2).

The application runs entirely on localhost — no cloud services, no API keys, no AI/ML.

**Stack**
- Backend: Python 3.11+, FastAPI, SQLAlchemy (ORM), SQLite, Pandas (CSV ingestion only)
- Frontend: React 18, TypeScript, Vite, react-chartjs-2, TanStack Table, React Router
- Data: Kaggle CSV files pre-placed in a `/data` folder before running the ingest script

**Ports**
- Backend: `http://localhost:8000`
- Frontend: `http://localhost:5173`

---

## Project Structure

```
OTT/
├── data/                        # Raw Kaggle CSV files (not committed to git)
│   ├── netflix_titles.csv
│   ├── imdb_titles.csv
│   ├── imdb_ratings.csv
│   └── box_office.csv
├── backend/
│   ├── main.py                  # FastAPI app entry point
│   ├── database.py              # SQLAlchemy engine + session
│   ├── models.py                # ORM table definitions
│   ├── ingest.py                # CSV → SQLite loader script
│   ├── routers/
│   │   ├── catalog.py           # Content catalog endpoints
│   │   ├── ratings.py           # Ratings analytics endpoints
│   │   ├── boxoffice.py         # Box office endpoints
│   │   ├── platforms.py         # Platform comparison endpoints
│   │   ├── genres.py            # Genre trends endpoints
│   │   ├── cast.py              # Cast & crew analytics endpoints
│   │   ├── runtime.py           # Runtime & format trends endpoints
│   │   └── awards.py            # Awards analytics endpoints
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx              # Router shell
│   │   ├── api/                 # Typed fetch wrappers per module
│   │   ├── components/
│   │   │   ├── layout/          # Sidebar, Header, PageShell
│   │   │   └── charts/          # Reusable Chart.js wrappers
│   │   └── pages/
│   │       ├── CatalogPage.tsx
│   │       ├── RatingsPage.tsx
│   │       ├── BoxOfficePage.tsx
│   │       ├── PlatformsPage.tsx
│   │       ├── GenresPage.tsx
│   │       ├── CastPage.tsx
│   │       ├── RuntimePage.tsx
│   │       └── AwardsPage.tsx
│   ├── package.json
│   └── vite.config.ts           # Proxy /api → localhost:8000
└── README.md
```

---

## Sub-Tasks

---

### Sub-Task 1 — Project Scaffolding & Dev Environment

**Status:** [x] done

**Intent**
Establish the repository layout, install all dependencies, and verify both servers
start cleanly before any feature code is written.

**Expected Outcomes**
- `backend/` folder with virtualenv, FastAPI returning `{"status":"ok"}` at `GET /health`
- `frontend/` folder with Vite + React + TypeScript, default page loads at `localhost:5173`
- Vite proxy configured so `fetch("/api/...")` routes to `localhost:8000`
- `README.md` with exact commands to install, ingest, and run both servers

**Todo List**
1. Create `backend/` directory; initialise Python virtual environment (`venv`)
2. Create `backend/requirements.txt` with: `fastapi`, `uvicorn[standard]`, `sqlalchemy`, `pandas`, `python-multipart`
3. Create `backend/main.py` with a minimal FastAPI app and `GET /health` route
4. Create `frontend/` using `npm create vite@latest` with React + TypeScript template
5. Install frontend deps: `react-router-dom`, `react-chartjs-2`, `chart.js`, `@tanstack/react-table`, `axios`
6. Add Vite proxy in `vite.config.ts`: prefix `/api` → `http://localhost:8000`
7. Write `README.md` with setup instructions
8. Verify both servers start without errors

**Relevant Context**
- No existing codebase — pure greenfield
- Vite proxy eliminates CORS issues during local development

---

### Sub-Task 2 — Data Model & SQLite Schema

**Status:** [x] done

**Intent**
Define the relational schema that all CSV data will be normalised into. This schema
drives every API endpoint and chart query.

**Expected Outcomes**
- `backend/database.py` with SQLAlchemy engine pointing to `ott_analytics.db`
- `backend/models.py` with all ORM table classes
- Database file created on first run via `Base.metadata.create_all()`

**Todo List**
1. Create `backend/database.py` — SQLAlchemy engine (`sqlite:///./ott_analytics.db`), `SessionLocal`, `Base`
2. Define the following tables in `backend/models.py`:
   - `Title` — id, title, type (Movie/TV Show), release_year, duration, description, platform
   - `Genre` — id, name; `TitleGenre` — title_id, genre_id (many-to-many)
   - `Country` — id, name; `TitleCountry` — title_id, country_id
   - `Rating` — id, title_id, imdb_score, imdb_votes, rt_score, meta_score, audience_score
   - `BoxOffice` — id, title_id, budget, worldwide_gross, domestic_gross, opening_weekend, release_date
   - `CastMember` — id, name, role (actor/director); `TitleCast` — title_id, cast_id, character_name
   - `Award` — id, title_id, ceremony, category, is_winner, year
3. Run `Base.metadata.create_all()` inside `main.py` startup

**Relevant Context**
- SQLite has no migration tooling needed for MVP — drop and recreate on schema changes
- Keep foreign keys simple; avoid complex join tables beyond what is listed

---

### Sub-Task 3 — CSV Data Ingestion Script

**Status:** [x] done

**Intent**
Load the Kaggle CSV files from `data/` into the SQLite schema defined in Sub-Task 2.
This is a one-time CLI script, not an API endpoint.

**Expected Outcomes**
- Running `python backend/ingest.py` populates all tables from CSVs in `data/`
- Script is idempotent — re-running clears and reloads data without duplicates
- Console output shows row counts per table after ingestion

**Todo List**
1. Create `backend/ingest.py` — import Pandas, SQLAlchemy session, and all models
2. Map `netflix_titles.csv` columns → `Title`, `Genre`, `Country`, `TitleGenre`, `TitleCountry`
3. Map `imdb_titles.csv` + `imdb_ratings.csv` → `Rating` table (join on `tconst`/title)
4. Map `box_office.csv` → `BoxOffice` table
5. Parse cast/crew columns (pipe-separated strings in Netflix CSV) → `CastMember`, `TitleCast`
6. Add truncate-before-insert logic so re-runs are clean
7. Print row counts for each table at completion

**Relevant Context**
- Netflix CSV columns: `show_id, type, title, director, cast, country, date_added, release_year, rating, duration, listed_in, description`
- IMDb CSVs: `tconst, primaryTitle, startYear, genres` and `tconst, averageRating, numVotes`
- Box office CSV columns vary — parse defensively with `.get()` / `fillna`
- Pandas `str.split(",")` and `explode()` handle multi-value genre/country/cast columns

---

### Sub-Task 4 — Backend API: Content Catalog Module

**Status:** [x] done

**Intent**
Provide filterable, paginated access to the full content catalog — the foundation
every other module builds on.

**Expected Outcomes**
- `GET /api/catalog` returns paginated titles with filters: `platform`, `type`, `genre`, `year`, `language`
- `GET /api/catalog/{id}` returns full detail for a single title
- `GET /api/catalog/filters` returns all distinct filter options (for populating dropdowns)

**Todo List**
1. Create `backend/routers/catalog.py`
2. Implement `GET /api/catalog` with query params: `platform`, `type`, `genre`, `release_year`, `page`, `page_size` (default 20)
3. Implement `GET /api/catalog/{id}` returning title + genres + countries + ratings + cast
4. Implement `GET /api/catalog/filters` returning distinct values for all filterable fields
5. Register router in `main.py` with prefix `/api`

**Relevant Context**
- Use SQLAlchemy ORM queries with `.filter()` chaining for each active query param
- Paginate with `.offset(page * page_size).limit(page_size)`

---

### Sub-Task 5 — Backend API: Ratings Analytics Module

**Status:** [x] done

**Intent**
Expose aggregated rating metrics to power score distribution charts and
critic-vs-audience comparisons.

**Expected Outcomes**
- `GET /api/ratings/distribution` — histogram buckets of IMDb scores (0–10)
- `GET /api/ratings/critic-vs-audience` — scatter data: critic score vs audience score per title
- `GET /api/ratings/top-rated` — top N titles by IMDb score, filterable by genre/platform/year
- `GET /api/ratings/by-genre` — average IMDb score per genre

**Todo List**
1. Create `backend/routers/ratings.py`
2. Implement distribution endpoint: group scores into 0.5-wide buckets, return `{bucket, count}`
3. Implement critic-vs-audience endpoint: return `{title, rt_score, audience_score, platform}`
4. Implement top-rated endpoint with `limit`, `genre`, `platform`, `year` query params
5. Implement by-genre endpoint: `AVG(imdb_score) GROUP BY genre`
6. Register router in `main.py`

---

### Sub-Task 6 — Backend API: Box Office & Revenue Module

**Status:** [x] done

**Intent**
Expose budget, gross, and ROI data to power revenue analytics charts.

**Expected Outcomes**
- `GET /api/boxoffice/roi` — scatter: budget vs worldwide_gross per title
- `GET /api/boxoffice/top-grossing` — top N movies by worldwide gross
- `GET /api/boxoffice/seasonal` — total gross grouped by release month
- `GET /api/boxoffice/franchises` — aggregate gross per franchise/series (grouped by title keyword)

**Todo List**
1. Create `backend/routers/boxoffice.py`
2. Implement ROI scatter: return `{title, budget, worldwide_gross, roi_pct}` where `roi_pct = ((gross - budget) / budget) * 100`
3. Implement top-grossing with `limit` and `year` filters
4. Implement seasonal endpoint: extract month from `release_date`, aggregate gross per month
5. Implement franchise grouping by common title prefix (handled with SQL `LIKE` or Python grouping)
6. Register router in `main.py`

---

### Sub-Task 7 — Backend API: Platform Comparison Module

**Status:** [x] done

**Intent**
Aggregate content-level statistics per platform for side-by-side comparison.

**Expected Outcomes**
- `GET /api/platforms/summary` — per-platform: total titles, movies vs shows, avg rating
- `GET /api/platforms/genre-distribution` — genre breakdown per platform
- `GET /api/platforms/release-cadence` — titles added per year per platform
- `GET /api/platforms/originals-vs-licensed` — originals vs licensed count per platform (based on a flag or keyword in title data)

**Todo List**
1. Create `backend/routers/platforms.py`
2. Implement summary endpoint: `GROUP BY platform` with counts and avg IMDb score join
3. Implement genre distribution: join `TitleGenre` and group by `platform, genre`
4. Implement release cadence: group by `platform, release_year`
5. Add `is_original` boolean flag to `Title` model (set during ingestion based on Netflix/Prime original keywords)
6. Implement originals-vs-licensed using the `is_original` flag
7. Register router in `main.py`

---

### Sub-Task 8 — Backend API: Genre & Trend Analytics Module

**Status:** [x] done

**Intent**
Show how genre popularity has evolved over time and surface regional content growth.

**Expected Outcomes**
- `GET /api/genres/popularity-over-time` — title count per genre per decade
- `GET /api/genres/top-genres` — ranked genre list by total title count
- `GET /api/genres/language-growth` — content count per original language per year
- `GET /api/genres/regional` — content count grouped by country of origin per year

**Todo List**
1. Create `backend/routers/genres.py`
2. Implement popularity-over-time: `GROUP BY genre, (release_year / 10 * 10)` for decade bucketing
3. Implement top-genres: `COUNT(*) GROUP BY genre ORDER BY count DESC`
4. Implement language-growth: group by language (derive from country as proxy) and year
5. Implement regional endpoint: join `TitleCountry`, group by country and year
6. Register router in `main.py`

---

### Sub-Task 9 — Backend API: Cast & Crew Analytics Module

**Status:** [x] done

**Intent**
Expose person-level productivity and quality metrics.

**Expected Outcomes**
- `GET /api/cast/prolific` — most prolific directors/actors by title count
- `GET /api/cast/career-trajectory/{person_id}` — avg rating per year for a given person
- `GET /api/cast/genre-specialization/{person_id}` — genre distribution for a given person
- `GET /api/cast/search` — search cast members by name

**Todo List**
1. Create `backend/routers/cast.py`
2. Implement prolific endpoint: join `TitleCast`, group by `cast_member_id`, count titles, filter by `role`
3. Implement career-trajectory: join ratings + titles for a person, group by `release_year`
4. Implement genre-specialization: join genres through titles for a person
5. Implement search: `WHERE name LIKE :query` with limit
6. Register router in `main.py`

---

### Sub-Task 10 — Backend API: Runtime & Format Trends Module

**Status:** [x] done

**Intent**
Track how content length and format have changed over time.

**Expected Outcomes**
- `GET /api/runtime/avg-by-year` — average movie runtime per year
- `GET /api/runtime/format-trends` — count of movies vs TV shows per year
- `GET /api/runtime/series-length` — average episode count per show by genre
- `GET /api/runtime/runtime-distribution` — histogram of movie runtimes in 10-min buckets

**Todo List**
1. Create `backend/routers/runtime.py`
2. Parse `duration` field from `Title` into numeric minutes (movies) or episode count (TV shows) during ingestion
3. Implement avg-by-year for movies only
4. Implement format-trends: `COUNT(*) GROUP BY type, release_year`
5. Implement series-length: avg episode count for TV Shows grouped by genre
6. Implement runtime-distribution: bucket minutes into 10-min ranges
7. Register router in `main.py`

---

### Sub-Task 11 — Backend API: Awards Analytics Module

**Status:** [x] done

**Intent**
Expose awards data to show platform and genre performance at major ceremonies.

**Expected Outcomes**
- `GET /api/awards/by-platform` — win/nomination counts grouped by platform
- `GET /api/awards/by-genre` — win/nomination counts grouped by genre
- `GET /api/awards/by-ceremony` — summary per ceremony (Oscars, Emmys, BAFTAs)
- `GET /api/awards/top-winners` — titles with the most wins

**Todo List**
1. Create `backend/routers/awards.py`
2. Implement by-platform: join `Title` on platform, group by platform, `is_winner`
3. Implement by-genre: join through `TitleGenre`, group by genre, `is_winner`
4. Implement by-ceremony: group by `ceremony`, count wins vs nominations
5. Implement top-winners: `WHERE is_winner = true GROUP BY title_id ORDER BY count DESC`
6. Register router in `main.py`

---

### Sub-Task 12 — Frontend: App Shell, Routing & Layout

**Status:** [x] done

**Intent**
Build the application chrome — sidebar navigation, header, and page routing — so all
dashboard pages have a consistent home.

**Expected Outcomes**
- Sidebar with links to all 8 dashboard pages
- React Router routes wired to each page component (stub content is fine)
- Dark cinematic theme applied globally via CSS variables
- Responsive layout: sidebar collapses on narrow screens

**Todo List**
1. Create `src/components/layout/Sidebar.tsx` with nav links for all 8 modules
2. Create `src/components/layout/Header.tsx` with app title and active page name
3. Create `src/components/layout/PageShell.tsx` wrapping `{children}` in consistent padding
4. Configure `react-router-dom` in `App.tsx` with routes for all 8 pages
5. Create stub page components in `src/pages/` (one per module)
6. Add global CSS with dark theme: `--bg: #0f1117`, `--surface: #1a1d27`, `--accent: #e50914`
7. Verify navigation between all pages works

**Relevant Context**
- Use `NavLink` from react-router-dom for active-state styling on sidebar links
- Dark theme palette: deep navy background, card surfaces, red accent (cinematic feel)

---

### Sub-Task 13 — Frontend: Reusable Chart Components

**Status:** [x] done

**Intent**
Build generic Chart.js wrapper components used across all dashboard pages.

**Expected Outcomes**
- `BarChart`, `LineChart`, `PieChart`, `ScatterChart`, `DoughnutChart` components in `src/components/charts/`
- Each accepts typed `data` and `options` props
- Each shows a loading skeleton and an error state

**Todo List**
1. Create `src/components/charts/BarChart.tsx` wrapping `react-chartjs-2` Bar
2. Create `src/components/charts/LineChart.tsx` wrapping Line
3. Create `src/components/charts/PieChart.tsx` wrapping Pie
4. Create `src/components/charts/ScatterChart.tsx` wrapping Scatter
5. Create `src/components/charts/DoughnutChart.tsx` wrapping Doughnut
6. Register all required Chart.js components globally in `main.tsx` (`ChartJS.register(...)`)
7. Add `LoadingSpinner` and `ErrorMessage` shared components

**Relevant Context**
- Chart.js requires explicit registration of controllers, scales, and plugins before use
- Use Chart.js dark theme defaults: white labels, transparent backgrounds, grid lines in `rgba(255,255,255,0.1)`

---

### Sub-Task 14 — Frontend: Catalog Page

**Status:** [x] done

**Intent**
Build the content catalog explorer with filters and a data table.

**Expected Outcomes**
- Filter bar: Platform, Type, Genre, Year dropdowns — populated from `GET /api/catalog/filters`
- TanStack Table displaying paginated results from `GET /api/catalog`
- Clicking a row opens a detail drawer with full title metadata
- URL query params update as filters change (shareable links)

**Todo List**
1. Create `src/api/catalog.ts` with typed fetch functions for all catalog endpoints
2. Build filter bar component with controlled dropdowns
3. Integrate TanStack Table with server-side pagination
4. Build title detail drawer/modal using `GET /api/catalog/{id}`
5. Sync filter state to URL search params using `useSearchParams`

---

### Sub-Task 15 — Frontend: Ratings Analytics Page

**Status:** [x] done

**Intent**
Visualise rating distributions and critic-vs-audience divergence.

**Expected Outcomes**
- IMDb score histogram (BarChart) from `/api/ratings/distribution`
- Critic vs audience scatter plot (ScatterChart) from `/api/ratings/critic-vs-audience`
- Top-rated titles table from `/api/ratings/top-rated`
- Average rating by genre bar chart from `/api/ratings/by-genre`

**Todo List**
1. Create `src/api/ratings.ts`
2. Build histogram chart wired to distribution endpoint
3. Build scatter chart with tooltip showing title name
4. Build top-rated table with genre/platform/year filters
5. Build by-genre bar chart

---

### Sub-Task 16 — Frontend: Box Office & Revenue Page

**Status:** [x] done

**Intent**
Visualise ROI, seasonal patterns, and franchise performance.

**Expected Outcomes**
- Budget vs gross scatter plot (ScatterChart) from `/api/boxoffice/roi`
- Top grossing movies bar chart from `/api/boxoffice/top-grossing`
- Monthly gross seasonality line chart from `/api/boxoffice/seasonal`
- Franchise comparison bar chart from `/api/boxoffice/franchises`

**Todo List**
1. Create `src/api/boxoffice.ts`
2. Build ROI scatter chart — colour code dots by profitable/loss
3. Build top-grossing horizontal bar chart
4. Build seasonality line chart (x-axis = month name)
5. Build franchise grouped bar chart

---

### Sub-Task 17 — Frontend: Platform Comparison Page

**Status:** [x] done

**Intent**
Side-by-side platform statistics with genre and cadence breakdowns.

**Expected Outcomes**
- Platform summary cards (total titles, avg rating, movies vs shows ratio)
- Genre distribution stacked bar chart per platform from `/api/platforms/genre-distribution`
- Release cadence grouped line chart from `/api/platforms/release-cadence`
- Originals vs licensed doughnut chart from `/api/platforms/originals-vs-licensed`

**Todo List**
1. Create `src/api/platforms.ts`
2. Build summary stat cards
3. Build stacked bar chart for genre distribution
4. Build multi-line chart for release cadence
5. Build doughnut chart for originals vs licensed

---

### Sub-Task 18 — Frontend: Genre & Trend Analytics Page

**Status:** [x] done

**Intent**
Show genre popularity evolution and regional content growth.

**Expected Outcomes**
- Genre popularity over time stacked area/line chart
- Top genres ranked bar chart
- Regional content growth multi-line chart
- Language growth line chart

**Todo List**
1. Create `src/api/genres.ts`
2. Build stacked line chart for genre popularity over time (decade buckets on x-axis)
3. Build horizontal bar chart for top genres
4. Build multi-line chart for regional content per year
5. Build language growth line chart

---

### Sub-Task 19 — Frontend: Cast & Crew Analytics Page

**Status:** [x] done

**Intent**
Explore director and actor productivity and quality metrics.

**Expected Outcomes**
- Prolific directors/actors bar chart with role toggle
- Person search input wired to `/api/cast/search`
- Career trajectory line chart for selected person
- Genre specialization doughnut chart for selected person

**Todo List**
1. Create `src/api/cast.ts`
2. Build prolific bar chart with Actor/Director radio toggle
3. Build search input with debounced fetch and result dropdown
4. On person select: render career trajectory line chart
5. On person select: render genre specialization doughnut chart

---

### Sub-Task 20 — Frontend: Runtime & Format Trends Page

**Status:** [x] done

**Intent**
Show how content format and length have evolved.

**Expected Outcomes**
- Average movie runtime per year line chart
- Movies vs TV shows per year grouped bar chart
- Runtime distribution histogram
- Average episode count per genre bar chart

**Todo List**
1. Create `src/api/runtime.ts`
2. Build avg runtime line chart
3. Build movies vs shows grouped bar chart
4. Build runtime histogram (10-min buckets on x-axis)
5. Build episode count by genre bar chart

---

### Sub-Task 21 — Frontend: Awards Analytics Page

**Status:** [x] done

**Intent**
Visualise awards performance across platforms, genres, and ceremonies.

**Expected Outcomes**
- Awards by platform grouped bar chart (wins vs nominations)
- Awards by genre bar chart
- Awards by ceremony bar chart
- Top award-winning titles table

**Todo List**
1. Create `src/api/awards.ts`
2. Build platform awards grouped bar chart (wins in one colour, nominations in another)
3. Build genre awards bar chart
4. Build ceremony breakdown bar chart
5. Build top-winners table

---

### Sub-Task 22 — README & Local Run Documentation

**Status:** [x] done

**Intent**
Ensure anyone can clone the repo and get the app running from scratch in under 5 minutes.

**Expected Outcomes**
- `README.md` with complete, copy-pasteable setup instructions
- Instructions cover: CSV placement, venv setup, ingestion, running both servers
- Environment prerequisites listed (Python 3.11+, Node 18+)

**Todo List**
1. Document CSV download links and expected filenames in `data/`
2. Document backend setup: `python -m venv venv`, `pip install -r requirements.txt`, `python ingest.py`, `uvicorn main:app --reload`
3. Document frontend setup: `npm install`, `npm run dev`
4. Add a Troubleshooting section for common issues (port conflicts, missing CSV columns)
5. Add a Data Sources section crediting Kaggle datasets

---

### Sub-Task 23 — Data Population & Bug Fixes (Post-MVP)

**Status:** [x] done

**Intent**
Ensure all 8 dashboard modules show real data. Fix data shape mismatches, seasonal
date parsing, missing response fields, and add a synthetic data seeder for modules
with no freely available CSV source.

**Expected Outcomes**
- All 14 key API endpoints return non-empty data verified by smoke test (14/14 passing)
- Ratings, Box Office, and Awards modules populated via `seed_missing.py`
- Seasonal chart shows non-zero gross for all 12 months
- Top-rated table includes `imdb_votes` column
- `catalog/filters` response keys match frontend interface (`platforms`, `types`, `genres`, `years`)
- All frontend API errors silently caught — no blank screens

**Todo List**
1. Write `backend/seed_missing.py` — seeds ratings, box_office, awards from existing titles ✓
2. Fix `boxoffice/seasonal` — parse `"Month D, YYYY"` date format (was returning all zeros) ✓
3. Fix `catalog/filters` — rename response keys to plural form matching frontend interface ✓
4. Fix `ratings/top-rated` — add missing `imdb_votes` field to response ✓
5. Add `.catch(() => {})` to all unhandled async calls in all 8 page components ✓
6. Add null-guards (`!labels?.length`) to all 5 chart components ✓
7. Add global `ErrorBoundary` wrapping `<App>` ✓
8. Run smoke test: 14/14 API endpoints returning correct data ✓

---



## Key Design Decisions

| Decision | Choice | Reason |
|---|---|---|
| Database | SQLite | Zero setup, single file, perfect for localhost MVP |
| ORM | SQLAlchemy | Standard Python ORM; works with SQLite and Postgres if needed later |
| CSV Ingestion | Pandas one-time script | Keeps ingestion logic separate from the API server |
| Frontend build tool | Vite | Fast HMR, built-in proxy for local API calls |
| Charts | react-chartjs-2 | Widely used, good TypeScript support, familiar |
| Tables | TanStack Table | Headless, composable, works well with server-side pagination |
| Routing | React Router v6 | Industry standard for React SPAs |
| No auth | Intentional | Localhost MVP — no login needed |

---

## Data Flow Summary

```
Kaggle CSVs (data/)
        |
        v
ingest.py (Pandas)
        |
        v
SQLite (ott_analytics.db)
        |
        v
FastAPI Routers (SQLAlchemy queries)
        |
        v
REST JSON at localhost:8000/api/...
        |
        v
React (Vite dev server localhost:5173)
        |
        v
Chart.js / TanStack Table / UI components
```

import axios from 'axios'

export interface ProlificItem { cast_id: number; name: string; role: string; title_count: number; avg_imdb_score: number | null }
export interface TrajectoryItem { release_year: number; avg_imdb_score: number | null; title_count: number }
export interface GenreSpecItem { genre: string; count: number }
export interface CastSearchItem { id: number; name: string; role: string }

export const fetchProlific = (params: { role?: string; limit?: number }) =>
  axios.get<ProlificItem[]>('/api/cast/prolific', { params }).then(r => r.data)

export const fetchCareerTrajectory = (personId: number) =>
  axios.get<TrajectoryItem[]>(`/api/cast/career-trajectory/${personId}`).then(r => r.data)

export const fetchGenreSpecialization = (personId: number) =>
  axios.get<GenreSpecItem[]>(`/api/cast/genre-specialization/${personId}`).then(r => r.data)

export const searchCast = (q: string) =>
  axios.get<CastSearchItem[]>('/api/cast/search', { params: { q } }).then(r => r.data)

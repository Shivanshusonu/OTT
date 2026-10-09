import axios from 'axios'

export interface PlatformSummary { platform: string; total_titles: number; movie_count: number; show_count: number; avg_imdb_score: number | null }
export interface GenreDistItem { platform: string; genre: string; count: number }
export interface CadenceItem { platform: string; release_year: number; count: number }
export interface OriginalItem { platform: string; is_original: boolean; count: number }

export const fetchPlatformSummary = () =>
  axios.get<PlatformSummary[]>('/api/platforms/summary').then(r => r.data)

export const fetchGenreDistribution = () =>
  axios.get<GenreDistItem[]>('/api/platforms/genre-distribution').then(r => r.data)

export const fetchReleaseCadence = () =>
  axios.get<CadenceItem[]>('/api/platforms/release-cadence').then(r => r.data)

export const fetchOriginalsVsLicensed = () =>
  axios.get<OriginalItem[]>('/api/platforms/originals-vs-licensed').then(r => r.data)

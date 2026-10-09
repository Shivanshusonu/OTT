import axios from 'axios'

export interface AvgByYearItem { release_year: number; avg_minutes: number }
export interface FormatTrendItem { release_year: number; type: string; count: number }
export interface SeriesLengthItem { genre: string; avg_episode_count: number }
export interface RuntimeDistItem { bucket: string; count: number }

export const fetchAvgByYear = () =>
  axios.get<AvgByYearItem[]>('/api/runtime/avg-by-year').then(r => r.data)

export const fetchFormatTrends = () =>
  axios.get<FormatTrendItem[]>('/api/runtime/format-trends').then(r => r.data)

export const fetchSeriesLength = () =>
  axios.get<SeriesLengthItem[]>('/api/runtime/series-length').then(r => r.data)

export const fetchRuntimeDistribution = () =>
  axios.get<RuntimeDistItem[]>('/api/runtime/runtime-distribution').then(r => r.data)

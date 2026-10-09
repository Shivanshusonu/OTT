import axios from 'axios'

export interface PopularityItem { decade: number; genre: string; count: number }
export interface TopGenre { genre: string; count: number }
export interface LanguageGrowthItem { language: string; release_year: number; count: number }
export interface RegionalItem { country: string; release_year: number; count: number }

export const fetchGenrePopularityOverTime = () =>
  axios.get<PopularityItem[]>('/api/genres/popularity-over-time').then(r => r.data)

export const fetchTopGenres = () =>
  axios.get<TopGenre[]>('/api/genres/top-genres').then(r => r.data)

export const fetchLanguageGrowth = () =>
  axios.get<LanguageGrowthItem[]>('/api/genres/language-growth').then(r => r.data)

export const fetchRegional = () =>
  axios.get<RegionalItem[]>('/api/genres/regional').then(r => r.data)

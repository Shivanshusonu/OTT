import axios from 'axios'

export interface RoiItem { title: string; budget: number; worldwide_gross: number; roi_pct: number; platform: string }
export interface TopGrossingItem { title: string; worldwide_gross: number; release_year: number; platform: string }
export interface SeasonalItem { month: number; month_name: string; total_gross: number }
export interface FranchiseItem { keyword: string; total_gross: number; title_count: number; avg_gross: number }

export const fetchRoi = () =>
  axios.get<RoiItem[]>('/api/boxoffice/roi').then(r => r.data)

export const fetchTopGrossing = (params: { limit?: number; year?: string }) =>
  axios.get<TopGrossingItem[]>('/api/boxoffice/top-grossing', { params }).then(r => r.data)

export const fetchSeasonal = () =>
  axios.get<SeasonalItem[]>('/api/boxoffice/seasonal').then(r => r.data)

export const fetchFranchises = () =>
  axios.get<FranchiseItem[]>('/api/boxoffice/franchises').then(r => r.data)

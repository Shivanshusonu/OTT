import axios from 'axios'

export interface DistributionBucket { bucket: string; count: number }
export interface CriticVsAudience { title: string; rt_score: number; audience_score: number; platform: string }
export interface TopRatedItem { id: number; title: string; platform: string; release_year: number; imdb_score: number; imdb_votes: number | null }
export interface ByGenre { genre: string; avg_imdb_score: number; count: number }

export const fetchRatingsDistribution = () =>
  axios.get<DistributionBucket[]>('/api/ratings/distribution').then(r => r.data)

export const fetchCriticVsAudience = () =>
  axios.get<CriticVsAudience[]>('/api/ratings/critic-vs-audience').then(r => r.data)

export const fetchTopRated = (params: { limit?: number; genre?: string; platform?: string; year?: number }) =>
  axios.get<TopRatedItem[]>('/api/ratings/top-rated', { params }).then(r => r.data)

export const fetchRatingsByGenre = () =>
  axios.get<ByGenre[]>('/api/ratings/by-genre').then(r => r.data)

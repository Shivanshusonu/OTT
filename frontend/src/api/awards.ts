import axios from 'axios'

export interface AwardsByPlatform { platform: string; wins: number; nominations: number }
export interface AwardsByGenre { genre: string; wins: number; nominations: number }
export interface AwardsByCeremony { ceremony: string; wins: number; nominations: number }
export interface TopWinner { title: string; platform: string; wins: number }

export const fetchAwardsByPlatform = () =>
  axios.get<AwardsByPlatform[]>('/api/awards/by-platform').then(r => r.data)

export const fetchAwardsByGenre = () =>
  axios.get<AwardsByGenre[]>('/api/awards/by-genre').then(r => r.data)

export const fetchAwardsByCeremony = () =>
  axios.get<AwardsByCeremony[]>('/api/awards/by-ceremony').then(r => r.data)

export const fetchTopWinners = (limit = 20) =>
  axios.get<TopWinner[]>('/api/awards/top-winners', { params: { limit } }).then(r => r.data)

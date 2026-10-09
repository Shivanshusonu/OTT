import axios from 'axios'

export interface CatalogItem {
  id: number
  show_id: string
  title: string
  type: string
  release_year: number
  platform: string
  duration_str: string
  is_original: boolean
}

export interface CatalogDetail extends CatalogItem {
  description: string
  language: string | null
  genres: string[]
  countries: string[]
  rating: {
    imdb_score: number | null
    imdb_votes: number | null
    rt_score: number | null
    audience_score: number | null
  } | null
  cast: { name: string; role: string }[]
}

export interface CatalogFilters {
  platforms: string[]
  types: string[]
  genres: string[]
  years: number[]
}

export interface CatalogResponse {
  total: number
  page: number
  page_size: number
  items: CatalogItem[]
}

export async function fetchCatalog(params: {
  platform?: string; type?: string; genre?: string
  release_year?: number; page?: number; page_size?: number
}): Promise<CatalogResponse> {
  const { data } = await axios.get('/api/catalog', { params })
  return data
}

export async function fetchCatalogFilters(): Promise<CatalogFilters> {
  const { data } = await axios.get('/api/catalog/filters')
  return data
}

export async function fetchCatalogDetail(id: number): Promise<CatalogDetail> {
  const { data } = await axios.get(`/api/catalog/${id}`)
  return data
}

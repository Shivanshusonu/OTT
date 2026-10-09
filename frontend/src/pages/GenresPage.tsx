import { useState, useEffect } from 'react'
import PageShell from '../components/layout/PageShell'
import { BarChart, LineChart, CHART_COLORS } from '../components/charts'
import {
  fetchGenrePopularityOverTime, fetchTopGenres, fetchLanguageGrowth, fetchRegional,
  type PopularityItem, type TopGenre, type LanguageGrowthItem, type RegionalItem,
} from '../api/genres'

export default function GenresPage() {
  const [popularity, setPopularity] = useState<PopularityItem[]>([])
  const [topGenres, setTopGenres] = useState<TopGenre[]>([])
  const [langGrowth, setLangGrowth] = useState<LanguageGrowthItem[]>([])
  const [regional, setRegional] = useState<RegionalItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetchGenrePopularityOverTime(), fetchTopGenres(), fetchLanguageGrowth(), fetchRegional()])
      .then(([p, t, l, r]) => { setPopularity(p); setTopGenres(t); setLangGrowth(l); setRegional(r) })
      .catch(() => {}).finally(() => setLoading(false))
  }, [])

  // Popularity over time — decades on x-axis, genres as datasets
  const decades = [...new Set(popularity.map(p => p.decade))].sort()
  const genres = [...new Set(popularity.map(p => p.genre))].slice(0, 8)
  const popularityDatasets = genres.map((genre, i) => ({
    label: genre,
    data: decades.map(d => popularity.find(p => p.decade === d && p.genre === genre)?.count ?? 0),
    borderColor: CHART_COLORS[i % CHART_COLORS.length],
    fill: false,
  }))

  // Language growth — top 6 languages
  const langs = [...new Set(langGrowth.map(l => l.language))].slice(0, 6)
  const langYears = [...new Set(langGrowth.map(l => l.release_year))].sort()
  const langDatasets = langs.map((lang, i) => ({
    label: lang,
    data: langYears.map(y => langGrowth.find(l => l.language === lang && l.release_year === y)?.count ?? 0),
    borderColor: CHART_COLORS[i % CHART_COLORS.length],
  }))

  // Regional — top 8 countries
  const countries = [...new Set(regional.map(r => r.country))].slice(0, 8)
  const regYears = [...new Set(regional.map(r => r.release_year))].sort()
  const regDatasets = countries.map((c, i) => ({
    label: c,
    data: regYears.map(y => regional.find(r => r.country === c && r.release_year === y)?.count ?? 0),
    borderColor: CHART_COLORS[i % CHART_COLORS.length],
  }))

  return (
    <PageShell title="Genre & Trend Analytics" subtitle="Genre popularity evolution, language and regional content growth">
      <div className="grid-2" style={{ marginBottom: 20 }}>
        {/* Genre Popularity Over Time */}
        <div className="chart-box">
          <h3>Genre Popularity Over Time (by Decade)</h3>
          <LineChart loading={loading} labels={decades.map(String)} datasets={popularityDatasets} />
        </div>

        {/* Top Genres */}
        <div className="chart-box">
          <h3>Top Genres by Title Count</h3>
          <BarChart
            loading={loading}
            horizontal
            labels={topGenres.slice(0, 15).map(g => g.genre)}
            datasets={[{ label: 'Titles', data: topGenres.slice(0, 15).map(g => g.count), backgroundColor: '#e50914' }]}
          />
        </div>
      </div>

      <div className="grid-2">
        {/* Language Growth */}
        <div className="chart-box">
          <h3>Content by Language Over Time</h3>
          <LineChart loading={loading} labels={langYears.map(String)} datasets={langDatasets} />
        </div>

        {/* Regional Growth */}
        <div className="chart-box">
          <h3>Regional Content Growth (Top Countries)</h3>
          <LineChart loading={loading} labels={regYears.map(String)} datasets={regDatasets} />
        </div>
      </div>
    </PageShell>
  )
}

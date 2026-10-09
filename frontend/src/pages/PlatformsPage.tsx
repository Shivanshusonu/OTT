import { useState, useEffect } from 'react'
import PageShell from '../components/layout/PageShell'
import { BarChart, LineChart, DoughnutChart, CHART_COLORS } from '../components/charts'
import {
  fetchPlatformSummary, fetchGenreDistribution, fetchReleaseCadence, fetchOriginalsVsLicensed,
  type PlatformSummary, type GenreDistItem, type CadenceItem, type OriginalItem,
} from '../api/platforms'

export default function PlatformsPage() {
  const [summary, setSummary] = useState<PlatformSummary[]>([])
  const [genreDist, setGenreDist] = useState<GenreDistItem[]>([])
  const [cadence, setCadence] = useState<CadenceItem[]>([])
  const [originals, setOriginals] = useState<OriginalItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetchPlatformSummary(), fetchGenreDistribution(), fetchReleaseCadence(), fetchOriginalsVsLicensed()])
      .then(([s, g, c, o]) => { setSummary(s); setGenreDist(g); setCadence(c); setOriginals(o) })
      .catch(() => {}).finally(() => setLoading(false))
  }, [])

  // Genre distribution: stacked bar — platforms on x, genres as datasets
  const platforms = [...new Set(genreDist.map(g => g.platform))]
  const genres = [...new Set(genreDist.map(g => g.genre))].slice(0, 8)
  const genreDatasets = genres.map((genre, i) => ({
    label: genre,
    data: platforms.map(p => genreDist.find(d => d.platform === p && d.genre === genre)?.count ?? 0),
    backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
  }))

  // Cadence: multi-line per platform
  const cadencePlatforms = [...new Set(cadence.map(c => c.platform))]
  const cadenceYears = [...new Set(cadence.map(c => c.release_year))].sort()
  const cadenceDatasets = cadencePlatforms.map((p, i) => ({
    label: p,
    data: cadenceYears.map(y => cadence.find(c => c.platform === p && c.release_year === y)?.count ?? 0),
    borderColor: CHART_COLORS[i % CHART_COLORS.length],
  }))

  // Originals vs Licensed doughnut
  const origLabels = originals.map(o => `${o.platform} — ${o.is_original ? 'Original' : 'Licensed'}`)
  const origData = originals.map(o => o.count)

  return (
    <PageShell title="Platform Comparison" subtitle="Content breakdown, genre mix, release cadence across platforms">
      {/* Summary Cards */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        {loading
          ? [1,2,3,4].map(i => <div key={i} className="stat-card"><div style={{ color: 'var(--muted)' }}>Loading…</div></div>)
          : summary.map(s => (
            <div key={s.platform} className="stat-card">
              <div className="stat-value">{s.total_titles.toLocaleString()}</div>
              <div className="stat-label">{s.platform}</div>
              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--muted)' }}>
                🎬 {s.movie_count} movies · 📺 {s.show_count} shows
              </div>
              {s.avg_imdb_score != null && (
                <div style={{ marginTop: 4, fontSize: 12, color: '#f59e0b' }}>
                  ⭐ {s.avg_imdb_score.toFixed(1)} avg IMDb
                </div>
              )}
            </div>
          ))
        }
      </div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        {/* Genre Distribution */}
        <div className="chart-box">
          <h3>Genre Distribution by Platform</h3>
          <BarChart loading={loading} labels={platforms} datasets={genreDatasets} stacked />
        </div>

        {/* Originals vs Licensed */}
        <div className="chart-box">
          <h3>Originals vs Licensed</h3>
          <DoughnutChart loading={loading} labels={origLabels} data={origData} />
        </div>
      </div>

      {/* Release Cadence */}
      <div className="chart-box">
        <h3>Release Cadence — Titles Added per Year</h3>
        <div style={{ height: 300 }}>
          <LineChart
            loading={loading}
            labels={cadenceYears.map(String)}
            datasets={cadenceDatasets}
          />
        </div>
      </div>
    </PageShell>
  )
}

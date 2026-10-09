import { useState, useEffect } from 'react'
import PageShell from '../components/layout/PageShell'
import { BarChart, ScatterChart } from '../components/charts'
import {
  fetchRatingsDistribution, fetchCriticVsAudience, fetchTopRated, fetchRatingsByGenre,
  type DistributionBucket, type CriticVsAudience, type TopRatedItem, type ByGenre,
} from '../api/ratings'

export default function RatingsPage() {
  const [dist, setDist] = useState<DistributionBucket[]>([])
  const [cva, setCva] = useState<CriticVsAudience[]>([])
  const [topRated, setTopRated] = useState<TopRatedItem[]>([])
  const [byGenre, setByGenre] = useState<ByGenre[]>([])
  const [loading, setLoading] = useState(true)
  const [genreFilter, setGenreFilter] = useState('')
  const [platformFilter, setPlatformFilter] = useState('')

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetchRatingsDistribution(),
      fetchCriticVsAudience(),
      fetchTopRated({ limit: 20 }),
      fetchRatingsByGenre(),
    ]).then(([d, c, t, g]) => {
      setDist(d); setCva(c); setTopRated(t); setByGenre(g)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const reloadTopRated = () =>
    fetchTopRated({ limit: 20, genre: genreFilter || undefined, platform: platformFilter || undefined })
      .then(setTopRated)

  return (
    <PageShell title="Ratings Analytics" subtitle="IMDb scores, critic vs audience, genre averages">
      <div className="grid-2" style={{ marginBottom: 20 }}>
        {/* Score Distribution */}
        <div className="chart-box">
          <h3>IMDb Score Distribution</h3>
          <BarChart
            loading={loading}
            labels={dist.map(d => d.bucket)}
            datasets={[{ label: 'Titles', data: dist.map(d => d.count), backgroundColor: '#3b82f6' }]}
          />
        </div>

        {/* Avg by Genre */}
        <div className="chart-box">
          <h3>Average IMDb Score by Genre</h3>
          <BarChart
            loading={loading}
            horizontal
            labels={byGenre.slice(0, 15).map(g => g.genre)}
            datasets={[{ label: 'Avg Score', data: byGenre.slice(0, 15).map(g => parseFloat(g.avg_imdb_score.toFixed(2))), backgroundColor: '#10b981' }]}
          />
        </div>
      </div>

      {/* Critic vs Audience Scatter */}
      <div className="chart-box" style={{ marginBottom: 20 }}>
        <h3>Critic Score vs Audience Score</h3>
        <div style={{ height: 320 }}>
          <ScatterChart
            loading={loading}
            xLabel="RT Critic Score (%)"
            yLabel="Audience Score (%)"
            datasets={[{
              label: 'Titles',
              data: cva.map(c => ({ x: c.rt_score, y: c.audience_score, label: c.title })),
              backgroundColor: '#e50914bb',
            }]}
          />
        </div>
      </div>

      {/* Top Rated Table */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, flex: 1 }}>Top Rated Titles</h3>
          <input
            type="text" placeholder="Filter genre…" value={genreFilter}
            onChange={e => setGenreFilter(e.target.value)} style={{ width: 140 }}
          />
          <input
            type="text" placeholder="Filter platform…" value={platformFilter}
            onChange={e => setPlatformFilter(e.target.value)} style={{ width: 140 }}
          />
          <button onClick={reloadTopRated}>Apply</button>
        </div>
        <table>
          <thead>
            <tr><th>#</th><th>Title</th><th>Platform</th><th>Year</th><th>IMDb Score</th><th>Votes</th></tr>
          </thead>
          <tbody>
            {topRated.map((t, i) => (
              <tr key={t.id}>
                <td style={{ color: 'var(--muted)' }}>{i + 1}</td>
                <td style={{ fontWeight: 500 }}>{t.title}</td>
                <td>{t.platform}</td>
                <td>{t.release_year}</td>
                <td><span style={{ color: '#f59e0b', fontWeight: 600 }}>{t.imdb_score}</span></td>
                <td style={{ color: 'var(--muted)' }}>{t.imdb_votes?.toLocaleString() ?? '—'}</td>
              </tr>
            ))}
            {topRated.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--muted)', padding: 24 }}>No data</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </PageShell>
  )
}

import { useState, useEffect } from 'react'
import PageShell from '../components/layout/PageShell'
import { LineChart, BarChart } from '../components/charts'
import {
  fetchAvgByYear, fetchFormatTrends, fetchSeriesLength, fetchRuntimeDistribution,
  type AvgByYearItem, type FormatTrendItem, type SeriesLengthItem, type RuntimeDistItem,
} from '../api/runtime'
import { CHART_COLORS } from '../components/charts'

export default function RuntimePage() {
  const [avgByYear, setAvgByYear]     = useState<AvgByYearItem[]>([])
  const [formats, setFormats]         = useState<FormatTrendItem[]>([])
  const [seriesLen, setSeriesLen]     = useState<SeriesLengthItem[]>([])
  const [runtimeDist, setRuntimeDist] = useState<RuntimeDistItem[]>([])
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    Promise.all([
      fetchAvgByYear(),
      fetchFormatTrends(),
      fetchSeriesLength(),
      fetchRuntimeDistribution(),
    ]).then(([a, f, s, r]) => {
      setAvgByYear(a)
      setFormats(f)
      setSeriesLen(s)
      setRuntimeDist(r)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  // Format trends: grouped bar — years on x-axis, Movie & TV Show as two datasets
  const formatYears  = [...new Set(formats.map(f => f.release_year))].sort()
  const formatTypes  = [...new Set(formats.map(f => f.type))]
  const formatDatasets = formatTypes.map((t, i) => ({
    label: t,
    data: formatYears.map(y => formats.find(f => f.release_year === y && f.type === t)?.count ?? 0),
    backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
  }))

  return (
    <PageShell title="Runtime & Format Trends" subtitle="How content length and format have evolved over time">

      <div className="grid-2" style={{ marginBottom: 20 }}>
        {/* Avg movie runtime per year */}
        <div className="chart-box">
          <h3>Average Movie Runtime by Year (minutes)</h3>
          <LineChart
            loading={loading}
            labels={avgByYear.map(a => String(a.release_year))}
            datasets={[{
              label: 'Avg Runtime (min)',
              data: avgByYear.map(a => Math.round(a.avg_minutes)),
              borderColor: '#3b82f6',
              fill: false,
            }]}
          />
        </div>

        {/* Runtime distribution histogram */}
        <div className="chart-box">
          <h3>Movie Runtime Distribution (10-min buckets)</h3>
          <BarChart
            loading={loading}
            labels={runtimeDist.map(r => r.bucket)}
            datasets={[{ label: 'Movies', data: runtimeDist.map(r => r.count), backgroundColor: '#8b5cf6' }]}
          />
        </div>
      </div>

      <div className="grid-2">
        {/* Movies vs TV shows per year */}
        <div className="chart-box">
          <h3>Movies vs TV Shows per Year</h3>
          <BarChart
            loading={loading}
            labels={formatYears.map(String)}
            datasets={formatDatasets}
          />
        </div>

        {/* Avg episode count per genre */}
        <div className="chart-box">
          <h3>Average Episode Count by Genre (TV Shows)</h3>
          <BarChart
            loading={loading}
            horizontal
            labels={seriesLen.slice(0, 15).map(s => s.genre)}
            datasets={[{
              label: 'Avg Episodes',
              data: seriesLen.slice(0, 15).map(s => Math.round(s.avg_episode_count)),
              backgroundColor: '#10b981',
            }]}
          />
        </div>
      </div>

    </PageShell>
  )
}

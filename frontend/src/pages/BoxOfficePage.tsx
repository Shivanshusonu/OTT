import { useState, useEffect } from 'react'
import PageShell from '../components/layout/PageShell'
import { ScatterChart, BarChart, LineChart } from '../components/charts'
import { fetchRoi, fetchTopGrossing, fetchSeasonal, fetchFranchises, type RoiItem, type TopGrossingItem, type SeasonalItem, type FranchiseItem } from '../api/boxoffice'

const fmt = (n: number) => n >= 1e9 ? `$${(n / 1e9).toFixed(1)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(0)}M` : `$${n.toLocaleString()}`

export default function BoxOfficePage() {
  const [roi, setRoi] = useState<RoiItem[]>([])
  const [top, setTop] = useState<TopGrossingItem[]>([])
  const [seasonal, setSeasonal] = useState<SeasonalItem[]>([])
  const [franchises, setFranchises] = useState<FranchiseItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetchRoi(), fetchTopGrossing({}), fetchSeasonal(), fetchFranchises()])
      .then(([r, t, s, f]) => { setRoi(r); setTop(t); setSeasonal(s); setFranchises(f) })
      .catch(() => {}).finally(() => setLoading(false))
  }, [])

  const profitable = roi.filter(r => r.roi_pct >= 0)
  const loss = roi.filter(r => r.roi_pct < 0)

  return (
    <PageShell title="Box Office & Revenue" subtitle="Budget vs gross, ROI analysis, seasonal trends">
      <div className="grid-2" style={{ marginBottom: 20 }}>
        {/* ROI Scatter */}
        <div className="chart-box">
          <h3>Budget vs Worldwide Gross (ROI)</h3>
          <ScatterChart
            loading={loading}
            xLabel="Budget ($M)" yLabel="Worldwide Gross ($M)"
            datasets={[
              { label: 'Profitable', backgroundColor: '#10b981aa', data: profitable.map(r => ({ x: r.budget / 1e6, y: r.worldwide_gross / 1e6, label: r.title })) },
              { label: 'Loss', backgroundColor: '#ef4444aa', data: loss.map(r => ({ x: r.budget / 1e6, y: r.worldwide_gross / 1e6, label: r.title })) },
            ]}
          />
        </div>

        {/* Seasonal */}
        <div className="chart-box">
          <h3>Gross Revenue by Month (Seasonality)</h3>
          <LineChart
            loading={loading}
            labels={seasonal.map(s => s.month_name)}
            datasets={[{ label: 'Total Gross', data: seasonal.map(s => s.total_gross / 1e6), borderColor: '#f59e0b', fill: true }]}
          />
        </div>
      </div>

      {/* Top Grossing */}
      <div className="chart-box" style={{ marginBottom: 20 }}>
        <h3>Top 20 Grossing Movies</h3>
        <BarChart
          loading={loading}
          horizontal
          labels={top.map(t => t.title.length > 30 ? t.title.slice(0, 30) + '…' : t.title)}
          datasets={[{ label: 'Worldwide Gross ($M)', data: top.map(t => t.worldwide_gross / 1e6), backgroundColor: '#3b82f6' }]}
        />
      </div>

      {/* Franchise Comparison */}
      <div className="chart-box" style={{ marginBottom: 20 }}>
        <h3>Franchise / Series Comparison</h3>
        <BarChart
          loading={loading}
          labels={franchises.slice(0, 15).map(f => f.keyword)}
          datasets={[
            { label: 'Total Gross ($M)', data: franchises.slice(0, 15).map(f => f.total_gross / 1e6), backgroundColor: '#8b5cf6' },
            { label: 'Title Count', data: franchises.slice(0, 15).map(f => f.title_count), backgroundColor: '#06b6d4' },
          ]}
        />
      </div>

      {/* ROI Table */}
      <div className="card">
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>ROI Rankings</h3>
        <table>
          <thead><tr><th>Title</th><th>Platform</th><th>Budget</th><th>Gross</th><th>ROI %</th></tr></thead>
          <tbody>
            {roi.slice(0, 20).map((r, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 500 }}>{r.title}</td>
                <td>{r.platform}</td>
                <td style={{ color: 'var(--muted)' }}>{fmt(r.budget)}</td>
                <td>{fmt(r.worldwide_gross)}</td>
                <td><span style={{ color: r.roi_pct >= 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}>{r.roi_pct.toFixed(0)}%</span></td>
              </tr>
            ))}
            {roi.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--muted)', padding: 24 }}>No box office data loaded yet</td></tr>}
          </tbody>
        </table>
      </div>
    </PageShell>
  )
}

import { useState, useEffect } from 'react'
import PageShell from '../components/layout/PageShell'
import { BarChart } from '../components/charts'
import {
  fetchAwardsByPlatform, fetchAwardsByGenre, fetchAwardsByCeremony, fetchTopWinners,
  type AwardsByPlatform, type AwardsByGenre, type AwardsByCeremony, type TopWinner,
} from '../api/awards'

export default function AwardsPage() {
  const [byPlatform,  setByPlatform]  = useState<AwardsByPlatform[]>([])
  const [byGenre,     setByGenre]     = useState<AwardsByGenre[]>([])
  const [byCeremony,  setByCeremony]  = useState<AwardsByCeremony[]>([])
  const [topWinners,  setTopWinners]  = useState<TopWinner[]>([])
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    Promise.all([
      fetchAwardsByPlatform(),
      fetchAwardsByGenre(),
      fetchAwardsByCeremony(),
      fetchTopWinners(20),
    ]).then(([p, g, c, t]) => {
      setByPlatform(p)
      setByGenre(g)
      setByCeremony(c)
      setTopWinners(t)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const WIN_COLOR  = '#f59e0b'
  const NOM_COLOR  = '#3b82f6'

  return (
    <PageShell title="Awards Analytics" subtitle="Wins and nominations across platforms, genres, and ceremonies">

      <div className="grid-2" style={{ marginBottom: 20 }}>
        {/* By Platform */}
        <div className="chart-box">
          <h3>Awards by Platform</h3>
          <BarChart
            loading={loading}
            labels={byPlatform.map(p => p.platform)}
            datasets={[
              { label: 'Wins',        data: byPlatform.map(p => p.wins),        backgroundColor: WIN_COLOR },
              { label: 'Nominations', data: byPlatform.map(p => p.nominations), backgroundColor: NOM_COLOR },
            ]}
          />
        </div>

        {/* By Ceremony */}
        <div className="chart-box">
          <h3>Awards by Ceremony</h3>
          <BarChart
            loading={loading}
            labels={byCeremony.map(c => c.ceremony)}
            datasets={[
              { label: 'Wins',        data: byCeremony.map(c => c.wins),        backgroundColor: WIN_COLOR },
              { label: 'Nominations', data: byCeremony.map(c => c.nominations), backgroundColor: NOM_COLOR },
            ]}
          />
        </div>
      </div>

      {/* By Genre */}
      <div className="chart-box" style={{ marginBottom: 20 }}>
        <h3>Awards by Genre</h3>
        <BarChart
          loading={loading}
          horizontal
          labels={byGenre.slice(0, 15).map(g => g.genre)}
          datasets={[
            { label: 'Wins',        data: byGenre.slice(0, 15).map(g => g.wins),        backgroundColor: WIN_COLOR },
            { label: 'Nominations', data: byGenre.slice(0, 15).map(g => g.nominations), backgroundColor: NOM_COLOR },
          ]}
        />
      </div>

      {/* Top Winners Table */}
      <div className="card">
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Top Award-Winning Titles</h3>
        {topWinners.length === 0 && !loading ? (
          <div style={{ textAlign: 'center', color: 'var(--muted)', padding: 32 }}>
            No awards data loaded yet — add an <code>awards.csv</code> to <code>data/</code> and re-run ingest.py
          </div>
        ) : (
          <table>
            <thead>
              <tr><th>#</th><th>Title</th><th>Platform</th><th>Wins</th></tr>
            </thead>
            <tbody>
              {loading
                ? <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--muted)', padding: 24 }}>Loading…</td></tr>
                : topWinners.map((w, i) => (
                  <tr key={i}>
                    <td style={{ color: 'var(--muted)' }}>{i + 1}</td>
                    <td style={{ fontWeight: 500 }}>{w.title}</td>
                    <td>{w.platform}</td>
                    <td><span style={{ color: WIN_COLOR, fontWeight: 700 }}>🏆 {w.wins}</span></td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        )}
      </div>

    </PageShell>
  )
}

import { useState, useEffect, useRef } from 'react'
import PageShell from '../components/layout/PageShell'
import { BarChart, LineChart, DoughnutChart } from '../components/charts'
import { fetchProlific, fetchCareerTrajectory, fetchGenreSpecialization, searchCast, type ProlificItem, type TrajectoryItem, type GenreSpecItem, type CastSearchItem } from '../api/cast'

export default function CastPage() {
  const [role, setRole] = useState<'actor' | 'director'>('actor')
  const [prolific, setProlific] = useState<ProlificItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<CastSearchItem[]>([])
  const [selectedPerson, setSelectedPerson] = useState<CastSearchItem | null>(null)
  const [trajectory, setTrajectory] = useState<TrajectoryItem[]>([])
  const [genreSpec, setGenreSpec] = useState<GenreSpecItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showDropdown, setShowDropdown] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setLoading(true)
    fetchProlific({ role, limit: 20 }).then(setProlific).catch(() => {}).finally(() => setLoading(false))
  }, [role])

  const handleSearch = (q: string) => {
    setSearchQuery(q)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (q.length < 2) { setSearchResults([]); return }
    debounceRef.current = setTimeout(() => {
      searchCast(q).then(r => { setSearchResults(r); setShowDropdown(true) }).catch(() => {})
    }, 300)
  }

  const selectPerson = (person: CastSearchItem) => {
    setSelectedPerson(person)
    setSearchQuery(person.name)
    setShowDropdown(false)
    Promise.all([fetchCareerTrajectory(person.id), fetchGenreSpecialization(person.id)])
      .then(([t, g]) => { setTrajectory(t); setGenreSpec(g) })
      .catch(() => {})
  }

  return (
    <PageShell title="Cast & Crew Analytics" subtitle="Director and actor productivity, career trajectories">
      <div className="grid-2" style={{ marginBottom: 20 }}>
        {/* Prolific Chart */}
        <div className="chart-box">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>Most Prolific</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['actor', 'director'] as const).map(r => (
                <button
                  key={r} onClick={() => setRole(r)}
                  className={role === r ? 'primary' : ''}
                  style={{ textTransform: 'capitalize', padding: '4px 12px' }}
                >{r}</button>
              ))}
            </div>
          </div>
          <BarChart
            loading={loading}
            horizontal
            labels={prolific.map(p => p.name)}
            datasets={[{ label: 'Titles', data: prolific.map(p => p.title_count), backgroundColor: '#8b5cf6' }]}
          />
        </div>

        {/* Person Search */}
        <div className="card">
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Person Lookup</h3>
          <div style={{ position: 'relative' }}>
            <input
              type="search" placeholder="Search by name…" value={searchQuery}
              onChange={e => handleSearch(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
              style={{ width: '100%' }}
            />
            {showDropdown && searchResults.length > 0 && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                background: 'var(--surface2)', border: '1px solid var(--border)',
                borderRadius: 6, maxHeight: 200, overflowY: 'auto',
              }}>
                {searchResults.map(r => (
                  <div key={r.id} onClick={() => selectPerson(r)} style={{
                    padding: '8px 12px', cursor: 'pointer', fontSize: 13,
                    display: 'flex', justifyContent: 'space-between',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--border)')}
                    onMouseLeave={e => (e.currentTarget.style.background = '')}
                  >
                    <span>{r.name}</span>
                    <span style={{ color: 'var(--muted)', textTransform: 'capitalize' }}>{r.role}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedPerson && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{selectedPerson.name}</div>
              <div style={{ color: 'var(--muted)', fontSize: 12, textTransform: 'capitalize' }}>{selectedPerson.role}</div>
            </div>
          )}

          {!selectedPerson && (
            <div style={{ marginTop: 20, color: 'var(--muted)', fontSize: 13 }}>
              Search and select a person to see their career trajectory and genre specialization.
            </div>
          )}
        </div>
      </div>

      {/* Career Trajectory + Genre Specialization */}
      {selectedPerson && (
        <div className="grid-2">
          <div className="chart-box">
            <h3>Career Trajectory — {selectedPerson.name}</h3>
            <LineChart
              labels={trajectory.map(t => String(t.release_year))}
              datasets={[{
                label: 'Avg IMDb Score',
                data: trajectory.map(t => t.avg_imdb_score ?? 0),
                borderColor: '#f59e0b',
              }]}
            />
          </div>
          <div className="chart-box">
            <h3>Genre Specialization — {selectedPerson.name}</h3>
            <DoughnutChart
              labels={genreSpec.map(g => g.genre)}
              data={genreSpec.map(g => g.count)}
            />
          </div>
        </div>
      )}

      {/* Prolific table */}
      <div className="card" style={{ marginTop: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>
          Most Prolific {role === 'actor' ? 'Actors' : 'Directors'}
        </h3>
        <table>
          <thead><tr><th>#</th><th>Name</th><th>Titles</th><th>Avg IMDb</th></tr></thead>
          <tbody>
            {prolific.map((p, i) => (
              <tr key={p.cast_id}>
                <td style={{ color: 'var(--muted)' }}>{i + 1}</td>
                <td style={{ fontWeight: 500 }}>{p.name}</td>
                <td>{p.title_count}</td>
                <td>{p.avg_imdb_score != null ? <span style={{ color: '#f59e0b' }}>{p.avg_imdb_score.toFixed(1)}</span> : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageShell>
  )
}

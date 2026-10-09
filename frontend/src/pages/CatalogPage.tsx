import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  useReactTable, getCoreRowModel, flexRender,
  type ColumnDef, type PaginationState,
} from '@tanstack/react-table'
import PageShell from '../components/layout/PageShell'
import {
  fetchCatalog, fetchCatalogFilters, fetchCatalogDetail,
  type CatalogItem, type CatalogDetail, type CatalogFilters,
} from '../api/catalog'

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [filters, setFilters] = useState<CatalogFilters>({ platforms: [], types: [], genres: [], years: [] })
  const [data, setData] = useState<CatalogItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [detail, setDetail] = useState<CatalogDetail | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 })

  const platform = searchParams.get('platform') || ''
  const type = searchParams.get('type') || ''
  const genre = searchParams.get('genre') || ''
  const year = searchParams.get('year') || ''

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value); else next.delete(key)
    next.delete('page')
    setSearchParams(next)
    setPagination(p => ({ ...p, pageIndex: 0 }))
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetchCatalog({
        platform: platform || undefined,
        type: type || undefined,
        genre: genre || undefined,
        release_year: year ? Number(year) : undefined,
        page: pagination.pageIndex,
        page_size: pagination.pageSize,
      })
      setData(res.items)
      setTotal(res.total)
    } catch {
      // backend not reachable — show empty table
    } finally {
      setLoading(false)
    }
  }, [platform, type, genre, year, pagination.pageIndex, pagination.pageSize])

  useEffect(() => { fetchCatalogFilters().then(setFilters).catch(() => {}) }, [])
  useEffect(() => { load() }, [load])

  const openDetail = async (id: number) => {
    try {
      const d = await fetchCatalogDetail(id)
      setDetail(d)
      setDrawerOpen(true)
    } catch {
      // ignore fetch error on row click
    }
  }

  const columns: ColumnDef<CatalogItem>[] = [
    { header: 'Title', accessorKey: 'title', cell: i => <span style={{ fontWeight: 500 }}>{i.getValue() as string}</span> },
    { header: 'Type', accessorKey: 'type', cell: i => <span className={`badge ${(i.getValue() as string) === 'Movie' ? 'movie' : 'show'}`}>{i.getValue() as string}</span> },
    { header: 'Platform', accessorKey: 'platform' },
    { header: 'Year', accessorKey: 'release_year' },
    { header: 'Duration', accessorKey: 'duration_str' },
    { header: 'Original', accessorKey: 'is_original', cell: i => i.getValue() ? '✓' : '' },
  ]

  const table = useReactTable({
    data, columns,
    pageCount: Math.ceil(total / pagination.pageSize),
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  })

  const pageCount = Math.ceil(total / pagination.pageSize)

  return (
    <PageShell title="Content Catalog" subtitle={`${total.toLocaleString()} titles across all platforms`}>
      {/* Filter bar */}
      <div className="filter-bar">
        <label>Platform</label>
        <select value={platform} onChange={e => setFilter('platform', e.target.value)}>
          <option value="">All</option>
          {filters.platforms.map(p => <option key={p}>{p}</option>)}
        </select>
        <label>Type</label>
        <select value={type} onChange={e => setFilter('type', e.target.value)}>
          <option value="">All</option>
          {filters.types.map(t => <option key={t}>{t}</option>)}
        </select>
        <label>Genre</label>
        <select value={genre} onChange={e => setFilter('genre', e.target.value)}>
          <option value="">All</option>
          {filters.genres.map(g => <option key={g}>{g}</option>)}
        </select>
        <label>Year</label>
        <select value={year} onChange={e => setFilter('year', e.target.value)}>
          <option value="">All</option>
          {filters.years.map(y => <option key={y}>{y}</option>)}
        </select>
        <button onClick={() => { setSearchParams({}); setPagination(p => ({ ...p, pageIndex: 0 })) }}>
          Reset
        </button>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table>
          <thead>
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id}>
                {hg.headers.map(h => (
                  <th key={h.id}>{flexRender(h.column.columnDef.header, h.getContext())}</th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--muted)' }}>Loading…</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--muted)' }}>No results</td></tr>
            ) : table.getRowModel().rows.map(row => (
              <tr key={row.id} style={{ cursor: 'pointer' }} onClick={() => openDetail(row.original.id)}>
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
          <button onClick={() => setPagination(p => ({ ...p, pageIndex: 0 }))} disabled={pagination.pageIndex === 0}>«</button>
          <button onClick={() => setPagination(p => ({ ...p, pageIndex: p.pageIndex - 1 }))} disabled={pagination.pageIndex === 0}>‹</button>
          <span style={{ color: 'var(--muted)', fontSize: 13 }}>
            Page {pagination.pageIndex + 1} of {pageCount || 1}
          </span>
          <button onClick={() => setPagination(p => ({ ...p, pageIndex: p.pageIndex + 1 }))} disabled={pagination.pageIndex >= pageCount - 1}>›</button>
          <button onClick={() => setPagination(p => ({ ...p, pageIndex: pageCount - 1 }))} disabled={pagination.pageIndex >= pageCount - 1}>»</button>
          <span style={{ marginLeft: 'auto', color: 'var(--muted)', fontSize: 12 }}>{total.toLocaleString()} total</span>
        </div>
      </div>

      {/* Detail Drawer */}
      {drawerOpen && detail && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end',
        }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} onClick={() => setDrawerOpen(false)} />
          <div style={{
            position: 'relative', width: 420, height: '100vh', background: 'var(--surface)',
            borderLeft: '1px solid var(--border)', overflowY: 'auto', padding: 28,
          }}>
            <button onClick={() => setDrawerOpen(false)} style={{ float: 'right', marginBottom: 16 }}>✕ Close</button>
            <h2 style={{ fontSize: 18, marginBottom: 8 }}>{detail.title}</h2>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <span className={`badge ${detail.type === 'Movie' ? 'movie' : 'show'}`}>{detail.type}</span>
              {detail.is_original && <span className="badge" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>Original</span>}
            </div>
            <p style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.7, marginBottom: 16 }}>{detail.description}</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div><span style={{ color: 'var(--muted)', fontSize: 12 }}>PLATFORM</span><div>{detail.platform}</div></div>
              <div><span style={{ color: 'var(--muted)', fontSize: 12 }}>YEAR</span><div>{detail.release_year}</div></div>
              <div><span style={{ color: 'var(--muted)', fontSize: 12 }}>DURATION</span><div>{detail.duration_str}</div></div>
              <div><span style={{ color: 'var(--muted)', fontSize: 12 }}>LANGUAGE</span><div>{detail.language || '—'}</div></div>
            </div>
            {detail.rating && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 8 }}>RATINGS</div>
                <div style={{ display: 'flex', gap: 16 }}>
                  {detail.rating.imdb_score != null && <div><div style={{ fontSize: 22, fontWeight: 700, color: '#f59e0b' }}>{detail.rating.imdb_score}</div><div style={{ fontSize: 11, color: 'var(--muted)' }}>IMDb</div></div>}
                  {detail.rating.rt_score != null && <div><div style={{ fontSize: 22, fontWeight: 700, color: '#e50914' }}>{detail.rating.rt_score}%</div><div style={{ fontSize: 11, color: 'var(--muted)' }}>RT</div></div>}
                  {detail.rating.audience_score != null && <div><div style={{ fontSize: 22, fontWeight: 700, color: '#3b82f6' }}>{detail.rating.audience_score}%</div><div style={{ fontSize: 11, color: 'var(--muted)' }}>Audience</div></div>}
                </div>
              </div>
            )}
            {detail.genres.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 6 }}>GENRES</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {detail.genres.map(g => <span key={g} className="badge">{g}</span>)}
                </div>
              </div>
            )}
            {detail.countries.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 6 }}>COUNTRIES</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {detail.countries.map(c => <span key={c} className="badge">{c}</span>)}
                </div>
              </div>
            )}
            {detail.cast.length > 0 && (
              <div>
                <div style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 8 }}>CAST & CREW</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {detail.cast.slice(0, 10).map((c, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span>{c.name}</span>
                      <span style={{ color: 'var(--muted)', textTransform: 'capitalize' }}>{c.role}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </PageShell>
  )
}

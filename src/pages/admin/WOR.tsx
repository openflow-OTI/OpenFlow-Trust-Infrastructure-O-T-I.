import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { adminFetch } from '@/lib/adminClient'

type SubView = 'registry' | 'compromised' | 'override'

interface WORRegistration {
  id?: string
  address: string
  chain_family: string
  registered_at: string
  last_verified_at?: string
  status: string
}

interface WORRegistrationsResponse {
  registrations?: WORRegistration[]
  data?: WORRegistration[]
  total?: number
  page?: number
  limit?: number
}

function fmt(ts?: string) {
  if (!ts) return '—'
  return new Date(ts).toLocaleString()
}

function statusBadge(status: string) {
  if (status === 'compromised') {
    return <span style={{ color: 'var(--danger)', fontWeight: 600 }}>compromised</span>
  }
  if (status === 'active') {
    return <span style={{ color: 'var(--accent)', fontWeight: 600 }}>active</span>
  }
  return <span style={{ color: 'var(--text-dim)' }}>{status}</span>
}

// ── Registry & Compromised shared table ──────────────────────────────────────
function RegistryTable({ statusFilter }: { statusFilter: 'all' | 'active' | 'compromised' }) {
  const [search, setSearch]   = useState('')
  const [status, setStatus]   = useState<'all' | 'active' | 'compromised'>(statusFilter)
  const [page, setPage]       = useState(1)
  const limit                 = 20

  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    ...(search ? { search } : {}),
    ...(status !== 'all' ? { status } : {}),
  })

  const query = useQuery({
    queryKey: ['admin', 'wor', 'registrations', page, limit, search, status],
    queryFn: () => adminFetch<WORRegistrationsResponse>(`/admin/wor/registrations?${params}`),
    retry: false,
  })

  const rows: WORRegistration[] =
    (query.data?.registrations ?? query.data?.data ?? [])

  const total = query.data?.total ?? rows.length

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPage(1)
    query.refetch()
  }

  return (
    <div className="admin-section" style={{ gap: '1rem' }}>
      {/* Filters */}
      <form onSubmit={handleSearch} className="wor-admin-filters">
        <input
          className="admin-input"
          style={{ maxWidth: 280 }}
          placeholder="Search by address prefix…"
          value={search}
          onChange={e => { setSearch(e.target.value) }}
        />
        {statusFilter === 'all' && (
          <select
            className="admin-input"
            style={{ maxWidth: 160 }}
            value={status}
            onChange={e => { setStatus(e.target.value as 'all' | 'active' | 'compromised'); setPage(1) }}
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="compromised">Compromised</option>
          </select>
        )}
        <button className="admin-btn admin-btn--ghost" type="submit">Search</button>
        {(search || status !== 'all') && (
          <button
            className="admin-btn admin-btn--ghost"
            type="button"
            onClick={() => { setSearch(''); setStatus(statusFilter); setPage(1) }}
          >
            Clear
          </button>
        )}
      </form>

      {query.isLoading && <p className="admin-loading">Loading registrations…</p>}

      {query.isError && (
        <div className="admin-error-block">
          <p className="admin-error">
            {query.error instanceof Error ? query.error.message : String(query.error)}
          </p>
          <button className="admin-btn admin-btn--ghost" onClick={() => query.refetch()}>
            ↻ Retry
          </button>
        </div>
      )}

      {query.isSuccess && (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Address</th>
                  <th>Chain</th>
                  <th>Status</th>
                  <th>Registered</th>
                  <th>Last Verified</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.id ?? `${r.address}-${i}`}>
                    <td className="admin-td-mono">{r.address}</td>
                    <td>{r.chain_family}</td>
                    <td>{statusBadge(r.status)}</td>
                    <td>{fmt(r.registered_at)}</td>
                    <td>{fmt(r.last_verified_at)}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-dim)' }}>
                      No registrations found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="wor-admin-pagination">
            <span className="wor-admin-page-info">
              {rows.length > 0
                ? `Showing ${(page - 1) * limit + 1}–${(page - 1) * limit + rows.length}${total ? ` of ${total}` : ''}`
                : '0 results'}
            </span>
            <div className="admin-action-group">
              <button
                className="admin-btn admin-btn--ghost"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
              >
                ← Prev
              </button>
              <button
                className="admin-btn admin-btn--ghost"
                disabled={rows.length < limit}
                onClick={() => setPage(p => p + 1)}
              >
                Next →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ── Manual Override ──────────────────────────────────────────────────────────
function ManualOverride() {
  const qc                         = useQueryClient()
  const [flagAddr, setFlagAddr]    = useState('')
  const [unflagAddr, setUnflagAddr] = useState('')
  const [flagLoading, setFlagLoading]     = useState(false)
  const [unflagLoading, setUnflagLoading] = useState(false)
  const [flagMsg, setFlagMsg]             = useState<{ ok: boolean; text: string } | null>(null)
  const [unflagMsg, setUnflagMsg]         = useState<{ ok: boolean; text: string } | null>(null)

  async function handleFlag(e: React.FormEvent) {
    e.preventDefault()
    const addr = flagAddr.trim()
    if (!addr) return
    if (!confirm(`Flag "${addr}" as compromised? This will show a warning on all future score checks.`)) return
    setFlagLoading(true)
    setFlagMsg(null)
    try {
      const res = await adminFetch<{ message?: string }>('/admin/wor/flag', {
        method: 'POST',
        body: JSON.stringify({ address: addr }),
      })
      const text = (res as { message?: string }).message ?? 'Wallet flagged successfully.'
      setFlagMsg({ ok: true, text })
      setFlagAddr('')
      qc.invalidateQueries({ queryKey: ['admin', 'wor'] })
    } catch (err) {
      setFlagMsg({ ok: false, text: err instanceof Error ? err.message : 'Flag failed.' })
    } finally {
      setFlagLoading(false)
    }
  }

  async function handleUnflag(e: React.FormEvent) {
    e.preventDefault()
    const addr = unflagAddr.trim()
    if (!addr) return
    if (!confirm(`Remove the compromised flag from "${addr}"? Scoring will resume normally.`)) return
    setUnflagLoading(true)
    setUnflagMsg(null)
    try {
      const res = await adminFetch<{ message?: string }>(
        `/admin/wor/flag/${encodeURIComponent(addr)}`,
        { method: 'DELETE' }
      )
      const text = (res as { message?: string }).message ?? 'Flag removed successfully.'
      setUnflagMsg({ ok: true, text })
      setUnflagAddr('')
      qc.invalidateQueries({ queryKey: ['admin', 'wor'] })
    } catch (err) {
      setUnflagMsg({ ok: false, text: err instanceof Error ? err.message : 'Unflag failed.' })
    } finally {
      setUnflagLoading(false)
    }
  }

  return (
    <div className="admin-section">
      <p className="admin-section-desc">
        Manually flag or unflag any wallet address in the WOR registry. These actions take
        effect immediately.
      </p>

      {/* Flag */}
      <div className="admin-form">
        <h3 className="admin-subsection-title">Flag as Compromised</h3>
        <form onSubmit={handleFlag}>
          <div className="admin-form-row">
            <label>Address</label>
            <input
              className="admin-input"
              placeholder="0x… or wallet address"
              value={flagAddr}
              onChange={e => { setFlagAddr(e.target.value); setFlagMsg(null) }}
              required
            />
            <button
              className="admin-btn admin-btn--danger"
              type="submit"
              disabled={flagLoading}
            >
              {flagLoading ? 'Flagging…' : '⚑ Flag as Compromised'}
            </button>
          </div>
          {flagMsg && (
            <p className={flagMsg.ok ? 'admin-success' : 'admin-error'}>{flagMsg.text}</p>
          )}
        </form>
      </div>

      {/* Unflag */}
      <div className="admin-form">
        <h3 className="admin-subsection-title">Remove Flag</h3>
        <form onSubmit={handleUnflag}>
          <div className="admin-form-row">
            <label>Address</label>
            <input
              className="admin-input"
              placeholder="0x… or wallet address"
              value={unflagAddr}
              onChange={e => { setUnflagAddr(e.target.value); setUnflagMsg(null) }}
              required
            />
            <button
              className="admin-btn admin-btn--ghost"
              type="submit"
              disabled={unflagLoading}
            >
              {unflagLoading ? 'Removing…' : '✕ Remove Flag'}
            </button>
          </div>
          {unflagMsg && (
            <p className={unflagMsg.ok ? 'admin-success' : 'admin-error'}>{unflagMsg.text}</p>
          )}
        </form>
      </div>
    </div>
  )
}

// ── Main WOR tab ─────────────────────────────────────────────────────────────
export function WOR() {
  const [view, setView] = useState<SubView>('registry')

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2 className="admin-section-title">Wallet Ownership Registry</h2>
      </div>
      <p className="admin-section-desc">
        Registered wallets that have completed EVM ownership verification. Compromised wallets
        are flagged and show a warning on all future score checks.
      </p>

      {/* Sub-view segmented control */}
      <div className="wor-admin-seg">
        {(
          [
            { id: 'registry',   label: 'Registry' },
            { id: 'compromised', label: 'Compromised' },
            { id: 'override',   label: 'Manual Override' },
          ] as { id: SubView; label: string }[]
        ).map(s => (
          <button
            key={s.id}
            className={`wor-admin-seg-btn${view === s.id ? ' wor-admin-seg-btn--active' : ''}`}
            onClick={() => setView(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {view === 'registry'    && <RegistryTable statusFilter="all" />}
      {view === 'compromised' && <RegistryTable statusFilter="compromised" />}
      {view === 'override'    && <ManualOverride />}
    </div>
  )
}

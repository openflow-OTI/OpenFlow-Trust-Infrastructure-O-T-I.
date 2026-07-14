import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminFetch } from '@/lib/adminClient'
import { CHAINS } from '@/lib/chains'

interface CacheStats {
  cacheEnabled: boolean
  rescoreWindowDays: number
  totalCachedWallets: number
  oldestScore: string | null
  newestScore: string | null
}

interface ScoreResult {
  address: string
  chain: string
  score: number
  cached: boolean
  compromised: boolean
  reason?: string
}

const SCORE_TIERS = [
  { min: 80, label: 'HIGHLY TRUSTED', color: '#00e5a0' },
  { min: 60, label: 'TRUSTED',        color: '#4ade80' },
  { min: 40, label: 'CAUTION',        color: '#facc15' },
  { min: 20, label: 'SUSPICIOUS',     color: '#fb923c' },
  { min: 0,  label: 'HIGH RISK',      color: '#f87171' },
]

function getTier(score: number) {
  return SCORE_TIERS.find(t => score >= t.min) ?? SCORE_TIERS[SCORE_TIERS.length - 1]
}

function fmt(ts: string | null | undefined) {
  if (!ts) return '—'
  return new Date(ts).toLocaleString()
}

export function AdminCache() {
  const qc = useQueryClient()

  // ── Stats ────────────────────────────────────────────────────────────────
  const stats = useQuery({
    queryKey: ['admin', 'cache', 'stats'],
    queryFn: () => adminFetch<CacheStats>('/admin/cache/stats'),
    retry: false,
  })

  // ── Toggle ───────────────────────────────────────────────────────────────
  const toggleMutation = useMutation({
    mutationFn: (enabled: boolean) =>
      adminFetch<{ success: boolean; cacheEnabled: boolean }>('/admin/cache/toggle', {
        method: 'PATCH',
        body: JSON.stringify({ enabled }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'cache', 'stats'] }),
  })

  function handleToggle() {
    if (!stats.data) return
    const current = stats.data.cacheEnabled
    if (current) {
      if (!confirm('Turn cache OFF?\n\nLive chain data only while disabled. No results will be cached.')) return
    }
    toggleMutation.mutate(!current)
  }

  // ── Rescore window ───────────────────────────────────────────────────────
  const [windowDays, setWindowDays] = useState<number | ''>('')
  const [windowMsg,  setWindowMsg]  = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    if (stats.data && windowDays === '') {
      setWindowDays(stats.data.rescoreWindowDays)
    }
  }, [stats.data])

  const windowMutation = useMutation({
    mutationFn: (days: number) =>
      adminFetch<{ success: boolean; rescoreWindowDays: number }>('/admin/rescore-window', {
        method: 'PATCH',
        body: JSON.stringify({ days }),
      }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['admin', 'cache', 'stats'] })
      setWindowMsg({ ok: true, text: `Rescore window set to ${data.rescoreWindowDays} days.` })
    },
    onError: (err) => {
      setWindowMsg({ ok: false, text: err instanceof Error ? err.message : String(err) })
    },
  })

  function handleWindowSave(e: React.FormEvent) {
    e.preventDefault()
    setWindowMsg(null)
    const days = Number(windowDays)
    if (!days || days < 1) { setWindowMsg({ ok: false, text: 'Enter a valid number of days (≥ 1).' }); return }
    windowMutation.mutate(days)
  }

  // ── Clear single wallet ──────────────────────────────────────────────────
  const [clearAddr, setClearAddr] = useState('')
  const [clearMsg,  setClearMsg]  = useState<{ ok: boolean; text: string } | null>(null)

  const clearOneMutation = useMutation({
    mutationFn: (address: string) =>
      adminFetch<{ success: boolean }>(`/admin/cache/${encodeURIComponent(address)}`, {
        method: 'DELETE',
      }),
    onSuccess: (_, address) => {
      qc.invalidateQueries({ queryKey: ['admin', 'cache', 'stats'] })
      setClearMsg({ ok: true, text: `Cache cleared for ${address}.` })
      setScoreAddr(address)
      setClearAddr('')
    },
    onError: (err) => {
      setClearMsg({ ok: false, text: err instanceof Error ? err.message : String(err) })
    },
  })

  function handleClearOne(e: React.FormEvent) {
    e.preventDefault()
    setClearMsg(null)
    const addr = clearAddr.trim()
    if (!addr) { setClearMsg({ ok: false, text: 'Enter a wallet address.' }); return }
    if (!confirm(`This will force a fresh score for ${addr} on next request.`)) return
    clearOneMutation.mutate(addr)
  }

  // ── Clear all ────────────────────────────────────────────────────────────
  const [clearAllMsg, setClearAllMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const clearAllMutation = useMutation({
    mutationFn: () =>
      adminFetch<{ success: boolean; deletedRows: number }>('/admin/cache', {
        method: 'DELETE',
      }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['admin', 'cache', 'stats'] })
      setClearAllMsg({ ok: true, text: `All cache cleared — ${data.deletedRows} row${data.deletedRows !== 1 ? 's' : ''} deleted.` })
    },
    onError: (err) => {
      setClearAllMsg({ ok: false, text: err instanceof Error ? err.message : String(err) })
    },
  })

  function handleClearAll() {
    setClearAllMsg(null)
    const count = stats.data?.totalCachedWallets ?? 0
    if (!confirm(`This will wipe all ${count} cached score${count !== 1 ? 's' : ''}.\nEvery wallet will be rescored on next request.`)) return
    clearAllMutation.mutate()
  }

  // ── Quick scorer ─────────────────────────────────────────────────────────
  const [scoreAddr,   setScoreAddr]   = useState('')
  const [scoreChain,  setScoreChain]  = useState('ethereum')
  const [scoring,     setScoring]     = useState(false)
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null)
  const [scoreErr,    setScoreErr]    = useState<string | null>(null)

  async function handleScore(e: React.FormEvent) {
    e.preventDefault()
    const addr = scoreAddr.trim()
    if (!addr) return
    setScoring(true)
    setScoreResult(null)
    setScoreErr(null)
    try {
      const data = await adminFetch<ScoreResult>(
        `/score/${encodeURIComponent(addr)}?chain=${scoreChain}`
      )
      setScoreResult(data)
    } catch (err) {
      setScoreErr(err instanceof Error ? err.message : String(err))
    } finally {
      setScoring(false)
    }
  }

  const cacheOn = stats.data?.cacheEnabled ?? false

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="admin-section">
      <h2 className="admin-section-title">Cache</h2>

      {/* ── Stats row ─────────────────────────────────────────────────── */}
      <div className="admin-section-header" style={{ marginBottom: '1rem' }}>
        <h3 className="admin-subsection-title" style={{ marginBottom: 0 }}>Stats</h3>
        <button
          className="admin-btn admin-btn--ghost"
          onClick={() => stats.refetch()}
          disabled={stats.isFetching}
        >
          {stats.isFetching ? 'Refreshing…' : '↻ Refresh stats'}
        </button>
      </div>

      {stats.isLoading && <p className="admin-loading">Loading cache stats…</p>}

      {stats.isError && (
        <div className="admin-error-block">
          <p className="admin-error">
            {stats.error instanceof Error ? stats.error.message : String(stats.error)}
          </p>
          <button className="admin-btn admin-btn--ghost" onClick={() => stats.refetch()}>
            ↻ Retry
          </button>
        </div>
      )}

      {stats.isSuccess && (
        <div className="admin-stat-grid" style={{ marginBottom: '2rem' }}>
          <div className="admin-stat-card">
            <span className="admin-stat-value" style={{ color: cacheOn ? 'var(--mint)' : 'var(--danger)' }}>
              {cacheOn ? 'ON' : 'OFF'}
            </span>
            <span className="admin-stat-label">Cache enabled</span>
          </div>
          <div className="admin-stat-card">
            <span className="admin-stat-value">{stats.data.rescoreWindowDays}d</span>
            <span className="admin-stat-label">Rescore window</span>
          </div>
          <div className="admin-stat-card">
            <span className="admin-stat-value">{stats.data.totalCachedWallets.toLocaleString()}</span>
            <span className="admin-stat-label">Wallets cached</span>
          </div>
          <div className="admin-stat-card">
            <span className="admin-stat-value" style={{ fontSize: '0.9rem' }}>{fmt(stats.data.oldestScore)}</span>
            <span className="admin-stat-label">Oldest score</span>
          </div>
          <div className="admin-stat-card">
            <span className="admin-stat-value" style={{ fontSize: '0.9rem' }}>{fmt(stats.data.newestScore)}</span>
            <span className="admin-stat-label">Newest score</span>
          </div>
        </div>
      )}

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', marginBottom: '2rem' }} />

      {/* ── Cache toggle ──────────────────────────────────────────────── */}
      <h3 className="admin-subsection-title">Cache on / off</h3>

      <div className="cache-toggle-wrap">
        <label className="cache-toggle-switch" aria-label="Toggle cache">
          <input
            type="checkbox"
            checked={cacheOn}
            disabled={toggleMutation.isPending || !stats.isSuccess}
            onChange={handleToggle}
          />
          <span className="cache-toggle-track" />
        </label>
        <span className={`cache-toggle-label cache-toggle-label--${cacheOn ? 'on' : 'off'}`}>
          {toggleMutation.isPending
            ? 'Updating…'
            : cacheOn
              ? 'ON — results are being cached'
              : 'OFF — live data only, nothing cached'}
        </span>
      </div>

      {toggleMutation.isError && (
        <p className="admin-error" style={{ marginBottom: '1.5rem' }}>
          {toggleMutation.error instanceof Error ? toggleMutation.error.message : String(toggleMutation.error)}
        </p>
      )}

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', marginBottom: '2rem' }} />

      {/* ── Rescore window ────────────────────────────────────────────── */}
      <h3 className="admin-subsection-title">Rescore window</h3>
      <p className="admin-section-desc">
        Wallets scored more recently than this window are served from cache. Older ones are rescored live.
      </p>
      <form className="admin-form" onSubmit={handleWindowSave} style={{ maxWidth: 320 }}>
        <div className="admin-form-row">
          <label>Window (days)</label>
          <input
            className="admin-input"
            type="number"
            min={1}
            value={windowDays}
            onChange={e => { setWindowDays(e.target.value === '' ? '' : Number(e.target.value)); setWindowMsg(null) }}
            placeholder="e.g. 7"
          />
        </div>
        <button
          className="admin-btn admin-btn--primary"
          type="submit"
          disabled={windowMutation.isPending}
        >
          {windowMutation.isPending ? 'Saving…' : 'Save'}
        </button>
        {windowMsg && (
          <p className={windowMsg.ok ? 'admin-success' : 'admin-error'} style={{ marginTop: '0.5rem' }}>
            {windowMsg.text}
          </p>
        )}
      </form>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '2rem 0' }} />

      {/* ── Clear single wallet ───────────────────────────────────────── */}
      <h3 className="admin-subsection-title">Clear single wallet</h3>
      <p className="admin-section-desc">
        Force a fresh live score for one wallet address on its next request.
      </p>
      <form className="admin-form" onSubmit={handleClearOne} style={{ maxWidth: 480 }}>
        <div className="admin-form-row">
          <label>Wallet address</label>
          <input
            className="admin-input"
            value={clearAddr}
            onChange={e => { setClearAddr(e.target.value); setClearMsg(null) }}
            placeholder="0x… or base58…"
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
          />
        </div>
        <button
          className="admin-btn admin-btn--danger"
          type="submit"
          disabled={clearOneMutation.isPending}
        >
          {clearOneMutation.isPending ? 'Clearing…' : 'Clear wallet cache'}
        </button>
        {clearMsg && (
          <p className={clearMsg.ok ? 'admin-success' : 'admin-error'} style={{ marginTop: '0.5rem' }}>
            {clearMsg.text}
            {clearMsg.ok && (
              <span
                style={{ marginLeft: '0.6rem', color: 'var(--mint)', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.85em' }}
                onClick={() => document.getElementById('cache-quick-score-addr')?.focus()}
              >
                Score it now ↓
              </span>
            )}
          </p>
        )}
      </form>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '2rem 0' }} />

      {/* ── Clear all ─────────────────────────────────────────────────── */}
      <h3 className="admin-subsection-title">Clear all cache</h3>
      <p className="admin-section-desc">
        Wipe every cached score. All wallets will be rescored live on their next request.
      </p>
      <button
        className="admin-btn admin-btn--danger admin-btn--lg"
        onClick={handleClearAll}
        disabled={clearAllMutation.isPending || !stats.isSuccess}
      >
        {clearAllMutation.isPending ? 'Clearing…' : 'Clear all cache'}
      </button>
      {clearAllMsg && (
        <p className={clearAllMsg.ok ? 'admin-success' : 'admin-error'} style={{ marginTop: '0.75rem' }}>
          {clearAllMsg.text}
        </p>
      )}

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '2rem 0' }} />

      {/* ── Quick scorer ──────────────────────────────────────────────── */}
      <h3 className="admin-subsection-title">Score a wallet</h3>
      <p className="admin-section-desc">
        Fetch a live score immediately — useful right after clearing a wallet's cache.
        {scoreAddr && <span style={{ color: 'var(--mint)', marginLeft: '0.4rem' }}>Address pre-filled from last clear.</span>}
      </p>
      <form className="admin-form" onSubmit={handleScore} style={{ maxWidth: 480 }}>
        <div className="admin-form-row">
          <label>Wallet address</label>
          <input
            id="cache-quick-score-addr"
            className="admin-input"
            value={scoreAddr}
            onChange={e => { setScoreAddr(e.target.value); setScoreResult(null); setScoreErr(null) }}
            placeholder="0x… or base58…"
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
          />
        </div>
        <div className="admin-form-row">
          <label>Chain</label>
          <select
            className="admin-input"
            value={scoreChain}
            onChange={e => { setScoreChain(e.target.value); setScoreResult(null); setScoreErr(null) }}
          >
            {CHAINS.map(c => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>
        <button
          className="admin-btn admin-btn--primary"
          type="submit"
          disabled={scoring || !scoreAddr.trim()}
        >
          {scoring ? 'Scoring…' : '▶ Score now'}
        </button>

        {scoreErr && (
          <p className="admin-error" style={{ marginTop: '0.6rem' }}>{scoreErr}</p>
        )}

        {scoreResult && !scoreResult.compromised && (() => {
          const tier = getTier(scoreResult.score)
          return (
            <div style={{
              marginTop: '0.75rem',
              padding: '0.9rem 1.1rem',
              background: 'rgba(0,229,160,0.04)',
              border: `1px solid ${tier.color}33`,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              flexWrap: 'wrap',
            }}>
              <span style={{ fontSize: '2rem', fontWeight: 700, color: tier.color, lineHeight: 1 }}>
                {scoreResult.score}
              </span>
              <div>
                <span style={{
                  fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em',
                  color: tier.color, border: `1px solid ${tier.color}`, borderRadius: 4,
                  padding: '2px 8px', display: 'inline-block',
                }}>
                  {tier.label}
                </span>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: 4 }}>
                  {scoreResult.chain} · {scoreResult.address.slice(0, 16)}…
                  {scoreResult.cached && (
                    <span style={{ marginLeft: 6, opacity: 0.6 }}>(cached)</span>
                  )}
                </div>
              </div>
            </div>
          )
        })()}

        {scoreResult?.compromised && (
          <div style={{
            marginTop: '0.75rem',
            padding: '0.9rem 1.1rem',
            background: 'rgba(248,113,113,0.08)',
            border: '1px solid #f87171',
            borderRadius: 8,
            color: '#fca5a5',
            fontSize: '0.85rem',
          }}>
            <strong>⚠ Compromised wallet</strong>
            {scoreResult.reason && <div style={{ marginTop: 4, opacity: 0.8 }}>{scoreResult.reason}</div>}
          </div>
        )}
      </form>
    </div>
  )
}

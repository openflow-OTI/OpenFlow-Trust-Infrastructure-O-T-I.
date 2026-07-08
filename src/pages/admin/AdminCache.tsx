import { useState } from 'react'
import { adminFetch } from '@/lib/adminClient'

export function AdminCache() {
  const [status, setStatus] = useState<'idle' | 'flushing' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleFlush() {
    if (!confirm('Flush the entire in-memory score cache? All cached results will be evicted.')) return
    setStatus('flushing')
    setMessage('')
    try {
      await adminFetch('/admin/cache/flush', { method: 'POST' })
      setStatus('done')
      setMessage('Cache flushed successfully.')
    } catch (err) {
      setStatus('error')
      setMessage(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <div className="admin-section">
      <h2 className="admin-section-title">Cache</h2>
      <p className="admin-section-desc">
        Flushes the in-memory score cache. The next lookup for any wallet will re-fetch live
        on-chain data from the chain provider.
      </p>
      <button
        className="admin-btn admin-btn--danger admin-btn--lg"
        onClick={handleFlush}
        disabled={status === 'flushing'}
      >
        {status === 'flushing' ? 'Flushing…' : 'Flush Cache'}
      </button>
      {status === 'done' && <p className="admin-success">{message}</p>}
      {status === 'error' && (
        <div className="admin-error-block">
          <p className="admin-error">{message}</p>
          <p className="admin-error" style={{ opacity: 0.7, fontSize: '0.78rem' }}>
            Click "Flush Cache" above to try again.
          </p>
        </div>
      )}
    </div>
  )
}

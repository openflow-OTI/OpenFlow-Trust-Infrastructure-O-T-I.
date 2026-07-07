import { useQuery } from '@tanstack/react-query'
import { adminFetch } from '@/lib/adminClient'
import { CopyButton } from './CopyButton'

interface HistoryEntry {
  address: string
  chain: string
  score: number
  timestamp: string
}

export function QueryHistory() {
  const history = useQuery({
    queryKey: ['admin', 'history'],
    queryFn: () => adminFetch<HistoryEntry[]>('/admin/history'),
    retry: false,
  })

  return (
    <div className="admin-section">
      <h2 className="admin-section-title">Query History</h2>

      {history.isLoading && <p className="admin-loading">Loading history…</p>}

      {history.isError && (
        <div className="admin-error-block">
          <p className="admin-error">
            {history.error instanceof Error ? history.error.message : String(history.error)}
          </p>
          <button className="admin-btn admin-btn--ghost" onClick={() => history.refetch()}>
            ↻ Retry
          </button>
        </div>
      )}

      {history.isSuccess && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Address</th>
                <th>Chain</th>
                <th>Score</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {history.data.map((r, i) => (
                <tr key={i}>
                  <td className="admin-td-mono">
                    <span className="admin-copy-row">
                      <span>{r.address}</span>
                      <CopyButton value={r.address} />
                    </span>
                  </td>
                  <td>{r.chain}</td>
                  <td>{r.score}</td>
                  <td>{new Date(r.timestamp).toLocaleString()}</td>
                </tr>
              ))}
              {history.data.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-dim)' }}>
                    No history yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

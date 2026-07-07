import { useQuery } from '@tanstack/react-query'
import { adminFetch } from '@/lib/adminClient'

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

  if (history.isLoading) return <p className="admin-loading">Loading history…</p>
  if (history.isError)
    return <p className="admin-error">{history.error instanceof Error ? history.error.message : String(history.error)}</p>

  const rows = history.data!

  return (
    <div className="admin-section">
      <h2 className="admin-section-title">Query History</h2>
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
            {rows.map((r, i) => (
              <tr key={i}>
                <td className="admin-td-mono">{r.address}</td>
                <td>{r.chain}</td>
                <td>{r.score}</td>
                <td>{new Date(r.timestamp).toLocaleString()}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-dim)' }}>
                  No history yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

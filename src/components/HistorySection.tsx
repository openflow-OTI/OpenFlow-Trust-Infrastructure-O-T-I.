import type { components } from '@/api/schema.gen'
import { SignalBar } from './SignalBar'

type HistoryEntry = components['schemas']['HistoryEntry']

export function HistorySection({ history }: { history: HistoryEntry[] }) {
  if (history.length === 0) {
    return (
      <div className="history-empty">
        <p>No score history yet for this wallet.</p>
        <p className="history-empty-hint">Past lookups during this server session will appear here.</p>
      </div>
    )
  }

  return (
    <ul className="history-list">
      {history.map((entry, i) => (
        <li key={i} className="history-item">
          <div className="history-item-header">
            <span className="history-item-index">#{history.length - i}</span>
            <span className="history-item-score">{entry.score}</span>
          </div>
          <div className="history-item-signals">
            {Object.entries(entry.signals).map(([key, value]) => (
              <SignalBar key={key} signalKey={key} value={value as number} />
            ))}
          </div>
        </li>
      ))}
    </ul>
  )
}

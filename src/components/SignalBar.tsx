const SIGNAL_LABELS: Record<string, string> = {
  walletAge: 'Wallet Age',
  transactionCount: 'Transaction Count',
  tokenHoldingBehavior: 'Token Holding Behavior',
  smartContractInteractions: 'Smart Contract Interactions',
  transactionTimingPatterns: 'Transaction Timing Patterns',
}

function signalColor(ratio: number): string {
  const pct = ratio * 100
  if (pct >= 70) return 'var(--accent)'
  if (pct >= 40) return 'var(--warning)'
  return 'var(--danger)'
}

function fmtWeighted(v: number): string {
  const s = v.toFixed(1)
  return s.endsWith('.0') ? s.slice(0, -2) : s
}

interface SignalValue {
  score: number
  weighted: number
  maxWeight: number
}

interface SignalBarProps {
  signalKey: string
  value: SignalValue
  metadataLabel?: string
}

export function SignalBar({ signalKey, value, metadataLabel }: SignalBarProps) {
  const ratio = value.weighted / value.maxWeight
  const color = signalColor(ratio)
  const fillPct = Math.min(100, Math.max(0, ratio * 100))
  const label = `${fmtWeighted(value.weighted)}/${value.maxWeight}`

  return (
    <div className="signal-bar">
      <div className="signal-bar-header">
        <div className="signal-bar-label-group">
          <span className="signal-bar-label">{SIGNAL_LABELS[signalKey] ?? signalKey}</span>
          {metadataLabel && (
            <span className="signal-bar-meta">{metadataLabel}</span>
          )}
        </div>
        <span className="signal-bar-value" style={{ color }}>
          {label}
        </span>
      </div>
      <div className="signal-bar-track">
        <div
          className="signal-bar-fill"
          style={{ width: `${fillPct}%`, background: color }}
        />
      </div>
    </div>
  )
}

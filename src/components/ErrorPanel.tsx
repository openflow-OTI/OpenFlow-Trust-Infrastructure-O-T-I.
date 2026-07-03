interface ErrorPanelProps {
  title: string
  message: string
  tone?: 'danger' | 'warning'
}

export function ErrorPanel({ title, message, tone = 'danger' }: ErrorPanelProps) {
  return (
    <div className={`error-panel error-panel-${tone}`} role="alert">
      <h3 className="error-panel-title">{title}</h3>
      <p className="error-panel-message">{message}</p>
    </div>
  )
}

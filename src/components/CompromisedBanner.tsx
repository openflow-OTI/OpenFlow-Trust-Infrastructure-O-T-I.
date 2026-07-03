export function CompromisedBanner({ reason, reportedAt }: { reason: string; reportedAt: string }) {
  return (
    <div className="compromised-banner" role="alert">
      <div className="compromised-banner-badge">COMPROMISED</div>
      <p className="compromised-banner-reason">{reason}</p>
      <p className="compromised-banner-meta">Reported {new Date(reportedAt).toLocaleString()}</p>
    </div>
  )
}

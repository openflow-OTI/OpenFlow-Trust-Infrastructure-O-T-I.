import { Link } from 'react-router-dom'
import { Logo } from './Logo'
import { useHealth } from '@/hooks/useHealth'

export function Navbar() {
  const health = useHealth()

  const dotState: 'loading' | 'online' | 'offline' =
    health.isLoading ? 'loading' : health.isSuccess ? 'online' : 'offline'

  return (
    <header className="navbar">
      <Link to="/" className="navbar-brand">
        <div className="navbar-top-row">
          <Logo size={44} />
          <strong className="navbar-title">OTI</strong>
        </div>
        <span className="navbar-subtitle">OpenFlow Trust Infrastructure</span>
      </Link>

      <div
        className={`navbar-status-dot navbar-status-dot--${dotState}`}
        title={dotState === 'online' ? 'API online' : dotState === 'offline' ? 'API offline' : ''}
        role="status"
        aria-live="polite"
      >
        <span className="sr-only">
          {dotState === 'online' ? 'API online' : dotState === 'offline' ? 'API offline' : 'Checking API status…'}
        </span>
      </div>
    </header>
  )
}

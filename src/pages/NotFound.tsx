import { Link } from 'react-router-dom'

export function NotFound() {
  return (
    <div className="not-found-page">
      <h1>404</h1>
      <p>That page doesn't exist.</p>
      <Link to="/" className="results-back">
        &larr; Back to home
      </Link>
    </div>
  )
}

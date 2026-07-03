import { useHealth } from '@/hooks/useHealth'

function App() {
  const { data, error, isLoading, isFetching } = useHealth()

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        fontFamily: 'system-ui, sans-serif',
        background: '#0b0f14',
        color: '#e6edf3',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      <h1 style={{ margin: 0, color: '#e6edf3', fontSize: '2rem' }}>
        OTI — OpenFlow Trust Infrastructure
      </h1>
      <p style={{ margin: 0, color: '#8b949e' }}>
        Frontend foundation smoke test — live call to{' '}
        <code>GET /api/healthz</code>
      </p>

      <div
        style={{
          marginTop: '1rem',
          padding: '1.25rem 2rem',
          borderRadius: '0.75rem',
          border: '1px solid #30363d',
          background: '#161b22',
          minWidth: '260px',
        }}
      >
        {isLoading && <span>Checking API status…</span>}

        {error && (
          <span style={{ color: '#f85149' }}>
            API unreachable: {error.message}
          </span>
        )}

        {data && (
          <span style={{ color: '#3fb950' }}>
            API status: <strong>{data.status}</strong>
            {isFetching && ' (refreshing…)'}
          </span>
        )}
      </div>
    </main>
  )
}

export default App

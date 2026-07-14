import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { worFetch } from '@/lib/worClient'

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
    }
  }
}

type Step = 1 | 2 | 3

type ResultState =
  | { kind: 'success' }
  | { kind: 'error'; code: number; message: string }

export function Report() {
  const [searchParams]                     = useSearchParams()
  const prefill                            = searchParams.get('address') ?? ''

  const [step, setStep]                    = useState<Step>(1)
  const [address, setAddress]              = useState(prefill)
  const [challengeMessage, setChallengeMessage] = useState('')
  const [signature, setSignature]          = useState('')
  const [passkey, setPasskey]              = useState('')
  const [loading, setLoading]              = useState(false)
  const [error, setError]                  = useState<string | null>(null)
  const [result, setResult]                = useState<ResultState | null>(null)
  const [showConfirm, setShowConfirm]      = useState(false)

  function clearError() { setError(null) }

  // ── Step 1: check status ─────────────────────────────────────────────────
  async function handleAddressSubmit(e: React.FormEvent) {
    e.preventDefault()
    const addr = address.trim()
    if (!addr) return
    setLoading(true)
    setError(null)
    try {
      const { data, status } = await worFetch<{ status?: string }>(
        `/wallet/registration-status/${encodeURIComponent(addr)}`
      )
      if (status === 404 || data.status === 'not_registered' || !data.status) {
        setError(
          'This address is not registered with OTI. You must register first to enable self-reporting.'
        )
        return
      }
      if (data.status === 'compromised') {
        setError('This wallet is already flagged as compromised in OTI.')
        return
      }
      // status === 'active' → fetch challenge and go to step 2
      await loadChallenge(addr)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check registration status.')
    } finally {
      setLoading(false)
    }
  }

  // ── Step 2a: fetch challenge ─────────────────────────────────────────────
  async function loadChallenge(addr: string) {
    const { data } = await worFetch<{ message?: string }>(
      `/wallet/register/challenge?address=${encodeURIComponent(addr)}&chain_family=evm`
    )
    if (!data.message) throw new Error('No challenge message returned from server.')
    setChallengeMessage(data.message)
    setStep(2)
  }

  // ── Step 2b: sign with MetaMask ──────────────────────────────────────────
  async function handleSign() {
    if (!window.ethereum) {
      setError('MetaMask not detected. Please install MetaMask and try again.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const accounts = (await window.ethereum.request({
        method: 'eth_requestAccounts',
      })) as string[]
      if (!accounts || accounts.length === 0) throw new Error('No accounts available in MetaMask.')

      const sig = (await window.ethereum.request({
        method: 'personal_sign',
        params: [challengeMessage, accounts[0]],
      })) as string

      setSignature(sig)
    } catch (err: unknown) {
      const e = err as { code?: number; message?: string }
      if (e?.code === 4001) {
        setError('Signature request was rejected.')
      } else {
        setError(e?.message ?? 'Failed to sign message.')
      }
    } finally {
      setLoading(false)
    }
  }

  // ── Step 2c: open confirm dialog (after passkey + signature ready) ───────
  function handleProceed(e: React.FormEvent) {
    e.preventDefault()
    if (!passkey) { setError('Enter your passkey.'); return }
    if (!signature) { setError('You must sign the message with MetaMask first.'); return }
    setShowConfirm(true)
  }

  // ── Step 2d: confirmed — submit report ───────────────────────────────────
  async function handleConfirmedSubmit() {
    setShowConfirm(false)
    setLoading(true)
    setError(null)
    try {
      const { status, data } = await worFetch('/report/compromised', {
        method: 'POST',
        body: JSON.stringify({
          address: address.trim(),
          message: challengeMessage,
          signature,
          passkey,
        }),
      })
      if (status === 200 || status === 201) {
        setResult({ kind: 'success' })
        setStep(3)
      } else if (status === 401) {
        setResult({ kind: 'error', code: 401, message: 'Verification failed. Check your passkey and try again.' })
        setStep(3)
      } else if (status === 404) {
        setResult({ kind: 'error', code: 404, message: 'Address not registered. Register first to enable self-reporting.' })
        setStep(3)
      } else if (status === 409) {
        setResult({ kind: 'error', code: 409, message: 'Already flagged.' })
        setStep(3)
      } else {
        const d = data as { error?: string; message?: string }
        setResult({ kind: 'error', code: status, message: d.error ?? d.message ?? `Unexpected error (${status}).` })
        setStep(3)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Report submission failed.')
    } finally {
      setLoading(false)
    }
  }

  // ── Step 3: result ───────────────────────────────────────────────────────
  if (step === 3 && result) {
    return (
      <div className="wor-page">
        <p className="wor-step-indicator">Step 3 of 3</p>
        <div className={`wor-card ${result.kind === 'success' ? 'wor-card--success' : 'wor-card--danger'}`}>
          {result.kind === 'success' ? (
            <>
              <div className="wor-success-icon">⚑</div>
              <h2 className="wor-card-title">Wallet Flagged</h2>
              <p className="wor-card-desc">
                Your wallet has been flagged as compromised. Anyone checking this wallet on OTI
                will now see a warning.
              </p>
              <Link to="/score" className="wor-btn wor-btn--ghost" style={{ textAlign: 'center' }}>
                ← Back to Score
              </Link>
            </>
          ) : (
            <>
              <div className="wor-danger-icon">✕</div>
              <h2 className="wor-card-title">Report Failed</h2>
              <p className="wor-card-desc">{result.message}</p>
              {result.code === 404 && (
                <Link to="/register" className="wor-link" style={{ textAlign: 'center' }}>
                  Register your wallet →
                </Link>
              )}
              <button
                className="wor-btn wor-btn--ghost"
                onClick={() => { setStep(2); setResult(null); clearError() }}
              >
                ← Try Again
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="wor-page">
      <p className="wor-step-indicator">Step {step} of 3</p>

      {/* ── Step 1 ── */}
      {step === 1 && (
        <div className="wor-card">
          <h2 className="wor-card-title">Report a Compromised Wallet</h2>
          <p className="wor-card-desc">
            If your wallet has been stolen or hacked, flag it here. OTI will immediately show a
            compromised warning on every future score check for this address.
          </p>
          <form onSubmit={handleAddressSubmit} className="wor-form">
            <div className="wor-form-field">
              <label className="wor-form-label">Wallet Address</label>
              <input
                className="wor-input"
                placeholder="0x… or wallet address"
                value={address}
                onChange={e => { setAddress(e.target.value); clearError() }}
                required
                autoFocus={!prefill}
              />
            </div>
            {error && (
              <p className="wor-error">
                {error}
                {error.includes('register first') && (
                  <>{' '}<Link to="/register" className="wor-link">Register →</Link></>
                )}
              </p>
            )}
            <button className="wor-btn" type="submit" disabled={loading}>
              {loading ? 'Checking…' : 'Continue →'}
            </button>
          </form>
          <p className="wor-card-footer">
            Not registered?{' '}
            <Link to="/register" className="wor-link">Register your wallet first →</Link>
          </p>
        </div>
      )}

      {/* ── Step 2 ── */}
      {step === 2 && (
        <div className="wor-card">
          <h2 className="wor-card-title">Verify &amp; Report</h2>
          <p className="wor-card-desc">
            Sign the message below with MetaMask to confirm ownership, then enter your passkey.
            You will always see the exact message before signing.
          </p>

          <div className="wor-form-field">
            <label className="wor-form-label">Message to Sign</label>
            <div className="wor-message-box">{challengeMessage}</div>
          </div>

          <div className="wor-sign-row">
            <button
              className={`wor-btn wor-btn--sign${signature ? ' wor-btn--signed' : ''}`}
              type="button"
              onClick={handleSign}
              disabled={loading || Boolean(signature)}
            >
              {loading ? 'Waiting for MetaMask…' : signature ? '✓ Signed' : '🦊 Sign with MetaMask'}
            </button>
            {signature && <span className="wor-signed-note">Message signed successfully.</span>}
          </div>

          <form onSubmit={handleProceed} className="wor-form" style={{ marginTop: '0.25rem' }}>
            <div className="wor-form-field">
              <label className="wor-form-label">Passkey</label>
              <input
                className="wor-input"
                type="password"
                placeholder="Your registration passkey"
                value={passkey}
                onChange={e => { setPasskey(e.target.value); clearError() }}
                autoComplete="current-password"
              />
            </div>
            {error && <p className="wor-error">{error}</p>}
            <button
              className="wor-btn wor-btn--danger-action"
              type="submit"
              disabled={loading}
            >
              Report as Compromised →
            </button>
            <button
              type="button"
              className="wor-btn wor-btn--ghost"
              onClick={() => { setStep(1); setSignature(''); setPasskey(''); clearError() }}
              disabled={loading}
            >
              ← Back
            </button>
          </form>
        </div>
      )}

      {/* ── Confirm dialog ── */}
      {showConfirm && (
        <div className="wor-confirm-overlay" onClick={() => setShowConfirm(false)}>
          <div className="wor-confirm-modal" onClick={e => e.stopPropagation()}>
            <h3 className="wor-confirm-title">⚑ Confirm Report</h3>
            <p className="wor-confirm-text">
              This will immediately flag your wallet as compromised across OTI. All future score
              checks will show a compromised warning.
            </p>
            <p className="wor-confirm-text wor-confirm-text--warn">
              This cannot be undone by you — only an admin can reverse it. Are you sure?
            </p>
            <div className="wor-confirm-actions">
              <button
                className="wor-btn wor-btn--ghost"
                onClick={() => setShowConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="wor-btn wor-btn--danger-action"
                onClick={handleConfirmedSubmit}
              >
                Yes, Flag This Wallet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { worFetch } from '@/lib/worClient'

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
    }
  }
}

type Step = 1 | 2 | 3

export function Register() {
  const [step, setStep]                   = useState<Step>(1)
  const [address, setAddress]             = useState('')
  const [challengeMessage, setChallengeMessage] = useState('')
  const [signature, setSignature]         = useState('')
  const [passkey, setPasskey]             = useState('')
  const [confirmPasskey, setConfirmPasskey] = useState('')
  const [loading, setLoading]             = useState(false)
  const [error, setError]                 = useState<string | null>(null)
  const [success, setSuccess]             = useState(false)

  function clearError() { setError(null) }

  // ── Step 1: check registration status ───────────────────────────────────
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
      if (status === 200 && (data.status === 'active' || data.status === 'compromised')) {
        setError('This address is already registered.')
        return
      }
      // not_registered or 404 → get challenge
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
      setStep(3)
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

  // ── Step 3: submit registration ──────────────────────────────────────────
  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (passkey.length < 8) { setError('Passkey must be at least 8 characters.'); return }
    if (passkey !== confirmPasskey) { setError('Passkeys do not match.'); return }
    setLoading(true)
    setError(null)
    try {
      const { status, data } = await worFetch('/wallet/register', {
        method: 'POST',
        body: JSON.stringify({
          address: address.trim(),
          chain_family: 'evm',
          message: challengeMessage,
          signature,
          passkey,
        }),
      })
      if (status === 201) {
        setSuccess(true)
      } else if (status === 409) {
        setError('Already registered.')
      } else {
        const d = data as { error?: string; message?: string }
        setError(d.error ?? d.message ?? `Unexpected error (${status}).`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  // ── Success state ────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="wor-page">
        <div className="wor-card wor-card--success">
          <div className="wor-success-icon">✓</div>
          <h2 className="wor-card-title">Wallet Registered</h2>
          <p className="wor-card-desc">
            Your wallet is registered. If it's ever compromised, visit{' '}
            <Link to="/report" className="wor-link">/report</Link> to flag it instantly.
          </p>
          <Link to="/score" className="wor-btn wor-btn--ghost" style={{ textAlign: 'center' }}>
            ← Score a Wallet
          </Link>
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
          <h2 className="wor-card-title">Register Your Wallet</h2>
          <p className="wor-card-desc">
            Link your wallet to OTI so you can self-report it as compromised if it's ever stolen or hacked.
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
                autoFocus
              />
            </div>
            {error && <p className="wor-error">{error}</p>}
            <button className="wor-btn" type="submit" disabled={loading}>
              {loading ? 'Checking…' : 'Continue →'}
            </button>
          </form>
          <p className="wor-card-footer">
            Already registered?{' '}
            <Link to="/report" className="wor-link">Report a compromised wallet →</Link>
          </p>
        </div>
      )}

      {/* ── Step 2 ── */}
      {step === 2 && (
        <div className="wor-card">
          <h2 className="wor-card-title">Sign the Challenge</h2>
          <p className="wor-card-desc">
            Sign the message below with MetaMask to prove ownership of this wallet. You will
            always see the exact message before signing.
          </p>
          <div className="wor-form-field">
            <label className="wor-form-label">Message to Sign</label>
            <div className="wor-message-box">{challengeMessage}</div>
          </div>
          {error && <p className="wor-error">{error}</p>}
          <button className="wor-btn" onClick={handleSign} disabled={loading}>
            {loading ? 'Waiting for MetaMask…' : '🦊 Sign with MetaMask'}
          </button>
          <button
            className="wor-btn wor-btn--ghost"
            type="button"
            onClick={() => { setStep(1); clearError() }}
            disabled={loading}
          >
            ← Back
          </button>
        </div>
      )}

      {/* ── Step 3 ── */}
      {step === 3 && (
        <div className="wor-card">
          <h2 className="wor-card-title">Set a Passkey</h2>
          <p className="wor-card-desc">
            Your passkey will be required to self-report this wallet as compromised in the future.
            Store it somewhere safe — OTI cannot recover it for you.
          </p>
          <form onSubmit={handleRegister} className="wor-form">
            <div className="wor-form-field">
              <label className="wor-form-label">Passkey</label>
              <input
                className="wor-input"
                type="password"
                placeholder="Min. 8 characters"
                value={passkey}
                onChange={e => { setPasskey(e.target.value); clearError() }}
                required
                autoFocus
                autoComplete="new-password"
              />
            </div>
            <div className="wor-form-field">
              <label className="wor-form-label">Confirm Passkey</label>
              <input
                className="wor-input"
                type="password"
                placeholder="Repeat your passkey"
                value={confirmPasskey}
                onChange={e => { setConfirmPasskey(e.target.value); clearError() }}
                required
                autoComplete="new-password"
              />
            </div>
            {error && <p className="wor-error">{error}</p>}
            <button className="wor-btn" type="submit" disabled={loading}>
              {loading ? 'Registering…' : 'Register Wallet'}
            </button>
            <button
              type="button"
              className="wor-btn wor-btn--ghost"
              onClick={() => { setStep(2); clearError() }}
              disabled={loading}
            >
              ← Back
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { CHAINS, EVM_CHAINS, NON_EVM_CHAINS } from '@/lib/chains'
import { validateAddress } from '@/lib/validateAddress'

export function WalletForm() {
  const navigate = useNavigate()
  const [address, setAddress] = useState('')
  const [chain, setChain] = useState(CHAINS[0].id)
  const [formError, setFormError] = useState<string | null>(null)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()

    const validationError = validateAddress(address, chain)
    if (validationError) {
      setFormError(validationError)
      return
    }

    setFormError(null)
    navigate(`/wallet/${chain}/${encodeURIComponent(address.trim())}`)
  }

  return (
    <form className="wallet-form" onSubmit={handleSubmit} noValidate>
      <label className="wallet-form-label" htmlFor="address">
        Wallet address
      </label>
      <input
        id="address"
        className="wallet-form-input"
        type="text"
        placeholder="0x… or wallet address"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        autoComplete="off"
        spellCheck={false}
      />

      <label className="wallet-form-label" htmlFor="chain">
        Chain
      </label>
      <select
        id="chain"
        className="wallet-form-select"
        value={chain}
        onChange={(e) => setChain(e.target.value)}
      >
        <optgroup label="EVM">
          {EVM_CHAINS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </optgroup>
        <optgroup label="Non-EVM">
          {NON_EVM_CHAINS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </optgroup>
      </select>

      {formError && <p className="wallet-form-error">{formError}</p>}

      <button type="submit" className="wallet-form-submit">
        Check trust score
      </button>
    </form>
  )
}

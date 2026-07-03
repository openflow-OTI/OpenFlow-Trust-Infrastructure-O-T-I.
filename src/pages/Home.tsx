import { WalletForm } from '@/components/WalletForm'

export function Home() {
  return (
    <div className="home-page">
      <div className="home-intro">
        <h1 className="home-title">Score any wallet's on-chain trust.</h1>
        <p className="home-subtitle">
          Paste a wallet address, pick a chain, get a 0–100 trust score backed by five
          on-chain signals. Free, no login required.
        </p>
      </div>
      <div className="home-form-card">
        <WalletForm />
      </div>
      <p className="home-rate-note">
        Anonymous lookups are limited to 3 per day. Choose your wallet carefully.
      </p>
    </div>
  )
}

import { useSearchParams } from 'react-router-dom'
import { WalletForm } from '@/components/WalletForm'
import { useScore } from '@/hooks/useScore'
import { getChainInfo } from '@/lib/chains'
import { friendlyErrorMessage } from '@/lib/apiError'
import { formatMetadataLabel } from '@/lib/formatMetadata'
import { ScoreGauge } from '@/components/ScoreGauge'
import { SignalBar } from '@/components/SignalBar'
import { CompromisedBanner } from '@/components/CompromisedBanner'
import { CachedBadge } from '@/components/CachedBadge'
import { ErrorPanel } from '@/components/ErrorPanel'
import { LoadingPanel } from '@/components/LoadingPanel'

export function Home() {
  const [searchParams, setSearchParams] = useSearchParams()
  const wallet = searchParams.get('wallet') ?? ''
  const chain = searchParams.get('chain') ?? ''

  const hasQuery = Boolean(wallet && chain)
  const chainInfo = getChainInfo(chain)

  const scoreQuery = useScore(wallet, chain)

  function handleSearch(address: string, selectedChain: string) {
    setSearchParams({ wallet: address, chain: selectedChain })
  }

  function handleClear() {
    setSearchParams({})
  }

  if (!hasQuery) {
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
          <WalletForm onSubmit={handleSearch} />
        </div>
        <p className="home-rate-note">
          Anonymous lookups are limited to 3 per day. Choose your wallet carefully.
        </p>
      </div>
    )
  }

  return (
    <div className="results-page">
      <div className="results-header">
        <button className="results-back" onClick={handleClear}>
          &larr; Score another wallet
        </button>
        <div className="results-target">
          <span className="results-address">{wallet}</span>
          <span className="results-chain">{chainInfo?.label ?? chain}</span>
        </div>
      </div>

      {scoreQuery.isLoading && <LoadingPanel label="Computing trust score…" />}

      {scoreQuery.isError &&
        (() => {
          const { title, message } = friendlyErrorMessage(scoreQuery.error)
          return <ErrorPanel title={title} message={message} />
        })()}

      {scoreQuery.isSuccess && scoreQuery.data && (
        <div className="results-body">
          {scoreQuery.data.compromised ? (
            <CompromisedBanner
              reason={scoreQuery.data.reason}
              reportedAt={scoreQuery.data.reported_at}
            />
          ) : (
            <>
              <div className="results-score-card">
                <ScoreGauge score={scoreQuery.data.score} />
                {scoreQuery.data.cached && <CachedBadge />}
              </div>

              <div className="results-signals">
                {Object.entries(scoreQuery.data.signals).map(([key, value]) => (
                  <SignalBar
                    key={key}
                    signalKey={key}
                    value={value as number}
                    metadataLabel={
                      scoreQuery.data &&
                      !scoreQuery.data.compromised &&
                      scoreQuery.data.metadata
                        ? formatMetadataLabel(key, scoreQuery.data.metadata)
                        : undefined
                    }
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

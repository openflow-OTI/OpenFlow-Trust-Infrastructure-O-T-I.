import { useState } from 'react'

interface ShareButtonProps {
  wallet: string
  chain: string
}

export function ShareButton({ wallet, chain }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    if (copied) return
    const url = `https://otiscore.vercel.app/?wallet=${encodeURIComponent(wallet)}&chain=${encodeURIComponent(chain)}`
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      const el = document.createElement('textarea')
      el.value = url
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      className="share-btn"
      onClick={handleShare}
      aria-label="Share score"
    >
      <span className="share-btn-icon">{copied ? '✓' : '↗'}</span>
      {copied ? 'Copied!' : 'Share'}
    </button>
  )
}

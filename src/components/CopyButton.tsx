import { useState, useCallback } from 'react'

interface CopyButtonProps {
  value?: string | null
  label?: string          // optional text label beside the icon
  className?: string      // allow caller to override styling
}

export function CopyButton({ value, label, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)
  const safe = (value ?? '').trim()

  const handleCopy = useCallback(() => {
    if (!safe) return
    navigator.clipboard.writeText(safe).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {
      const el = document.createElement('textarea')
      el.value = safe
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [safe])

  if (!safe) return null

  return (
    <button
      className={className ?? 'admin-copy-btn'}
      onClick={handleCopy}
      title={copied ? 'Copied!' : 'Copy to clipboard'}
      type="button"
    >
      {copied ? '✓' : label ? `⧉ ${label}` : '⧉'}
    </button>
  )
}

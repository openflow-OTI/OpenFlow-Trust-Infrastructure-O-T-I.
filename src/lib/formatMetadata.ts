import type { ScoreMetadata } from './types'

export function formatMetadataLabel(signalKey: string, metadata: ScoreMetadata): string {
  const n = (v: number) => v.toLocaleString()
  switch (signalKey) {
    case 'walletAge':
      return `${n(metadata.walletAgedays)} days`
    case 'transactionCount':
      return `${n(metadata.txCount)} transactions`
    case 'tokenHoldingBehavior':
      return `${n(metadata.uniqueTokens)} unique tokens`
    case 'smartContractInteractions':
      return metadata.contractInteractions > 0
        ? 'interacted with contracts'
        : 'no contract interactions'
    case 'transactionTimingPatterns':
      return `${n(metadata.internalTxCount)} internal txs`
    default:
      return ''
  }
}

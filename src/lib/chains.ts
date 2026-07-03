export type ChainFamily = 'evm' | 'ton' | 'solana' | 'sui' | 'bitcoin' | 'tron'

export interface ChainInfo {
  id: string
  label: string
  family: ChainFamily
}

export const CHAINS: ChainInfo[] = [
  { id: 'ethereum', label: 'Ethereum', family: 'evm' },
  { id: 'bsc', label: 'BNB Smart Chain', family: 'evm' },
  { id: 'polygon', label: 'Polygon', family: 'evm' },
  { id: 'arbitrum', label: 'Arbitrum', family: 'evm' },
  { id: 'optimism', label: 'Optimism', family: 'evm' },
  { id: 'base', label: 'Base', family: 'evm' },
  { id: 'avalanche', label: 'Avalanche', family: 'evm' },
  { id: 'fantom', label: 'Fantom', family: 'evm' },
  { id: 'linea', label: 'Linea', family: 'evm' },
  { id: 'zksync', label: 'zkSync', family: 'evm' },
  { id: 'ton', label: 'TON', family: 'ton' },
  { id: 'solana', label: 'Solana', family: 'solana' },
  { id: 'sui', label: 'Sui', family: 'sui' },
  { id: 'bitcoin', label: 'Bitcoin', family: 'bitcoin' },
  { id: 'tron', label: 'Tron', family: 'tron' },
]

export const EVM_CHAINS = CHAINS.filter((c) => c.family === 'evm')
export const NON_EVM_CHAINS = CHAINS.filter((c) => c.family !== 'evm')

export function getChainInfo(id: string): ChainInfo | undefined {
  return CHAINS.find((c) => c.id === id)
}

export function isKnownChain(id: string): boolean {
  return CHAINS.some((c) => c.id === id)
}

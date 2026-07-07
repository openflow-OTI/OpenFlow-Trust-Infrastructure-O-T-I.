import NetworkEthereum from '@web3icons/react/icons/networks/NetworkEthereum'
import NetworkBinanceSmartChain from '@web3icons/react/icons/networks/NetworkBinanceSmartChain'
import NetworkPolygon from '@web3icons/react/icons/networks/NetworkPolygon'
import NetworkArbitrumOne from '@web3icons/react/icons/networks/NetworkArbitrumOne'
import NetworkOptimism from '@web3icons/react/icons/networks/NetworkOptimism'
import NetworkBase from '@web3icons/react/icons/networks/NetworkBase'
import NetworkAvalanche from '@web3icons/react/icons/networks/NetworkAvalanche'
import NetworkFantom from '@web3icons/react/icons/networks/NetworkFantom'
import NetworkLinea from '@web3icons/react/icons/networks/NetworkLinea'
import NetworkZksync from '@web3icons/react/icons/networks/NetworkZksync'
import NetworkTon from '@web3icons/react/icons/networks/NetworkTon'
import NetworkSolana from '@web3icons/react/icons/networks/NetworkSolana'
import NetworkSui from '@web3icons/react/icons/networks/NetworkSui'
import NetworkBitcoin from '@web3icons/react/icons/networks/NetworkBitcoin'
import NetworkTron from '@web3icons/react/icons/networks/NetworkTron'
import type { ComponentType } from 'react'
import type { IconComponentProps } from '@web3icons/react'

const CHAIN_ICON_MAP: Record<string, ComponentType<IconComponentProps>> = {
  ethereum: NetworkEthereum,
  bsc: NetworkBinanceSmartChain,
  polygon: NetworkPolygon,
  arbitrum: NetworkArbitrumOne,
  optimism: NetworkOptimism,
  base: NetworkBase,
  avalanche: NetworkAvalanche,
  fantom: NetworkFantom,
  linea: NetworkLinea,
  zksync: NetworkZksync,
  ton: NetworkTon,
  solana: NetworkSolana,
  sui: NetworkSui,
  bitcoin: NetworkBitcoin,
  tron: NetworkTron,
}

interface ChainIconProps {
  chainId: string
  size?: number
  className?: string
}

export function ChainIcon({ chainId, size = 20, className }: ChainIconProps) {
  const Icon = CHAIN_ICON_MAP[chainId]

  if (!Icon) {
    return (
      <span
        className={`chain-icon-fallback ${className ?? ''}`}
        style={{ width: size, height: size }}
        aria-hidden="true"
      />
    )
  }

  // zkSync and Linea branded icons are near-black/dark and invisible on the dark UI bg.
  // "mono" variant renders them in a light/white form that stays readable.
  const MONO_CHAINS = new Set(['zksync', 'linea'])
  const variant = MONO_CHAINS.has(chainId) ? 'mono' : 'branded'

  return <Icon variant={variant} size={size} className={className} />
}

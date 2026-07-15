import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { ScanLine, ShieldCheck, Code2, FileText, Clock } from 'lucide-react'
import { MarketingNavbar } from '@/components/marketing/MarketingNavbar'
import { MarketingFooter } from '@/components/marketing/MarketingFooter'

interface ServiceCard {
  icon: LucideIcon
  title: string
  body: string
  actions: { label: string; to?: string; href?: string; variant: 'primary' | 'outline'; comingSoon?: boolean }[]
  comingSoon?: boolean
}

const SERVICES: ServiceCard[] = [
  {
    icon: ScanLine,
    title: 'Score a Wallet',
    body: 'Check the trust score for any wallet across 15 chains.',
    actions: [{ label: 'Open Scorer', to: '/score', variant: 'primary' }],
  },
  {
    icon: ShieldCheck,
    title: 'Wallet Ownership Registry',
    body: 'Register your wallet or report a compromise.',
    actions: [
      { label: 'Register →', to: '/register', variant: 'primary' },
      { label: 'Report →', to: '/report', variant: 'outline' },
    ],
  },
  {
    icon: Code2,
    title: 'API for Developers',
    body: 'Integrate OTI trust scoring into your platform.',
    actions: [{ label: 'View Docs', href: '/docs/', variant: 'primary' }],
  },
  {
    icon: FileText,
    title: 'Whitepaper',
    body: 'Read the technical and business documentation.',
    actions: [{ label: 'Read', to: '/whitepaper', variant: 'primary' }],
  },
  {
    icon: Clock,
    title: 'Coming Soon',
    body: 'More services launching soon.',
    actions: [{ label: 'Coming Soon', variant: 'outline' }],
    comingSoon: true,
  },
]

export function Services() {
  return (
    <div className="marketing-page">
      <MarketingNavbar />

      <section className="marketing-section marketing-services-hero">
        <div className="marketing-container">
          <h1 className="marketing-services-heading">Everything OTI</h1>
          <p className="marketing-services-sub">Choose where to go.</p>
        </div>
      </section>

      <section className="marketing-section" style={{ paddingTop: 0 }}>
        <div className="marketing-container">
          <div className="marketing-services-grid">
            {SERVICES.map((s) => (
              <div
                key={s.title}
                className={`marketing-service-card ${s.comingSoon ? 'marketing-service-card--soon' : ''}`}
              >
                <s.icon className="marketing-service-icon" aria-hidden="true" />
                <h2 className="marketing-service-title">{s.title}</h2>
                <p className="marketing-service-body">{s.body}</p>
                <div className="marketing-service-actions">
                  {s.actions.map((a) =>
                    a.comingSoon || (!a.to && !a.href) ? (
                      <button
                        key={a.label}
                        type="button"
                        className={`marketing-btn marketing-btn--${a.variant} marketing-btn--sm`}
                        disabled
                      >
                        {a.label}
                      </button>
                    ) : a.href ? (
                      <a
                        key={a.label}
                        href={a.href}
                        className={`marketing-btn marketing-btn--${a.variant} marketing-btn--sm`}
                      >
                        {a.label}
                      </a>
                    ) : (
                      <Link
                        key={a.label}
                        to={a.to as string}
                        className={`marketing-btn marketing-btn--${a.variant} marketing-btn--sm`}
                      >
                        {a.label}
                      </Link>
                    ),
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  )
}

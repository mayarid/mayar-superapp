import { SiteFooter } from "@/components/marketing/site-footer"
import { SiteHeader } from "@/components/marketing/site-header"
import type { ReactNode } from "react"

/**
 * The shell all eight landing pages share.
 *
 * Only the chrome is shared. What sits between the header and the footer is
 * chosen per model, because the whole point of these pages is that eight ways
 * of billing do not look alike.
 */
export function MarketingLayout({
  children,
  ctaLabel,
}: {
  children: ReactNode
  ctaLabel: string
}) {
  return (
    <>
      <SiteHeader cta={{ label: ctaLabel, href: "#checkout" }} />
      <main>{children}</main>
      <SiteFooter />
    </>
  )
}

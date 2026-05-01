import type { LucideIcon } from 'lucide-react'
import { Building2, Handshake, Home, Landmark, Settings, Wallet } from 'lucide-react'

import type { OrganizationRow } from '@/lib/organizations/organization-types'

export type OrgNavItem = {
  label: string
  href: string
  icon: LucideIcon
  /** When set, link highlights for any pathname under `/org/[id]/…`. */
  orgScopeHighlightId?: string
}

export type OrgNavSection = {
  heading: string
  items: OrgNavItem[]
}

/** Nav links under `/org/:orgId/...`. Membership/RBAC will gate these later. */
export function getOrgNavSections(orgId: string): OrgNavSection[] {
  const base = `/org/${orgId}`
  return [
    {
      heading: 'Organization',
      items: [
        { label: 'Dashboard', href: `${base}/dashboard`, icon: Home },
        { label: 'Escrows', href: `${base}/escrows`, icon: Handshake },
        { label: 'Wallet', href: `${base}/wallet`, icon: Landmark },
        { label: 'Settings', href: `${base}/settings`, icon: Settings },
      ],
    },
    {
      heading: 'Account',
      items: [{ label: 'Personal workspace', href: '/dashboard', icon: Wallet }],
    },
  ]
}

/** Quick links to each org workspace (dashboard). Insert between primary org nav and Account when non-empty. */
export function getOrgSwitcherSection(orgs: OrganizationRow[]): OrgNavSection | null {
  if (orgs.length === 0) return null
  return {
    heading: 'Organizations',
    items: orgs.map((o) => ({
      label: o.name,
      href: `/org/${o.id}/dashboard`,
      icon: Building2,
      orgScopeHighlightId: o.id,
    })),
  }
}

export function mergeOrgSidebarSections(orgId: string, orgs: OrganizationRow[]): OrgNavSection[] {
  const primary = getOrgNavSections(orgId)
  const switcher = getOrgSwitcherSection(orgs)
  if (!switcher) return primary
  return [primary[0], switcher, primary[1]]
}

export function isOrgNavActive(pathname: string, href: string): boolean {
  if (!href.startsWith('/org/')) {
    return pathname === href
  }
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function isOrgSidebarItemActive(pathname: string, item: OrgNavItem): boolean {
  if (item.orgScopeHighlightId) {
    const id = item.orgScopeHighlightId
    return pathname === `/org/${id}` || pathname.startsWith(`/org/${id}/`)
  }
  return isOrgNavActive(pathname, item.href)
}

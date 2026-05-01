import type { LucideIcon } from 'lucide-react'
import {
  AlertTriangle,
  Building2,
  Handshake,
  Home,
  Landmark,
  Mail,
  ShieldCheck,
} from 'lucide-react'

import type { OrganizationRow } from '@/lib/organizations/organization-types'

export type UserNavItem = {
  label: string
  href: string
  icon: LucideIcon
  /** When set, item is active for any route under `/org/[id]/…` (org hub links). */
  orgScopeHighlightId?: string
}

export type UserNavSection = {
  heading: string
  items: UserNavItem[]
}

export const USER_NAV_CORE_SECTIONS: UserNavSection[] = [
  {
    heading: 'Overview',
    items: [{ label: 'Dashboard', href: '/dashboard', icon: Home }],
  },
  {
    heading: 'Transact',
    items: [
      { label: 'Escrows', href: '/escrows', icon: Handshake },
      { label: 'Wallet', href: '/wallet', icon: Landmark },
    ],
  },
  {
    heading: 'Trust',
    items: [
      { label: 'KYC', href: '/kyc', icon: ShieldCheck },
      { label: 'Disputes', href: '/disputes', icon: AlertTriangle },
    ],
  },
]

export const USER_NAV_ORGANIZATION_BASE_ITEMS: UserNavItem[] = [
  { label: 'Org invites', href: '/org-invites', icon: Mail },
  { label: 'Apply as business', href: '/organizations/apply', icon: Building2 },
]

/** Full sidebar sections: static org tooling plus one link per membership from `/api/me/organizations`. */
export function getUserWorkspaceNavSections(memberOrganizations: OrganizationRow[]): UserNavSection[] {
  const orgLinks: UserNavItem[] = memberOrganizations.map((org) => ({
    label: org.name,
    href: `/org/${org.id}/dashboard`,
    icon: Building2,
    orgScopeHighlightId: org.id,
  }))
  return [
    ...USER_NAV_CORE_SECTIONS,
    {
      heading: 'Organization',
      items: [...USER_NAV_ORGANIZATION_BASE_ITEMS, ...orgLinks],
    },
  ]
}

/** Used to match nested routes (e.g. /wallet/deposit active under Wallet). */
export function isNavActive(pathname: string, href: string): boolean {
  if (href === '/dashboard') {
    return pathname === '/dashboard'
  }
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function isUserNavItemActive(pathname: string, item: UserNavItem): boolean {
  if (item.orgScopeHighlightId) {
    const id = item.orgScopeHighlightId
    return pathname === `/org/${id}` || pathname.startsWith(`/org/${id}/`)
  }
  return isNavActive(pathname, item.href)
}

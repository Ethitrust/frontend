import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  Building2,
  ClipboardList,
  FileStack,
  Gavel,
  GitBranch,
  Headphones,
  Landmark,
  LayoutDashboard,
  Lock,
  Radio,
  Scale,
  ScrollText,
  Settings2,
  ShieldAlert,
  Users,
  WalletCards,
} from 'lucide-react'

export type AdminNavItem = {
  label: string
  href: string
  icon: LucideIcon
}

export type AdminNavSection = {
  heading: string
  items: AdminNavItem[]
}

export const ADMIN_NAV_SECTIONS: AdminNavSection[] = [
  {
    heading: 'Overview',
    items: [{ label: 'Dashboard', href: '/admin', icon: LayoutDashboard }],
  },
  {
    heading: 'People & verification',
    items: [
      { label: 'Users', href: '/admin/users', icon: Users },
      { label: 'Moderators', href: '/admin/moderators', icon: Users },
      { label: 'Risk flags', href: '/admin/risk-flags', icon: ShieldAlert },
      { label: 'KYC review queue', href: '/admin/kyc/review-queue', icon: ClipboardList },
      { label: 'Manual KYC', href: '/admin/kyc/submissions', icon: FileStack },
    ],
  },
  {
    heading: 'Organizations',
    items: [{ label: 'Applications', href: '/admin/organizations/applications', icon: Building2 }],
  },
  {
    heading: 'Platform',
    items: [
      { label: 'Escrows', href: '/admin/escrows', icon: Scale },
      { label: 'Disputes', href: '/admin/disputes', icon: Gavel },
      { label: 'Transactions', href: '/admin/transactions', icon: Activity },
      { label: 'Wallets', href: '/admin/wallets', icon: WalletCards },
      { label: 'Wallet locks', href: '/admin/wallet-locks', icon: Lock },
      { label: 'Fees', href: '/admin/fees', icon: Landmark },
    ],
  },
  {
    heading: 'Messaging & audits',
    items: [
      { label: 'Notification deliveries', href: '/admin/notification-deliveries', icon: Radio },
      { label: 'Domain events', href: '/admin/events', icon: GitBranch },
      { label: 'Audit log', href: '/admin/audit-logs', icon: ScrollText },
    ],
  },
  {
    heading: 'Configuration',
    items: [
      { label: 'Support cases', href: '/admin/support-cases', icon: Headphones },
      { label: 'Platform settings', href: '/admin/settings', icon: Settings2 },
    ],
  },
]

export function isAdminNavItemActive(pathname: string, item: AdminNavItem): boolean {
  if (item.href === '/admin') {
    return pathname === '/admin' || pathname === '/admin/'
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`)
}

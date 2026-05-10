import type { LucideIcon } from 'lucide-react'
import {
  ClipboardList,
  FileStack,
  Gavel,
  LayoutDashboard,
} from 'lucide-react'

export type ModeratorNavItem = {
  label: string
  href: string
  icon: LucideIcon
}

export type ModeratorNavSection = {
  heading: string
  items: ModeratorNavItem[]
}

export const MODERATOR_NAV_SECTIONS: ModeratorNavSection[] = [
  {
    heading: 'Overview',
    items: [{ label: 'Dashboard', href: '/moderator', icon: LayoutDashboard }],
  },
  {
    heading: 'Disputes',
    items: [
      { label: 'Assigned disputes', href: '/moderator/disputes/assigned', icon: Gavel },
    ],
  },
  {
    heading: 'Verification',
    items: [
      { label: 'Manual KYC', href: '/moderator/kyc/submissions', icon: FileStack },
    ],
  },
]

export function isModeratorNavItemActive(pathname: string, item: ModeratorNavItem): boolean {
  if (item.href === '/moderator') {
    return pathname === '/moderator' || pathname === '/moderator/'
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`)
}

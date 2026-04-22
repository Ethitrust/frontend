# EthiTrust Figma Page Structure and Build Plan

Source file: `https://www.figma.com/design/4RVydhCjqreiuSv1dqAmGi/Ethitrust?node-id=0-1&t=mzafo8KxXjipbbcK-0`

## 1) Top-level page inventory (Figma frame map)

1. `2:4271` - EthiTrust Landing Page
2. `2:4180` - Auth: Login & Register
3. `2:3298` - User Dashboard
4. `2:2` - ETB Wallet & Transactions
5. `2:3980` - Create Escrow Flow (Fixed)
6. `2:3003` - Escrow Transaction Details
7. `2:3194` - Escrow Payment
8. `2:2780` - Dispute Resolution Case File
9. `2:2510` - Admin Dispute Resolution Dashboard
10. `2:300` - AI Fraud Warning Component
11. `2:513` - Admin Verification Review Panel
12. `2:759` - Business Main Dashboard
13. `2:1066` - Main Admin Dashboard
14. `2:1336` - Forensic AI Analysis Dashboard
15. `2:1584` - User Management Admin Panel
16. `2:1926` - System Audit Intelligence
17. `2:2241` - B2B Developer Dashboard
18. `2:3509` - KYB Verification
19. `2:3745` - KYC Verification (Fixed)

## 2) Information architecture (how pages should be grouped)

### Public marketing
- Landing page as trust-first narrative:
  - Hero with "Secure Payments. Zero Trust Required."
  - Value proposition cards (AI Fraud, Secure Escrow, Dispute Protection)
  - How it Works process + CTA
  - Social proof/testimonials
  - Final conversion CTA + simple footer

### Identity and onboarding
- Auth page:
  - Split login/register tabs in one shell
  - Security-first visual treatment
  - Inline errors and clear CTA
- KYC and KYB:
  - Step flows with progress, requirements, and review states
  - Separate tracks for individual and business users

### User operations
- User dashboard and wallet:
  - Sidebar + top search + card KPIs
  - Recent transactions table and status chips
  - Wallet state and transaction list
- Escrow core journey:
  - Create escrow -> payment -> transaction details
  - Quick create actions should be available from dashboard

### Resolution and risk
- Dispute case details and dispute admin board:
  - List -> case drilldown -> timeline/evidence -> decision
- AI fraud warning:
  - Alert severity, rationale, and action recommendations

### Admin and governance
- Main admin dashboard and specialist panels:
  - Verification review panel
  - User management
  - System audit intelligence
  - Forensic analysis dashboard
- Shared goals:
  - Strong traceability, compliance visibility, and intervention tools

### Platform and integrations
- B2B developer dashboard:
  - API posture, integration status, and developer controls

## 3) Shared UI system inferred from Figma

- Color anchors:
  - Primary navy: `#001b44` / `#002f6c`
  - Accent green: `#69ff87`
  - Surface tint: `#faf8ff`, `#f2f3ff`
  - Supporting text: `#434750`, muted grays
- Shape language:
  - Rounded cards (`~24px`) for dashboard and marketing tiles
  - Rounded inputs/buttons (`~8-12px`) in forms
- Typography:
  - Bold headlines and compact uppercase labels
  - Readable body and process descriptions
- Layout patterns:
  - Marketing sections in centered containers
  - Product surfaces with left sidebar + topbar + content canvas
  - Tables and chips for status-heavy pages

## 4) Recommended route structure for Next.js app router

- `/` -> Landing page
- `/auth` -> Login/Register shell
- `/dashboard/user` -> User dashboard
- `/wallet` -> Wallet and transactions
- `/escrow/create` -> Create escrow flow
- `/escrow/payment` -> Escrow payment
- `/escrow/:id` -> Escrow transaction details
- `/disputes` -> Dispute dashboard
- `/disputes/:id` -> Dispute case file
- `/verify/kyc` -> KYC flow
- `/verify/kyb` -> KYB flow
- `/admin` -> Main admin dashboard
- `/admin/verification` -> Verification review panel
- `/admin/users` -> User management
- `/admin/audit` -> System audit intelligence
- `/admin/forensics` -> Forensic AI analysis
- `/admin/disputes` -> Admin dispute resolution dashboard
- `/risk/fraud-warning` -> AI fraud warning page
- `/developer` -> B2B developer dashboard
- `/map` -> Internal map of all Figma nodes/screens

## 5) Delivery sequencing (what to code first)

1. Marketing and entry: Landing + Auth
2. User product core: User Dashboard + Wallet + Escrow create/payment/details
3. Verification: KYC/KYB
4. Resolution/risk: Disputes + AI warning
5. Admin and developer consoles

## 6) What is being implemented now

- First coding pass includes:
  - Landing page (`/`)
  - Auth page (`/auth`)
  - User dashboard page (`/dashboard/user`)
  - Figma screen map page (`/map`)
- This establishes the app shell and visual language before building the remaining flows.

export type FigmaPage = {
  nodeId: string;
  title: string;
  route: string;
  area:
    | "Public"
    | "Identity"
    | "User"
    | "Escrow"
    | "Disputes"
    | "Admin"
    | "Risk"
    | "Developer";
};

export const figmaPages: FigmaPage[] = [
  { nodeId: "2:4271", title: "EthiTrust Landing Page", route: "/", area: "Public" },
  { nodeId: "2:4180", title: "Auth: Login & Register", route: "/auth", area: "Identity" },
  { nodeId: "2:3298", title: "User Dashboard", route: "/dashboard/user", area: "User" },
  { nodeId: "2:2", title: "ETB Wallet & Transactions", route: "/wallet", area: "User" },
  { nodeId: "2:3980", title: "Create Escrow Flow (Fixed)", route: "/escrow/create", area: "Escrow" },
  { nodeId: "2:3194", title: "Escrow Payment", route: "/escrow/payment", area: "Escrow" },
  { nodeId: "2:3003", title: "Escrow Transaction Details", route: "/escrow/tx-1", area: "Escrow" },
  { nodeId: "2:2510", title: "Admin Dispute Resolution Dashboard", route: "/admin/disputes", area: "Disputes" },
  { nodeId: "2:2780", title: "Dispute Resolution Case File", route: "/disputes/case-1", area: "Disputes" },
  { nodeId: "2:300", title: "AI Fraud Warning Component", route: "/risk/fraud-warning", area: "Risk" },
  { nodeId: "2:513", title: "Admin Verification Review Panel", route: "/admin/verification", area: "Admin" },
  { nodeId: "2:759", title: "Business Main Dashboard", route: "/business", area: "User" },
  { nodeId: "2:1066", title: "Main Admin Dashboard", route: "/admin", area: "Admin" },
  { nodeId: "2:1336", title: "Forensic AI Analysis Dashboard", route: "/admin/forensics", area: "Admin" },
  { nodeId: "2:1584", title: "User Management Admin Panel", route: "/admin/users", area: "Admin" },
  { nodeId: "2:1926", title: "System Audit Intelligence", route: "/admin/audit", area: "Admin" },
  { nodeId: "2:2241", title: "B2B Developer Dashboard", route: "/developer", area: "Developer" },
  { nodeId: "2:3509", title: "KYB Verification", route: "/verify/kyb", area: "Identity" },
  { nodeId: "2:3745", title: "KYC Verification (Fixed)", route: "/verify/kyc", area: "Identity" },
];

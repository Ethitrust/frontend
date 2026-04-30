import { Bot, CheckCircle2, Circle, FileText, Shield } from "lucide-react";
import Link from "next/link";
import { UserShell } from "@/components/user-shell";
import EscrowClient from "./escrow-client";

export default async function EscrowTransactionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <UserShell>
      <EscrowClient escrowId={id} />
    </UserShell>
  );
}

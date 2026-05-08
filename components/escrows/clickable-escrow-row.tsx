"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type {
  EscrowListItem,
  EscrowRow,
} from "@/lib/escrows/escrow-list-types";

import {
  type EscrowListStatusBadgeVariant,
  escrowListStatusBadgeVariant,
  escrowListStatusLabel,
} from "@/lib/escrows/escrow-table-display";
import {
  formatEscrowDate,
  formatEscrowMoney,
} from "@/lib/escrows/format-escrow";
import { cn } from "@/lib/utils";

// ─── Status pill helper ────────────────────────────────────────────────────────

export function statusPillClass(status: string): string {
  switch (status) {
    case "active":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300";
    case "invited":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300";
    case "pending_funding":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300";
    case "completed":
      return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
    case "cancelled":
      return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400";
    case "rejected":
      return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400";
    case "disputed":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300";
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
  }
}

// ─── Shared row shell ──────────────────────────────────────────────────────────

function EscrowRowShell({
  escrowId,
  title,
  children,
}: {
  escrowId: string;
  title: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const href = `/escrows/${escrowId}`;

  return (
    <tr
      role="link"
      tabIndex={0}
      aria-label={`Open escrow: ${title}`}
      className={cn(
        "border-b border-border/60 transition-colors last:border-0",
        "cursor-pointer hover:bg-muted/50 focus-visible:bg-muted/50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      )}
      onClick={() => router.push(href)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          router.push(href);
        }
      }}
    >
      {children}
    </tr>
  );
}

// ─── Main list row ─────────────────────────────────────────────────────────────

type EscrowsListRowProps = {
  row: EscrowRow;
  roleLabel: string;
  actionNeeded?: boolean;
};

export function ClickableEscrowRow({
  row,
  roleLabel,
  actionNeeded,
}: EscrowsListRowProps) {
  return (
    <EscrowRowShell escrowId={row.id} title={row.title}>
      {/* Title + counterparty email + date */}
      <td className="px-6 py-3.5">
        <div className="flex items-start gap-2">
          {actionNeeded && (
            <Zap
              className="mt-0.5 size-3.5 shrink-0 text-amber-500"
              aria-label="Action needed"
            />
          )}
          <div className="min-w-0">
            <span className="font-medium text-foreground">{row.title}</span>
            {row.receiver_email ? (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {row.receiver_email}
              </p>
            ) : null}
            <p className="mt-0.5 text-xs text-muted-foreground/60">
              Updated {formatEscrowDate(row.updated_at)}
            </p>
          </div>
        </div>
      </td>

      {/* Role */}
      <td className="px-4 py-3.5 text-sm text-muted-foreground">{roleLabel}</td>

      {/* Type */}
      <td className="px-4 py-3.5 text-sm capitalize text-muted-foreground">
        {row.escrow_type.replace(/_/g, " ")}
      </td>

      {/* Status pill + optional action badge */}
      <td className="px-4 py-3.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
              statusPillClass(row.status),
            )}
          >
            {escrowListStatusLabel(row.status)}
          </span>
          {actionNeeded && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
              <Zap className="size-2.5" aria-hidden />
              Action needed
            </span>
          )}
        </div>
      </td>

      {/* Amount */}
      <td className="px-6 py-3.5 text-right text-sm font-medium tabular-nums">
        {formatEscrowMoney(row.amount, row.currency)}
      </td>
    </EscrowRowShell>
  );
}

// ─── Preview row (used in detail pages / widgets) ──────────────────────────────

export function EscrowPreviewClickableRow({
  row,
  statusBadgeVariant,
  statusBadgeLabel,
}: {
  row: Pick<
    EscrowListItem,
    "id" | "title" | "updated_at" | "escrow_type" | "amount" | "currency"
  >;
  statusBadgeVariant: EscrowListStatusBadgeVariant;
  statusBadgeLabel: string;
}) {
  return (
    <EscrowRowShell escrowId={row.id} title={row.title}>
      <td className="px-6 py-3.5">
        <span className="font-medium text-foreground">{row.title}</span>
        <p className="mt-0.5 text-xs text-muted-foreground/60">
          Updated {formatEscrowDate(row.updated_at)}
        </p>
      </td>
      <td className="px-4 py-3.5">
        <Badge variant={statusBadgeVariant}>{statusBadgeLabel}</Badge>
      </td>
      <td className="px-4 py-3.5 text-sm capitalize text-muted-foreground">
        {row.escrow_type.replace(/_/g, " ")}
      </td>
      <td className="px-6 py-3.5 text-right text-sm font-medium tabular-nums">
        {formatEscrowMoney(row.amount, row.currency)}
      </td>
    </EscrowRowShell>
  );
}

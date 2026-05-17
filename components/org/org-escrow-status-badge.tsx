import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Single source of truth for status colours on the org-escrow surface.
 * Covers the 8 public statuses documented for `/api/v1/organizations/{org_id}/escrows`;
 * unknown values fall through to a neutral slate badge.
 *
 * Uses the shadcn `<Badge>` shell with a custom className so the colour set
 * is uniform across the list, row, and detail views.
 */

type StatusKey =
  | "invited"
  | "pending"
  | "active"
  | "submitted"
  | "completed"
  | "cancelled"
  | "disputed"
  | "expired"
  // legacy/internal values surfaced by older escrows
  | "pending_funding"
  | "rejected";

const STATUS_STYLES: Record<StatusKey, string> = {
  invited:
    "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-900/60",
  pending:
    "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-900/60",
  pending_funding:
    "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-900/60",
  active:
    "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-900/60",
  submitted:
    "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300 dark:border-indigo-900/60",
  completed:
    "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-900/60",
  cancelled:
    "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  rejected:
    "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  disputed:
    "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-900/60",
  expired:
    "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
};

const FALLBACK_STYLE =
  "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";

export function orgEscrowStatusLabel(status: string): string {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function orgEscrowStatusClassName(status: string): string {
  const key = status.toLowerCase() as StatusKey;
  return STATUS_STYLES[key] ?? FALLBACK_STYLE;
}

export function OrgEscrowStatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium capitalize",
        orgEscrowStatusClassName(status),
        className,
      )}
    >
      {orgEscrowStatusLabel(status)}
    </Badge>
  );
}

"use client";

import type { KeyboardEvent, MouseEvent, ReactNode } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal } from "lucide-react";

import { CancelOrgEscrowDialog } from "@/components/org/cancel-org-escrow-dialog";
import { OrgEscrowStatusBadge } from "@/components/org/org-escrow-status-badge";
import { ResendOrgEscrowInviteDialog } from "@/components/org/resend-org-escrow-invite-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  formatEscrowDate,
  formatEscrowMoney,
} from "@/lib/escrows/format-escrow";
import type { OrgEscrowListItem } from "@/lib/org-escrows/org-escrow-types";
import { cn } from "@/lib/utils";

function OrgEscrowRowShell({
  orgId,
  escrowId,
  title,
  children,
}: {
  orgId: string;
  escrowId: string;
  title: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const href = `/org/${orgId}/escrows/${escrowId}`;

  function onActivate(e: MouseEvent | KeyboardEvent) {
    // Don't navigate when the click came from inside an interactive widget
    // (the actions menu, dialogs, buttons, links).
    const target = e.target as HTMLElement | null;
    if (target && target.closest("[data-row-actions]")) return;
    router.push(href);
  }

  return (
    <tr
      role="link"
      tabIndex={0}
      aria-label={`Open escrow: ${title}`}
      className={cn(
        "border-b border-border/60 transition-colors last:border-0",
        "cursor-pointer hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      )}
      onClick={onActivate}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onActivate(e);
        }
      }}
    >
      {children}
    </tr>
  );
}

function FundedCell({ row }: { row: OrgEscrowListItem }) {
  const total = row.amount > 0 ? row.amount : 0;
  const funded = Math.max(0, row.funded_amount);
  const pct = total > 0 ? Math.min(100, (funded / total) * 100) : 0;
  return (
    <div className="flex flex-col items-end gap-1">
      <span className="tabular-nums">
        {formatEscrowMoney(funded, row.currency)}
        <span className="text-muted-foreground">
          {" "}
          / {formatEscrowMoney(total, row.currency)}
        </span>
      </span>
      <div
        className="h-1 w-24 overflow-hidden rounded-full bg-primary/15"
        aria-hidden
      >
        <div
          className="h-full bg-primary"
          style={{ width: `${pct.toFixed(1)}%` }}
        />
      </div>
    </div>
  );
}

export function ClickableOrgEscrowRow({
  orgId,
  row,
  canManage,
}: {
  orgId: string;
  row: OrgEscrowListItem;
  canManage: boolean;
}) {
  const router = useRouter();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [resendOpen, setResendOpen] = useState(false);

  // From a list row we can't know `can_cancel`/`can_resend_invite` precisely
  // (the list response omits them). Approximate from status — the server will
  // still reject if it's not allowed.
  const status = row.status.toLowerCase();
  const cancellable =
    !["completed", "cancelled", "expired", "rejected"].includes(status);
  const resendable = ["invited", "pending"].includes(status);

  return (
    <>
      <OrgEscrowRowShell
        orgId={orgId}
        escrowId={row.escrow_id}
        title={row.title}
      >
        <td className="px-6 py-3">
          <span className="font-medium text-foreground">{row.title}</span>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Updated {formatEscrowDate(row.updated_at)}
          </p>
        </td>
        <td className="px-4 py-3">
          <OrgEscrowStatusBadge status={row.status} />
        </td>
        <td className="px-4 py-3 text-muted-foreground">
          {row.receiver_email ?? "—"}
        </td>
        <td className="px-4 py-3 text-right tabular-nums">
          <FundedCell row={row} />
        </td>
        <td className="px-4 py-3 text-right tabular-nums">
          {formatEscrowMoney(row.amount, row.currency)}
        </td>
        <td className="px-4 py-3 text-muted-foreground">
          {formatEscrowDate(row.created_at)}
        </td>
        <td className="px-4 py-3 text-muted-foreground">
          {row.expires_at ? formatEscrowDate(row.expires_at) : "—"}
        </td>
        <td
          className="px-2 py-3 text-right"
          data-row-actions
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 rounded-full"
                aria-label={`Actions for ${row.title}`}
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem
                onSelect={() =>
                  router.push(`/org/${orgId}/escrows/${row.escrow_id}`)
                }
              >
                View
              </DropdownMenuItem>
              {canManage ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    disabled={!resendable}
                    onSelect={(e) => {
                      e.preventDefault();
                      setResendOpen(true);
                    }}
                  >
                    Resend invite
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={!cancellable}
                    onSelect={(e) => {
                      e.preventDefault();
                      setCancelOpen(true);
                    }}
                    className="text-destructive focus:text-destructive"
                  >
                    Cancel escrow
                  </DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </td>
      </OrgEscrowRowShell>

      {/* Dialogs rendered as siblings so they're outside the <tr>. */}
      {canManage ? (
        <>
          <CancelOrgEscrowDialog
            orgId={orgId}
            escrowId={row.escrow_id}
            escrowTitle={row.title}
            open={cancelOpen}
            onOpenChange={setCancelOpen}
          />
          <ResendOrgEscrowInviteDialog
            orgId={orgId}
            escrowId={row.escrow_id}
            receiverEmail={row.receiver_email}
            open={resendOpen}
            onOpenChange={setResendOpen}
          />
        </>
      ) : null}
    </>
  );
}

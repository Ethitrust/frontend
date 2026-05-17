"use client";

import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpFromLine,
  History,
  Landmark,
  Lock,
  Wallet,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchAuthMe } from "@/lib/auth/me-session-api";
import {
  formatEscrowDateTime,
  formatEscrowMoney,
} from "@/lib/escrows/format-escrow";
import { fetchOrgMembers } from "@/lib/org/org-organizations-api";
import { fetchOrgWalletList } from "@/lib/org/org-wallet-api";
import type { WalletRow } from "@/lib/wallets/wallet-types";
import { ethitrustThemeTokens } from "@/lib/ethitrust-theme";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

export function OrgWalletView({ orgId }: { orgId: string }) {
  const e = ethitrustThemeTokens;
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);

  const walletsQuery = useQuery({
    queryKey: ["org", orgId, "wallets"],
    queryFn: () => fetchOrgWalletList(accessToken!, orgId),
    enabled: Boolean(accessToken && orgId),
    staleTime: 30_000,
  });

  const membersQuery = useQuery({
    queryKey: ["me", "organizations", orgId, "members"],
    queryFn: () => fetchOrgMembers(accessToken!, orgId),
    enabled: Boolean(accessToken && orgId),
    staleTime: 60_000,
  });

  const meQuery = useQuery({
    queryKey: ["me", "auth", "me"],
    queryFn: () => fetchAuthMe(accessToken!),
    enabled: Boolean(accessToken),
    staleTime: 5 * 60_000,
  });

  const currentUserId = meQuery.data?.id;
  const members = membersQuery.data ?? [];
  const myMember = members.find((m) => m.user_id === currentUserId);
  const myRole = myMember?.role ?? "member";

  const isOwner = myRole === "owner";
  const canWithdraw = isOwner;

  const wallets = walletsQuery.data ?? [];

  const bump = () =>
    void queryClient.invalidateQueries({ queryKey: ["org", orgId, "wallets"] });

  return (
    <div className={cn(e.layout.container, "py-8 lg:py-12")}>
      <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className={cn(e.typography.eyebrow, "text-muted-foreground")}>
            Organization
          </p>
          <h1
            className={cn(
              e.typography.displayLG,
              "mt-2 font-serif font-normal text-foreground",
            )}
          >
            Wallet
          </h1>
          <p className={cn(e.typography.bodyMuted, "mt-3")}>
            Balances and movements for wallets owned by this organization. Your
            role here is{" "}
            <span className="font-medium text-foreground capitalize">
              {myRole}
            </span>
            .
          </p>
        </div>
      </header>

      {walletsQuery.isError ? (
        <Alert variant="destructive" className="mt-10">
          <AlertTitle>Could not load wallets</AlertTitle>
          <AlertDescription>
            {walletsQuery.error instanceof Error
              ? walletsQuery.error.message
              : "Request failed"}
          </AlertDescription>
        </Alert>
      ) : null}

      {walletsQuery.isPending ? (
        <div className="mt-10 space-y-6">
          <Skeleton className="h-52 w-full max-w-2xl rounded-xl" />
        </div>
      ) : wallets.length === 0 ? (
        <Card className="mt-10 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              No org wallets yet
            </CardTitle>
            <CardDescription>
              No wallets are attached to this organization. If balances should
              appear here, please contact support.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href={`/org/${orgId}/dashboard`}
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Back to dashboard
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-10 space-y-10">
          {wallets.map((w) => (
            <OrgWalletCard
              key={w.id}
              wallet={w}
              orgId={orgId}
              canWithdraw={canWithdraw}
              onAction={bump}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function OrgWalletCard({
  wallet: w,
  orgId,
  canWithdraw,
}: {
  wallet: WalletRow;
  orgId: string;
  canWithdraw: boolean;
  onAction?: () => void;
}) {
  const e = ethitrustThemeTokens;
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex-row flex-wrap items-start justify-between gap-4 space-y-0 border-b">
        <div>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Landmark className="size-4 text-muted-foreground" aria-hidden />
            {w.currency} wallet
          </CardTitle>
          <CardDescription className="mt-2 font-mono text-[11px] break-all">
            {w.id}
          </CardDescription>
        </div>
        <Badge variant={w.status === "active" ? "default" : "secondary"}>
          {w.status}
        </Badge>
      </CardHeader>
      <CardContent className="pt-6">
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Wallet className="size-3" aria-hidden />
              Available balance
            </dt>
            <dd className={cn(e.typography.statValue, "mt-1 text-xl")}>
              {formatEscrowMoney(w.balance, w.currency)}
            </dd>
          </div>
          <div>
            <dt className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Lock className="size-3" aria-hidden />
              Locked balance
            </dt>
            <dd className="mt-1 text-lg font-semibold tabular-nums">
              {formatEscrowMoney(w.locked_balance, w.currency)}
            </dd>
          </div>
          <div className="text-xs text-muted-foreground">
            Updated {formatEscrowDateTime(w.updated_at)}
          </div>
        </dl>
      </CardContent>

      <CardContent className="border-t pt-4 pb-4 bg-muted/10 flex flex-wrap justify-end gap-2">
        <Button asChild variant="outline" className="rounded-full">
          <Link href={`/org/${orgId}/wallet/transactions?wallet_id=${w.id}`}>
            <History className="size-4" aria-hidden />
            Transactions
          </Link>
        </Button>
        {canWithdraw ? (
          <Button asChild variant="default" className="rounded-full">
            <Link href={`/org/${orgId}/wallet/withdraw?wallet_id=${w.id}`}>
              <ArrowUpFromLine className="size-4" aria-hidden />
              Withdraw funds
            </Link>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

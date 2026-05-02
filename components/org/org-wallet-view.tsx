"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Landmark, Lock, Wallet } from "lucide-react";

import { OrgWalletWithdrawForm } from "@/components/org/org-wallet-withdraw-form";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  formatEscrowDateTime,
  formatEscrowMoney,
} from "@/lib/escrows/format-escrow";
import { fetchMeWalletList } from "@/lib/wallets/me-wallet-api";
import type { WalletRow } from "@/lib/wallets/wallet-types";
import { ethitrustThemeTokens } from "@/lib/ethitrust-theme";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

export function OrgWalletView({ orgId }: { orgId: string }) {
  const e = ethitrustThemeTokens;
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);

  const walletsQuery = useQuery({
    queryKey: ["me", "wallets"],
    queryFn: () => fetchMeWalletList(accessToken!),
    enabled: Boolean(accessToken),
    staleTime: 30_000,
  });

  const wallets = useMemo(
    () => (walletsQuery.data ?? []).filter((w) => w.owner_id === orgId),
    [orgId, walletsQuery.data],
  );

  const bump = () =>
    void queryClient.invalidateQueries({ queryKey: ["me", "wallets"] });

  return (
    <div className={cn(e.layout.container, "py-8 lg:py-12")}>
      <header className="max-w-2xl">
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
      </header>

      {walletsQuery.isError ? (
        <p className="mt-10 text-sm text-destructive">
          {walletsQuery.error instanceof Error
            ? walletsQuery.error.message
            : "Could not load wallets"}
        </p>
      ) : null}

      {walletsQuery.isPending ? (
        <div className="mt-10 space-y-6">
          <Skeleton className="h-52 w-full max-w-2xl rounded-xl" />
        </div>
      ) : wallets.length === 0 ? (
        <Card className="mt-10 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              No org wallets visible
            </CardTitle>
            <CardDescription>
              No wallet rows list this organization as{" "}
              <span className="font-mono text-xs">owner_id</span>. If balances
              should appear here, verify the upstream API links org wallets
              correctly.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ButtonLinkDashboard />
          </CardContent>
        </Card>
      ) : (
        <div className="mt-10 space-y-10">
          {wallets.map((w) => (
            <OrgWalletCard
              key={w.id}
              wallet={w}
              orgId={orgId}
              onWithdrawSuccess={bump}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ButtonLinkDashboard() {
  return (
    <Link
      href="/dashboard"
      className="text-sm font-medium text-primary underline-offset-4 hover:underline"
    >
      Back to dashboard
    </Link>
  );
}

function OrgWalletCard({
  wallet: w,
  orgId,
  onWithdrawSuccess,
}: {
  wallet: WalletRow;
  orgId: string;
  onWithdrawSuccess?: () => void;
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

      <CardContent className="border-t pt-0 pb-8">
        <OrgWalletWithdrawForm
          orgId={orgId}
          wallet={w}
          onSuccess={onWithdrawSuccess}
        />
      </CardContent>
    </Card>
  );
}

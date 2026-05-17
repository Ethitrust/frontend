"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WalletFlowShell } from "@/components/wallet/wallet-flow-shell";
import { WalletPaymentsGate } from "@/components/wallet/wallet-payments-gate";
import { fetchAuthMe } from "@/lib/auth/me-session-api";
import { fetchOrgMembers } from "@/lib/org/org-organizations-api";
import {
  fetchOrgWalletList,
  postOrgWalletWithdraw,
} from "@/lib/org/org-wallet-api";
import {
  fetchSupportedBanks,
  pickDefaultWalletId,
} from "@/lib/wallets/me-wallet-api";
import type { WalletRow } from "@/lib/wallets/wallet-types";

export function OrgWalletWithdrawView({
  orgId,
  initialWalletId,
}: {
  orgId: string;
  initialWalletId?: string;
}) {
  return (
    <WalletPaymentsGate
      title="Withdraw from org wallet"
      description="Move money from this organization's balance to a beneficiary bank account."
    >
      {(accessToken) => (
        <OrgWalletWithdrawSignedIn
          accessToken={accessToken}
          orgId={orgId}
          initialWalletId={initialWalletId}
        />
      )}
    </WalletPaymentsGate>
  );
}

function OrgWalletWithdrawSignedIn({
  accessToken,
  orgId,
  initialWalletId,
}: {
  accessToken: string;
  orgId: string;
  initialWalletId?: string;
}) {
  const queryClient = useQueryClient();

  const [walletId, setWalletId] = useState(initialWalletId ?? "");
  const [amount, setAmount] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankId, setBankId] = useState<number | null>(855);
  const [description, setDescription] = useState("");

  const walletsQuery = useQuery({
    queryKey: ["org", orgId, "wallets"],
    queryFn: () => fetchOrgWalletList(accessToken, orgId),
    enabled: Boolean(accessToken && orgId),
  });

  const membersQuery = useQuery({
    queryKey: ["me", "organizations", orgId, "members"],
    queryFn: () => fetchOrgMembers(accessToken, orgId),
    enabled: Boolean(accessToken && orgId),
    staleTime: 60_000,
  });

  const meQuery = useQuery({
    queryKey: ["me", "auth", "me"],
    queryFn: () => fetchAuthMe(accessToken),
    enabled: Boolean(accessToken),
    staleTime: 5 * 60_000,
  });

  const currentUserId = meQuery.data?.id;
  const myMember = (membersQuery.data ?? []).find(
    (m) => m.user_id === currentUserId,
  );
  const myRole = myMember?.role ?? "member";
  const canWithdraw = myRole === "owner";
  const membershipReady = !membersQuery.isPending && !meQuery.isPending;

  useEffect(() => {
    const list = walletsQuery.data;
    if (!list?.length || walletId) return;
    const id = pickDefaultWalletId(list);
    if (id) setWalletId(id);
  }, [walletsQuery.data, walletId]);

  const walletCurrency =
    walletsQuery.data?.find((w) => w.id === walletId)?.currency ??
    walletsQuery.data?.[0]?.currency ??
    "";

  const banksQuery = useQuery({
    queryKey: ["me", "wallets", "banks", walletCurrency],
    queryFn: () =>
      fetchSupportedBanks(accessToken, {
        currency: walletCurrency || "ETB",
        provider: "chapa",
      }),
    enabled: Boolean(accessToken && walletCurrency),
    retry: 1,
  });

  useEffect(() => {
    const banks = banksQuery.data;
    if (!banks?.length || bankId) return;
    setBankId(banks[0]!.id);
  }, [banksQuery.data, bankId]);

  const bankMeta = useMemo(
    () => banksQuery.data?.find((b) => b.id === bankId),
    [banksQuery.data, bankId],
  );

  const withdrawMutation = useMutation({
    mutationFn: (body: Parameters<typeof postOrgWalletWithdraw>[3]) =>
      postOrgWalletWithdraw(accessToken, orgId, walletId, body),
    onSuccess: () => {
      toast.success("Withdrawal request accepted", {
        description:
          "Processing can take a little time—you will be notified according to how your bank or provider confirms payouts.",
      });
      setAmount("");
      setDescription("");
      setAccountNumber("");
      void queryClient.invalidateQueries({
        queryKey: ["org", orgId, "wallets"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["org", orgId, "wallet", walletId, "transactions"],
      });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!walletId) {
      toast.error("Choose a wallet");
      return;
    }
    const n = Number(amount.replace(/,/g, ""));
    if (!Number.isFinite(n) || n <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    const acct = accountNumber.trim();
    if (!acct) {
      toast.error("Account number is required");
      return;
    }
    const code = bankId;
    if (!code) {
      toast.error("Select or enter a bank identifier");
      return;
    }

    withdrawMutation.mutate({
      amount: n,
      account_number: acct,
      bank_code: code,
      description: description.trim(),
    });
  }

  const bankRows = banksQuery.data ?? [];
  const showBankSelect = banksQuery.isSuccess && bankRows.length > 0;

  return (
    <WalletFlowShell
      title="Withdraw funds"
      description="Transfers use our supported payout network. Pick the beneficiary bank from the list, or enter a bank identifier manually if the list is unavailable."
      backHref={`/org/${orgId}/wallet`}
      backLabel="Back to org wallet"
      eyebrow="Organization"
    >
      {membershipReady && !canWithdraw ? (
        <Alert variant="destructive">
          <AlertTitle>You don&apos;t have permission</AlertTitle>
          <AlertDescription>
            Withdrawals from an organization wallet are restricted to the org
            owner. Please ask the owner to perform this action.
          </AlertDescription>
        </Alert>
      ) : !walletsQuery.data && walletsQuery.isPending ? (
        <p className="text-sm text-muted-foreground">Loading wallets…</p>
      ) : walletsQuery.isError ? (
        <Alert variant="destructive">
          <AlertTitle>Could not load wallets</AlertTitle>
          <AlertDescription>
            {walletsQuery.error instanceof Error
              ? walletsQuery.error.message
              : "Request failed"}
          </AlertDescription>
        </Alert>
      ) : !walletsQuery.data?.length ? (
        <Alert>
          <AlertTitle>No wallets</AlertTitle>
          <AlertDescription>
            This organization has no wallets to withdraw from.
          </AlertDescription>
        </Alert>
      ) : (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Bank payout
            </CardTitle>
            <CardDescription>
              Available balance limits apply. Ensure the account details belong
              to the organization or its designated beneficiary.
            </CardDescription>
          </CardHeader>
          <form onSubmit={onSubmit}>
            <CardContent className="space-y-6">
              {walletsQuery.data && walletsQuery.data.length > 1 ? (
                <div className="space-y-2">
                  <Label htmlFor="org-withdraw-wallet">Wallet</Label>
                  <Select
                    value={walletId}
                    onValueChange={(v) => {
                      setWalletId(v);
                      setBankId(null);
                    }}
                  >
                    <SelectTrigger
                      id="org-withdraw-wallet"
                      className="w-full rounded-lg"
                    >
                      <SelectValue placeholder="Select wallet" />
                    </SelectTrigger>
                    <SelectContent>
                      {(walletsQuery.data as WalletRow[]).map((w) => (
                        <SelectItem key={w.id} value={w.id}>
                          {w.currency} — {w.id.slice(0, 8)}…
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="org-withdraw-amt">
                  Amount {walletCurrency ? `(${walletCurrency})` : ""}
                </Label>
                <Input
                  id="org-withdraw-amt"
                  inputMode="decimal"
                  placeholder="0"
                  value={amount}
                  onChange={(ev) => setAmount(ev.target.value)}
                  className="rounded-lg"
                  autoComplete="off"
                />
              </div>

              {banksQuery.isPending ? (
                <p className="text-sm text-muted-foreground">
                  Loading supported banks…
                </p>
              ) : showBankSelect ? (
                <div className="space-y-2">
                  <Label htmlFor="org-withdraw-bank">Bank</Label>
                  <Select
                    value={bankId != null ? String(bankId) : ""}
                    onValueChange={(v) => setBankId(Number(v))}
                  >
                    <SelectTrigger
                      id="org-withdraw-bank"
                      className="w-full rounded-lg"
                    >
                      <SelectValue placeholder="Select bank" />
                    </SelectTrigger>
                    <SelectContent>
                      {bankRows.map((b) => (
                        <SelectItem key={String(b.id)} value={String(b.id)}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {bankMeta?.acct_length != null &&
                  Number(bankMeta.acct_length) > 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Expected account length for this institution:{" "}
                      <span className="font-medium text-foreground">
                        {bankMeta.acct_length}
                      </span>{" "}
                      digits.
                    </p>
                  ) : null}
                </div>
              ) : (
                <div className="space-y-4">
                  {banksQuery.isError ? (
                    <Alert variant="destructive">
                      <AlertTitle>Banks unavailable</AlertTitle>
                      <AlertDescription>
                        {banksQuery.error instanceof Error
                          ? banksQuery.error.message
                          : " Could not load the bank list"}{" "}
                        — enter the payout bank identifier manually if you know
                        it.
                      </AlertDescription>
                    </Alert>
                  ) : banksQuery.isSuccess ? (
                    <Alert>
                      <AlertTitle>No banks in catalog</AlertTitle>
                      <AlertDescription>
                        The provider returned an empty bank list for this
                        currency. Enter the payout bank slug manually.
                      </AlertDescription>
                    </Alert>
                  ) : null}

                  <div className="space-y-2">
                    <Label htmlFor="org-withdraw-bank-manual">
                      Bank identifier
                    </Label>
                    <Input
                      id="org-withdraw-bank-manual"
                      placeholder="Matches provider bank identifier"
                      value={bankId != null ? String(bankId) : ""}
                      onChange={(ev) => setBankId(Number(ev.target.value))}
                      className="rounded-lg font-mono text-sm"
                      autoComplete="off"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="org-withdraw-acct">Account number</Label>
                <Input
                  id="org-withdraw-acct"
                  inputMode="numeric"
                  placeholder="Beneficiary account"
                  value={accountNumber}
                  onChange={(ev) => setAccountNumber(ev.target.value)}
                  className="rounded-lg tabular-nums"
                  autoComplete="off"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="org-withdraw-desc">Description</Label>
                <Input
                  id="org-withdraw-desc"
                  placeholder="Optional memo for payout"
                  value={description}
                  onChange={(ev) => setDescription(ev.target.value)}
                  className="rounded-lg"
                  autoComplete="off"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-wrap gap-3 border-t bg-muted/20">
              <Button
                type="submit"
                className="rounded-full"
                disabled={withdrawMutation.isPending}
              >
                {withdrawMutation.isPending ? (
                  <>
                    <Loader2Icon className="size-4 animate-spin" aria-hidden />
                    Submitting…
                  </>
                ) : (
                  "Submit withdrawal"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}
    </WalletFlowShell>
  );
}

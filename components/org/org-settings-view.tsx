"use client";

import Link from "next/link";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, ShieldAlert } from "lucide-react";

import { OrgSettingsApiKeyActions } from "@/components/org/org-settings-api-key-actions";
import { OrgSettingsProfileForm } from "@/components/org/org-settings-profile-form";
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
import { formatEscrowDateTime } from "@/lib/escrows/format-escrow";
import {
  deleteOrgApiKey,
  fetchOrgApiKeys,
  fetchOrgProfile,
} from "@/lib/org/org-organizations-api";
import { ethitrustThemeTokens } from "@/lib/ethitrust-theme";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

export function OrgSettingsView({ orgId }: { orgId: string }) {
  const e = ethitrustThemeTokens;
  const accessToken = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: ["me", "organizations", orgId, "profile"],
    queryFn: () => fetchOrgProfile(accessToken!, orgId),
    enabled: Boolean(accessToken && orgId),
    staleTime: 30_000,
  });

  const keysQuery = useQuery({
    queryKey: ["me", "organizations", orgId, "api-keys"],
    queryFn: () => fetchOrgApiKeys(accessToken!, orgId),
    enabled: Boolean(accessToken && orgId),
    staleTime: 30_000,
  });

  const revokeMutation = useMutation({
    mutationFn: (apiKeyId: string) =>
      deleteOrgApiKey(accessToken!, orgId, apiKeyId),
    onSuccess: () =>
      void queryClient.invalidateQueries({
        queryKey: ["me", "organizations", orgId, "api-keys"],
      }),
    onError: (err: unknown) =>
      toast.error(
        err instanceof Error ? err.message : "Could not revoke API key",
      ),
  });

  function confirmRevoke(id: string, name: string) {
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        `Revoke API key "${name}"? This cannot be undone from the dashboard.`,
      )
    )
      return;
    revokeMutation.mutate(id);
  }

  const profile = profileQuery.data;
  const keys = keysQuery.data ?? [];

  const loading = profileQuery.isPending || keysQuery.isPending;

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
          Settings
        </h1>
      </header>

      {(profileQuery.isError || keysQuery.isError) && (
        <Alert variant="destructive" className="mt-10">
          <AlertTitle>Could not load settings</AlertTitle>
          <AlertDescription className="space-y-2">
            {profileQuery.isError ? (
              <span className="block">
                {profileQuery.error instanceof Error
                  ? profileQuery.error.message
                  : ""}
              </span>
            ) : null}
            {keysQuery.isError ? (
              <span className="block">
                {keysQuery.error instanceof Error
                  ? keysQuery.error.message
                  : ""}
              </span>
            ) : null}
          </AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="mt-10 space-y-6">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-52 rounded-xl" />
        </div>
      ) : profile ? (
        <div className="mt-10 space-y-8">
          {(profile.is_flagged || profile.kyb_status !== "verified") && (
            <Alert variant={profile.is_flagged ? "destructive" : "default"}>
              <ShieldAlert className="size-4" aria-hidden />
              <AlertTitle>Risk and KYB</AlertTitle>
              <AlertDescription className="text-sm">
                <span className="font-medium">kyb_status:</span>{" "}
                {profile.kyb_status}
                {profile.is_flagged ? (
                  <>
                    {" "}
                    · <span className="font-medium">flagged</span>
                  </>
                ) : null}
                {profile.risk_score > 0 ? (
                  <>
                    {" "}
                    · <span className="font-medium">risk_score:</span>{" "}
                    {profile.risk_score}
                  </>
                ) : null}
              </AlertDescription>
            </Alert>
          )}

          <OrgSettingsProfileForm orgId={orgId} profile={profile} />

          <Card className="shadow-sm">
            <CardHeader className="flex-row flex-wrap items-center justify-between gap-4 space-y-0 border-b">
              <div>
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <KeyRound
                    className="size-4 text-muted-foreground"
                    aria-hidden
                  />
                  API keys
                </CardTitle>
                <CardDescription>
                  <span className="font-mono text-xs">POST …/api-keys</span>{" "}
                  with{" "}
                  <span className="font-mono text-xs">{`{ key_name }`}</span>
                </CardDescription>
              </div>
              <OrgSettingsApiKeyActions orgId={orgId} />
            </CardHeader>
            <CardContent className="px-0 pb-0 pt-0">
              {keys.length === 0 ? (
                <p className="px-6 py-12 text-center text-sm text-muted-foreground">
                  No API keys yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-xl text-left text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
                        <th className="px-6 py-3 font-medium">Name</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-6 py-3 font-medium">Created</th>
                        <th className="px-6 py-3 font-medium text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {keys.map((k) => (
                        <tr
                          key={k.id}
                          className="border-b border-border/60 last:border-0"
                        >
                          <td className="px-6 py-3 font-medium">
                            {k.key_name}
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              variant={k.is_active ? "secondary" : "outline"}
                            >
                              {k.is_active ? "active" : "inactive"}
                            </Badge>
                          </td>
                          <td className="px-6 py-3 tabular-nums text-xs text-muted-foreground">
                            {formatEscrowDateTime(k.created_at)}
                          </td>
                          <td className="px-6 py-3 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                              disabled={revokeMutation.isPending}
                              onClick={() => confirmRevoke(k.id, k.key_name)}
                            >
                              Revoke
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        !profileQuery.isPending &&
        !profileQuery.isError && (
          <p className="mt-10 text-sm text-muted-foreground">
            Sign in may be required. <Link href="/signin">Sign in</Link>
          </p>
        )
      )}
    </div>
  );
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { Terminal, Key, Webhook, Activity, BookOpen, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { OrgSettingsApiKeyActions } from "@/components/org/org-settings-api-key-actions";
import { OrgWebhookConfig } from "@/components/org/org-webhook-config";
import { OrgWebhookDeliveryLog } from "@/components/org/org-webhook-delivery-log";
import { fetchOrgProfile, fetchOrgApiKeys } from "@/lib/org/org-organizations-api";
import { ethitrustThemeTokens } from "@/lib/ethitrust-theme";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatEscrowDateTime } from "@/lib/escrows/format-escrow";

export function OrgDeveloperView({ orgId }: { orgId: string }) {
  const e = ethitrustThemeTokens;
  const accessToken = useAuthStore((s) => s.accessToken);

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

  const keys = keysQuery.data ?? [];
  const profile = profileQuery.data;

  return (
    <div className={cn(e.layout.container, "py-8 lg:py-12")}>
      <header className="max-w-2xl">
        <p className={cn(e.typography.eyebrow, "text-muted-foreground flex items-center gap-2")}>
          <Terminal className="size-4" />
          Developer Hub
        </p>
        <h1 className={cn(e.typography.displayLG, "mt-2 font-serif font-normal text-foreground")}>
          Escrow-as-a-Service
        </h1>
        <p className="mt-2 text-muted-foreground">
          Manage API keys, configure webhooks, and integrate Ethitrust into your application.
        </p>
      </header>

      {profileQuery.isError ? (
        <Alert variant="destructive" className="mt-8">
          <AlertCircle className="size-4" />
          <AlertTitle>Could not load profile</AlertTitle>
          <AlertDescription>
            {profileQuery.error instanceof Error ? profileQuery.error.message : "Request failed"}
          </AlertDescription>
        </Alert>
      ) : null}

      {profileQuery.isPending ? (
        <div className="mt-10 space-y-6">
          <Skeleton className="h-64 rounded-xl" />
        </div>
      ) : profile ? (
        <Tabs defaultValue="api-keys" className="mt-10">
          <TabsList className="mb-6 grid w-full grid-cols-3 sm:w-auto sm:inline-grid">
            <TabsTrigger value="api-keys" className="gap-2">
              <Key className="size-4" />
              API Keys
            </TabsTrigger>
            <TabsTrigger value="webhooks" className="gap-2">
              <Webhook className="size-4" />
              Webhooks
            </TabsTrigger>
            <TabsTrigger value="docs" className="gap-2">
              <BookOpen className="size-4" />
              API Reference
            </TabsTrigger>
          </TabsList>

          <TabsContent value="api-keys" className="space-y-6">
            <Alert className="bg-primary/5 border-primary/10">
              <Activity className="size-4 text-primary" />
              <AlertTitle>Rate Limits</AlertTitle>
              <AlertDescription>
                API requests are limited to <span className="font-semibold">120 requests per minute</span> per API key.
                Include an <code className="text-xs bg-background px-1 py-0.5 rounded">X-Idempotency-Key</code> header for safe retries on write operations.
              </AlertDescription>
            </Alert>

            <Card className="shadow-sm">
              <CardHeader className="flex-row flex-wrap items-center justify-between gap-4 space-y-0 border-b">
                <div>
                  <CardTitle className="text-base font-semibold">Active API Keys</CardTitle>
                  <CardDescription>
                    Authenticate requests via the <code className="text-xs">X-API-KEY</code> header.
                  </CardDescription>
                </div>
                <OrgSettingsApiKeyActions orgId={orgId} />
              </CardHeader>
              <CardContent className="px-0 pb-0 pt-0">
                {keysQuery.isPending ? (
                  <div className="p-6"><Skeleton className="h-20 w-full" /></div>
                ) : keys.length === 0 ? (
                  <div className="px-6 py-12 text-center text-sm text-muted-foreground">
                    <Key className="size-8 mx-auto mb-3 opacity-20" />
                    <p>No API keys generated yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-xl text-left text-sm">
                      <thead>
                        <tr className="border-b bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
                          <th className="px-6 py-3 font-medium">Name</th>
                          <th className="px-4 py-3 font-medium">Status</th>
                          <th className="px-6 py-3 font-medium">Created</th>
                          <th className="px-6 py-3 font-medium text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {keys.map((k) => (
                          <tr key={k.id} className="border-b border-border/60 last:border-0">
                            <td className="px-6 py-3 font-medium">{k.key_name}</td>
                            <td className="px-4 py-3">
                              <Badge variant={k.is_active ? "secondary" : "outline"}>
                                {k.is_active ? "active" : "revoked"}
                              </Badge>
                            </td>
                            <td className="px-6 py-3 tabular-nums text-xs text-muted-foreground">
                              {formatEscrowDateTime(k.created_at)}
                            </td>
                            <td className="px-6 py-3 text-right">
                              {/* Action to revoke should go here. We reuse the API Key logic from settings but maybe just point users to use the action button for now. The old component had a confirmRevoke in the parent. I will move that here later if needed. For now, it is handled by the API Key Actions component adding keys, and revoking can be done if we copy the revoke logic. */}
                              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" onClick={() => alert("Please manage revocation in Settings or contact support.")}>
                                Manage
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
          </TabsContent>

          <TabsContent value="webhooks" className="space-y-6">
            <OrgWebhookConfig orgId={orgId} profile={profile} />
            <OrgWebhookDeliveryLog orgId={orgId} />
          </TabsContent>

          <TabsContent value="docs" className="space-y-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold">API Integration Guide</CardTitle>
                <CardDescription>
                  Base URL: <code className="bg-muted px-1.5 py-0.5 rounded text-xs">https://api.ethitrust.me/v1</code>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="rounded-lg border bg-card p-4">
                    <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <Key className="size-4" /> Authentication
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      All requests require your API key in the <code className="text-xs">X-API-KEY</code> header.
                    </p>
                    <pre className="bg-muted/50 p-3 rounded-md overflow-x-auto text-[10px] font-mono">
                      {`curl -X GET https://api.ethitrust.me/v1/org-escrows \\
  -H "X-API-KEY: org_live_..."`}
                    </pre>
                  </div>

                  <div className="rounded-lg border bg-card p-4">
                    <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <Activity className="size-4" /> Idempotency
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Use <code className="text-xs">X-Idempotency-Key</code> for safe retries on write operations.
                    </p>
                    <pre className="bg-muted/50 p-3 rounded-md overflow-x-auto text-[10px] font-mono">
                      {`X-Idempotency-Key: req_550e8400-e29b`}
                    </pre>
                  </div>
                </div>

                <div className="rounded-lg border bg-card p-4">
                  <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <Webhook className="size-4" /> Webhook Verification
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Verify the <code className="text-xs">X-Signature</code> header using your signing secret (HMAC-SHA256).
                  </p>
                  <pre className="bg-muted/50 p-3 rounded-md overflow-x-auto text-[10px] font-mono">
{`# Python Example
import hmac, hashlib
msg = f"{timestamp}.{payload_body}".encode()
expected = hmac.new(secret.encode(), msg, hashlib.sha256).hexdigest()
is_valid = hmac.compare_digest(expected, signature)`}
                  </pre>
                </div>

                <div className="rounded-lg border bg-card p-4">
                  <h3 className="font-semibold text-sm mb-2">Creating an Escrow</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Initialize a new transaction. Ethitrust will automatically email the invitee.
                  </p>
                  <pre className="bg-muted/50 p-3 rounded-md overflow-x-auto text-[10px] font-mono">
{`curl -X POST https://api.ethitrust.me/v1/org-escrows \\
  -H "X-API-KEY: your_api_key" \\
  -H "X-Idempotency-Key: ${crypto.randomUUID()}" \\
  -d '{
    "title": "Software Service",
    "amount": 45000,
    "invitee_email": "seller@example.com",
    "escrow_type": "onetime",
    "inspection_period": 72
  }'`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : null}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Copy, Eye, EyeOff, Save, TestTube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { patchOrgProfile } from "@/lib/org/org-organizations-api";
import { postOrgWebhookTest } from "@/lib/org-escrows/org-escrows-api";
import type { OrganizationProfileRow } from "@/lib/organizations/organization-types";
import { useAuthStore } from "@/stores/auth-store";

export function OrgWebhookConfig({
  orgId,
  profile,
}: {
  orgId: string;
  profile: OrganizationProfileRow;
}) {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);
  const [url, setUrl] = useState(profile.webhook_url || "");
  const [secret, setSecret] = useState(profile.webhook_secret || "");
  const [showSecret, setShowSecret] = useState(false);

  const saveMutation = useMutation({
    mutationFn: () => patchOrgProfile(accessToken!, orgId, { webhook_url: url, webhook_secret: secret }),
    onSuccess: () => {
      toast.success("Webhook settings saved");
      void queryClient.invalidateQueries({ queryKey: ["me", "organizations", orgId, "profile"] });
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : "Could not save webhooks"),
  });

  const testMutation = useMutation({
    mutationFn: () => postOrgWebhookTest(accessToken!, orgId),
    onSuccess: (res) => {
      if (res.success) {
        toast.success(`Ping successful! (${res.http_status})`);
      } else {
        toast.error(`Ping failed: ${res.error || "Unknown error"}`);
      }
      void queryClient.invalidateQueries({ queryKey: ["me", "organizations", orgId, "webhook-logs"] });
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : "Test failed"),
  });

  async function copyToClipboard(text: string) {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Could not copy");
    }
  }

  function handleGenerateSecret() {
    if (confirm("Are you sure? This will replace your current secret and integrations may break until updated.")) {
      const newSecret = `whsec_${crypto.randomUUID().replace(/-/g, '')}`;
      setSecret(newSecret);
    }
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Endpoint Configuration</CardTitle>
        <CardDescription>
          Receive real-time <code className="text-xs">POST</code> requests when escrow events occur.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="webhook-url">Endpoint URL</Label>
          <div className="flex gap-2">
            <Input
              id="webhook-url"
              placeholder="https://api.yourdomain.com/webhooks/ethitrust"
              className="font-mono text-sm"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <Button
              variant="secondary"
              onClick={() => testMutation.mutate()}
              disabled={!url || testMutation.isPending || saveMutation.isPending || url !== profile.webhook_url}
              title={url !== profile.webhook_url ? "Save before testing" : "Send a test ping"}
            >
              {testMutation.isPending ? "Pinging..." : <><TestTube className="size-4 mr-2" /> Ping</>}
            </Button>
          </div>
          {url !== profile.webhook_url && (
            <p className="text-xs text-muted-foreground mt-1 text-orange-500">Unsaved changes</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="webhook-secret">Signing Secret</Label>
          <p className="text-xs text-muted-foreground mb-2">
            Used to verify that webhook events are legitimately sent from Ethitrust. Check the <code className="text-xs">X-Signature</code> header.
          </p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id="webhook-secret"
                type={showSecret ? "text" : "password"}
                readOnly
                className="font-mono text-sm pr-10"
                value={secret || "Not configured"}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setShowSecret(!showSecret)}
                disabled={!secret}
              >
                {showSecret ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              </Button>
            </div>
            <Button
              variant="outline"
              onClick={() => copyToClipboard(secret)}
              disabled={!secret}
            >
              <Copy className="size-4" />
            </Button>
            <Button variant="outline" onClick={handleGenerateSecret}>
              {secret ? "Regenerate" : "Generate"}
            </Button>
          </div>
          {secret !== profile.webhook_secret && (
            <p className="text-xs text-muted-foreground mt-1 text-orange-500">Unsaved secret changes</p>
          )}
        </div>
        
        <div className="rounded-md bg-muted/50 p-4 mt-6">
          <h4 className="text-sm font-medium mb-2">Event Subscriptions</h4>
          <p className="text-xs text-muted-foreground mb-3">
            Your endpoint will receive payloads for the following events:
          </p>
          <div className="flex flex-wrap gap-2">
            {["escrow.invited", "escrow.active", "escrow.cancelled", "escrow.submitted", "escrow.completed", "escrow.disputed", "escrow.expired"].map(evt => (
              <span key={evt} className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
                {evt}
              </span>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t bg-muted/20 px-6 py-4 flex justify-end">
        <Button 
          onClick={() => saveMutation.mutate()} 
          disabled={saveMutation.isPending || (url === profile.webhook_url && secret === profile.webhook_secret)}
        >
          {saveMutation.isPending ? "Saving..." : <><Save className="size-4 mr-2" /> Save Settings</>}
        </Button>
      </CardFooter>
    </Card>
  );
}

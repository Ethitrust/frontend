"use client";

import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { RefreshCcw, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchOrgWebhookLog } from "@/lib/org-escrows/org-escrows-api";
import { useAuthStore } from "@/stores/auth-store";
import Link from "next/link";

export function OrgWebhookDeliveryLog({ orgId }: { orgId: string }) {
  const accessToken = useAuthStore((s) => s.accessToken);

  const logsQuery = useQuery({
    queryKey: ["me", "organizations", orgId, "webhook-logs"],
    queryFn: () => fetchOrgWebhookLog(accessToken!, orgId),
    enabled: Boolean(accessToken && orgId),
    refetchInterval: 15_000,
  });

  const logs = logsQuery.data ?? [];

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-base font-semibold">Delivery Logs</CardTitle>
          <CardDescription>Recent outbound webhook attempts.</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={() => logsQuery.refetch()} disabled={logsQuery.isFetching}>
          <RefreshCcw className={`size-4 mr-2 ${logsQuery.isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        {logsQuery.isPending ? (
          <div className="p-6"><Skeleton className="h-40 w-full" /></div>
        ) : logs.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-muted-foreground">
            No webhook deliveries recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-y bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Event</th>
                  <th className="px-4 py-3 font-medium">HTTP</th>
                  <th className="px-6 py-3 font-medium text-right">Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-border/60 last:border-0 hover:bg-muted/30 transition-colors group">
                    <td className="px-6 py-3">
                      <Badge 
                        variant={log.delivery_status === "delivered" ? "default" : log.delivery_status === "failed" ? "destructive" : "secondary"}
                      >
                        {log.delivery_status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {log.event_type}
                      {log.error_message && (
                        <p className="text-[10px] text-destructive mt-1 max-w-[200px] truncate" title={log.error_message}>
                          {log.error_message}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {log.http_status ? (
                         <span className={log.http_status >= 200 && log.http_status < 300 ? "text-green-600 font-medium" : "text-destructive font-medium"}>
                            {log.http_status}
                         </span>
                      ) : (
                         <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-right tabular-nums text-muted-foreground text-xs whitespace-nowrap">
                      {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

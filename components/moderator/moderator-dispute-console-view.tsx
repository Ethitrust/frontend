"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import { ChatAnalysesView } from "@/components/admin/chat-analyses-view";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  ExternalLink,
  Reply,
  RotateCcw,
  XIcon,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  fetchAdminDisputeThread,
  postAdminDisputeResolutionNote,
  postAdminDisputeAction,
  fetchAdminDisputeForensics,
  postAdminDisputeAnalyzeChat,
  postAdminEvidenceRerunEla,
  fetchAdminDisputeAnalyses,
} from "@/lib/admin/admin-platform-api";
import { postDisputeMessage } from "@/lib/disputes/me-disputes-api";
import { ethitrustThemeTokens } from "@/lib/ethitrust-theme";
import { cn } from "@/lib/utils";

/** Best-effort extraction of evidence identifiers from the opaque thread payload. */
function extractEvidenceOptions(
  threadData: unknown,
): { id: string; label: string }[] {
  if (!threadData || typeof threadData !== "object") return [];
  const data = threadData as Record<string, unknown>;

  const fromArray = (arr: unknown[]): { id: string; label: string }[] =>
    arr
      .map((ev) => {
        if (typeof ev === "string") return { id: ev, label: ev };
        if (ev && typeof ev === "object") {
          const e = ev as Record<string, unknown>;
          const id = String(e.evidence_id ?? e.id ?? e.evidenceId ?? "");
          if (!id) return null;
          const name = String(
            e.filename ?? e.file_name ?? e.type ?? e.label ?? e.name ?? "",
          );
          const label =
            name && name !== id
              ? `${name} (${id.slice(0, 8)}…)`
              : id.slice(0, 24);
          return { id, label };
        }
        return null;
      })
      .filter((x): x is { id: string; label: string } => Boolean(x && x.id));

  if (Array.isArray(data.evidence)) return fromArray(data.evidence);
  if (Array.isArray(data.evidence_items)) return fromArray(data.evidence_items);
  if (Array.isArray(data.evidence_ids)) {
    return data.evidence_ids
      .filter((id): id is string => typeof id === "string")
      .map((id) => ({ id, label: id }));
  }

  // Try messages array
  if (Array.isArray(data.messages)) {
    const ids = new Set<string>();
    data.messages.forEach((msg) => {
      if (!msg || typeof msg !== "object") return;
      const m = msg as Record<string, unknown>;
      const evId = String(m.evidence_id ?? m.evidenceId ?? "");
      if (evId) ids.add(evId);
      const attachments = m.attachments ?? m.evidence;
      if (Array.isArray(attachments)) {
        attachments.forEach((att) => {
          if (typeof att === "string") ids.add(att);
          else if (att && typeof att === "object") {
            const a = att as Record<string, unknown>;
            const id = String(a.evidence_id ?? a.id ?? a.evidenceId ?? "");
            if (id) ids.add(id);
          }
        });
      }
    });
    return Array.from(ids).map((id) => ({ id, label: id }));
  }

  return [];
}

type ThreadMessageReplyPreview = {
  message_id: string;
  text: string;
};

type ThreadMessage = {
  id: string;
  sender_id: string;
  sender_name: string | null;
  sender_email: string | null;
  sender_role: string | null;
  message_type: string;
  message: string;
  created_at: string;
  reply_to_message?: ThreadMessageReplyPreview | null;
};

type ChatAnalysisItem = {
  id: string;
  provider: string;
  model: string;
  status: string;
  risk_level: string | null;
  detected_intents: string[] | null;
  flagged_messages: unknown[] | null;
  summary: string | null;
  recommendation: string | null;
  error: string | null;
  message_count_analyzed: number;
  created_at: string;
  completed_at: string | null;
};

type ChatAnalysesResponse = {
  analyses?: ChatAnalysisItem[] | null;
  total?: number | null;
};

function formatDateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return String(iso);
  }
}

function normalizeRole(role: string | null | undefined) {
  const r = (role || "").toLowerCase();
  if (r === "buyer") return "buyer" as const;
  if (r === "seller") return "seller" as const;
  if (r === "moderator" || r === "mediator") return "moderator" as const;
  if (r === "admin") return "admin" as const;
  return "unknown" as const;
}

function roleLabel(role: string | null | undefined) {
  const r = normalizeRole(role);
  if (r === "buyer") return "Buyer";
  if (r === "seller") return "Seller";
  if (r === "moderator") return "Moderator";
  if (r === "admin") return "Admin";
  return role?.trim() ? role.trim() : "Unknown";
}

function latestCompletedAnalysis(data: unknown): ChatAnalysisItem | null {
  const payload = data as ChatAnalysesResponse | null;
  const analyses = payload?.analyses ?? [];
  const completed = analyses
    .filter((a) => (a.status || "").toLowerCase() === "completed" && !a.error)
    .sort(
      (a, b) =>
        new Date(b.completed_at ?? b.created_at).getTime() -
        new Date(a.completed_at ?? a.created_at).getTime(),
    );
  return completed[0] ?? null;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function ZoomableImage({
  src,
  alt,
  label,
  className,
  triggerClassName,
}: {
  src: string;
  alt: string;
  label?: string;
  className?: string;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(1);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setZoom(1);
      }}
    >
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "group relative block w-full overflow-hidden rounded-lg border border-border bg-muted/10",
          triggerClassName,
        )}
      >
        <img
          src={src}
          alt={alt}
          className={cn("h-full w-full object-contain", className)}
          loading="lazy"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-background/80 px-2 py-1 text-[10px] text-muted-foreground opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
          <span className="truncate">{label || "Click to zoom"}</span>
          <span className="inline-flex items-center gap-1">
            <ZoomIn className="size-3" aria-hidden />
            <span>Zoom</span>
          </span>
        </div>
      </button>

      <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>{label || "Image"}</DialogTitle>
          <DialogDescription className="truncate">{alt}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-full"
              onClick={() => setZoom((z) => clamp(z - 0.25, 0.5, 3))}
            >
              <ZoomOut className="size-4" aria-hidden />
              Zoom out
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-full"
              onClick={() => setZoom((z) => clamp(z + 0.25, 0.5, 3))}
            >
              <ZoomIn className="size-4" aria-hidden />
              Zoom in
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="rounded-full"
              onClick={() => setZoom(1)}
            >
              <RotateCcw className="size-4" aria-hidden />
              Reset
            </Button>
            <span className="text-xs tabular-nums text-muted-foreground">
              {Math.round(zoom * 100)}%
            </span>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="rounded-full"
            asChild
          >
            <a href={src} target="_blank" rel="noreferrer">
              <ExternalLink className="size-4" aria-hidden />
              Open original
            </a>
          </Button>
        </div>

        <div className="mt-3 h-[70vh] overflow-auto rounded-xl border border-border bg-muted/10 p-4">
          <div className="flex min-h-full items-center justify-center">
            <img
              src={src}
              alt={alt}
              className="max-w-none select-none"
              style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}
              draggable={false}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

type ThreadEvidence = {
  id: string;
  message_id: string | null;
  uploaded_by: string;
  uploaded_by_name: string | null;
  uploaded_by_email: string | null;
  uploaded_by_role: string | null;
  object_key: string;
  file_url: string;
  file_type: string;
  is_tampered: boolean | null;
  tamper_metadata: unknown;
  ela_status: string | null;
  ela_score: number | null;
  heatmap_object_key: string | null;
};

function ThreadSnapshotChat({
  data,
  isPending,
  errorMessage,
  onReplyTo,
}: {
  data: unknown;
  isPending?: boolean;
  errorMessage?: string | null;
  onReplyTo?: (msg: ThreadMessage) => void;
}) {
  if (isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-12 w-1/2" />
        <Skeleton className="h-12 w-2/3" />
      </div>
    );
  }
  if (errorMessage) {
    return <p className="text-sm text-destructive">{errorMessage}</p>;
  }

  const payload = data as {
    messages?: ThreadMessage[];
    evidence?: ThreadEvidence[];
  } | null;

  const messages = payload?.messages ?? [];
  const evidenceList = payload?.evidence ?? [];

  if (messages.length === 0 && evidenceList.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No thread data available.</p>
    );
  }

  const sortedMessages = [...messages].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );

  const evidenceByMessage = new Map<string, ThreadEvidence[]>();
  const orphanedEvidence: ThreadEvidence[] = [];

  evidenceList.forEach((ev) => {
    if (ev.message_id) {
      const arr = evidenceByMessage.get(ev.message_id);
      if (arr) arr.push(ev);
      else evidenceByMessage.set(ev.message_id, [ev]);
    } else {
      orphanedEvidence.push(ev);
    }
  });

  const initials = (name: string | null) =>
    (name || "?")
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const filenameFromKey = (key: string) => key.split("/").pop() || key;

  const evidenceMetaBadges = (ev: ThreadEvidence) => {
    const badges: ReactNode[] = [];
    if (ev.is_tampered) {
      badges.push(
        <Badge key="tampered" variant="destructive" className="rounded-full">
          Tampered
        </Badge>,
      );
    }
    if (ev.ela_status) {
      badges.push(
        <Badge key="ela" variant="secondary" className="rounded-full">
          ELA: {ev.ela_status}
        </Badge>,
      );
    }
    if (ev.ela_score !== null && ev.ela_score !== undefined) {
      badges.push(
        <Badge key="score" variant="outline" className="rounded-full">
          Score: {ev.ela_score}
        </Badge>,
      );
    }
    return badges;
  };

  const messageAlignClass = (role: string | null) => {
    const r = normalizeRole(role);
    if (r === "seller") return "justify-end";
    if (r === "buyer") return "justify-start";
    return "justify-center";
  };

  const bubbleClass = (role: string | null) => {
    const r = normalizeRole(role);
    if (r === "seller") return "bg-card border-border";
    if (r === "buyer") return "bg-muted/25 border-border";
    return "bg-background border-border border-dashed";
  };

  return (
    <div className="max-h-[min(72vh,640px)] overflow-auto space-y-4 rounded-xl border border-border bg-muted/10 p-4">
      {sortedMessages.map((msg) => {
        const attached = evidenceByMessage.get(msg.id) ?? [];
        const r = normalizeRole(msg.sender_role);
        const align = messageAlignClass(msg.sender_role);
        const roleText = roleLabel(msg.sender_role);
        return (
          <div key={msg.id} className={cn("flex", align)}>
            <div
              className={cn(
                "flex w-full max-w-215 flex-col gap-2",
                r === "seller" && "items-end",
              )}
            >
              <div
                className={cn(
                  "flex items-center gap-2 text-[11px] text-muted-foreground",
                  r === "seller" && "justify-end",
                )}
              >
                {r !== "seller" ? (
                  <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border border-border bg-background text-[10px] font-semibold text-foreground">
                    {initials(msg.sender_name)}
                  </div>
                ) : null}
                <span className="font-semibold text-foreground">
                  {msg.sender_name || "Unknown"}
                </span>
                <Badge variant="secondary" className="rounded-full">
                  {roleText}
                </Badge>
                {msg.sender_email ? (
                  <span className="truncate">{msg.sender_email}</span>
                ) : null}
                <span className="ml-auto tabular-nums">
                  {formatDateTime(msg.created_at)}
                </span>
                {r === "seller" ? (
                  <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border border-border bg-background text-[10px] font-semibold text-foreground">
                    {initials(msg.sender_name)}
                  </div>
                ) : null}
              </div>

              {msg.reply_to_message ? (
                <div
                  className={cn(
                    "max-w-[85%] rounded-lg border border-border bg-background/60 px-3 py-2 text-xs text-muted-foreground",
                    r === "seller" && "ml-auto",
                  )}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wider">
                    Replying to
                  </p>
                  <p className="mt-1 line-clamp-2">
                    {msg.reply_to_message.text}
                  </p>
                </div>
              ) : null}

              <div
                className={cn(
                  "max-w-[85%] rounded-2xl border px-3 py-2 text-sm leading-relaxed text-foreground shadow-sm whitespace-pre-wrap",
                  bubbleClass(msg.sender_role),
                  r === "seller"
                    ? "rounded-tr-md"
                    : r === "buyer"
                      ? "rounded-tl-md"
                      : "rounded-tl-md rounded-tr-md",
                )}
              >
                {msg.message}
              </div>

              {attached.length > 0 ? (
                <div
                  className={cn(
                    "grid max-w-[85%] gap-2",
                    r === "seller" && "ml-auto",
                  )}
                >
                  {attached.map((ev) => {
                    const isImage = ev.file_type?.startsWith("image/");
                    const title = filenameFromKey(ev.object_key);
                    return (
                      <div
                        key={ev.id}
                        className="rounded-xl border border-border bg-background/80 p-3"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p
                              className="truncate text-xs font-semibold text-foreground"
                              title={title}
                            >
                              {title}
                            </p>
                            <p className="mt-0.5 text-[11px] text-muted-foreground">
                              Uploaded by {ev.uploaded_by_name || "Unknown"} ·{" "}
                              {roleLabel(ev.uploaded_by_role)}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center justify-end gap-1.5">
                            {evidenceMetaBadges(ev)}
                          </div>
                        </div>
                        <div className="mt-2">
                          {isImage ? (
                            <ZoomableImage
                              src={ev.file_url}
                              alt={title}
                              label="Evidence image"
                              className="max-h-64"
                            />
                          ) : (
                            <a
                              href={ev.file_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                            >
                              <ExternalLink className="size-4" aria-hidden />
                              <span className="truncate">Open file</span>
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}

              {onReplyTo ? (
                <div className={cn("max-w-[85%]", r === "seller" && "ml-auto")}>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => onReplyTo(msg)}
                  >
                    <Reply className="size-3" aria-hidden /> Reply
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        );
      })}

      {orphanedEvidence.length > 0 && (
        <div className="space-y-3 border-t border-border pt-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Evidence without linked message
          </h4>
          {orphanedEvidence.map((ev) => (
            <div
              key={ev.id}
              className="rounded-lg border border-border bg-background p-3 space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  Evidence from {ev.uploaded_by_name || "Unknown"}
                </span>
                <Badge variant="secondary" className="rounded-full">
                  {roleLabel(ev.uploaded_by_role)}
                </Badge>
              </div>
              {ev.file_type?.startsWith("image/") ? (
                <ZoomableImage
                  src={ev.file_url}
                  alt={ev.object_key}
                  label="Evidence image"
                  className="max-h-64"
                />
              ) : (
                <a
                  href={ev.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="block text-sm font-medium text-primary hover:underline"
                >
                  {ev.object_key.split("/").pop() || ev.object_key}
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

type ForensicsEvidenceResult = {
  evidence_id: string;
  dispute_id: string;
  object_key: string;
  file_type: string;
  ela_status: string;
  ela_score: number | null;
  heatmap_object_key: string | null;
  heatmap_url: string | null;
  is_tampered: boolean | null;
  tamper_metadata: unknown;
  ela_error: string | null;
  ela_completed_at: string | null;
};

type ForensicsResponse = {
  dispute_id: string;
  evidence_results: ForensicsEvidenceResult[];
  total: number;
};

function ForensicsResultsView({
  data,
  threadData,
  isPending,
  errorMessage,
}: {
  data: unknown;
  threadData?: unknown;
  isPending?: boolean;
  errorMessage?: string | null;
}) {
  if (isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }
  if (errorMessage) {
    return <p className="text-sm text-destructive">{errorMessage}</p>;
  }

  const payload = data as ForensicsResponse | null;
  const results = payload?.evidence_results ?? [];

  const threadPayload = threadData as { evidence?: ThreadEvidence[] } | null;
  const evidenceById = new Map(
    (threadPayload?.evidence ?? []).map((ev) => [ev.id, ev] as const),
  );

  if (results.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No forensics results available.
      </p>
    );
  }

  const formatTime = (iso: string | null) =>
    iso
      ? new Intl.DateTimeFormat("en-GB", {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(iso))
      : "—";

  const filename = (key: string) => key.split("/").pop() || key;

  const statusBadge = (status: string, error: string | null) => {
    if (error) {
      return (
        <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700">
          Failed
        </span>
      );
    }
    const s = status.toLowerCase();
    if (s === "completed") {
      return (
        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
          Completed
        </span>
      );
    }
    if (s === "pending" || s === "running" || s === "queued") {
      return (
        <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
          {status}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
        {status}
      </span>
    );
  };

  const scoreBar = (score: number | null) => {
    if (score === null || score === undefined) return null;
    const pct = Math.min(Math.max(score * 100, 0), 100);
    let barColor = "bg-emerald-500";
    if (pct > 30) barColor = "bg-amber-500";
    if (pct > 60) barColor = "bg-red-500";
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-foreground">ELA Score</span>
          <span className="font-semibold tabular-nums text-foreground">
            {score.toFixed(4)}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-2 rounded-full", barColor)}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {results.map((ev) => (
        <div
          key={ev.evidence_id}
          className="rounded-xl border border-border bg-background p-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p
                className="truncate text-sm font-semibold text-foreground"
                title={filename(ev.object_key)}
              >
                {filename(ev.object_key)}
              </p>
              <p className="text-[10px] text-muted-foreground font-mono truncate">
                {ev.evidence_id}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {statusBadge(ev.ela_status, ev.ela_error)}
              {ev.is_tampered && (
                <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700">
                  Tampered
                </span>
              )}
            </div>
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_260px]">
            {(() => {
              const original =
                evidenceById.get(ev.evidence_id)?.file_url ?? null;
              if (!original) return null;
              return (
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Original
                  </p>
                  <ZoomableImage
                    src={original}
                    alt={filename(ev.object_key)}
                    label="Original evidence"
                    className="max-h-72"
                  />
                </div>
              );
            })()}

            {ev.heatmap_url ? (
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  ELA heatmap
                </p>
                <ZoomableImage
                  src={ev.heatmap_url}
                  alt={`ELA heatmap for ${filename(ev.object_key)}`}
                  label="ELA heatmap"
                  className="max-h-72"
                />
              </div>
            ) : null}

            <div className="flex flex-col justify-center space-y-3">
              {scoreBar(ev.ela_score)}

              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>File type</span>
                  <span className="font-medium text-foreground">
                    {ev.file_type}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Completed</span>
                  <span className="font-medium text-foreground">
                    {formatTime(ev.ela_completed_at)}
                  </span>
                </div>
                {ev.heatmap_object_key && (
                  <div className="flex justify-between">
                    <span>Heatmap key</span>
                    <span
                      className="truncate max-w-48 font-mono text-[10px] text-foreground"
                      title={ev.heatmap_object_key}
                    >
                      {filename(ev.heatmap_object_key)}
                    </span>
                  </div>
                )}
              </div>

              {ev.ela_error && (
                <div className="rounded-md bg-red-50 p-2 text-xs text-red-700">
                  <p className="font-semibold">Error</p>
                  <p>{ev.ela_error}</p>
                </div>
              )}

              {Boolean(ev.tamper_metadata) && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                    Tamper metadata
                  </summary>
                  <pre className="mt-1 max-h-32 overflow-auto rounded-md bg-muted/40 p-2 text-[10px] font-mono whitespace-pre-wrap">
                    {JSON.stringify(ev.tamper_metadata, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      ))}
      <p className="text-xs text-muted-foreground">
        Total results: {payload?.total ?? results.length}
      </p>
    </div>
  );
}

export function ModeratorDisputeConsoleView({
  accessToken,
  disputeId,
}: {
  accessToken: string;
  disputeId: string;
}) {
  const e = ethitrustThemeTokens;
  const qc = useQueryClient();

  const threadQuery = useQuery({
    queryKey: ["moderator", "disputes", disputeId, "thread"],
    queryFn: () => fetchAdminDisputeThread(accessToken, disputeId),
    enabled: Boolean(accessToken && disputeId),
  });

  const forensicsQuery = useQuery({
    queryKey: ["moderator", "disputes", disputeId, "forensics"],
    queryFn: () => fetchAdminDisputeForensics(accessToken, disputeId),
    enabled: Boolean(accessToken && disputeId),
  });

  const analysesQuery = useQuery({
    queryKey: ["moderator", "disputes", disputeId, "analyses"],
    queryFn: () => fetchAdminDisputeAnalyses(accessToken, disputeId),
    enabled: Boolean(accessToken && disputeId),
  });

  const [resolutionNote, setResolutionNote] = useState("");
  const [winner, setWinner] = useState<"buyer" | "seller">("buyer");
  const [resolutionDecisionNote, setResolutionDecisionNote] = useState("");
  const [evidenceId, setEvidenceId] = useState("");
  const [moderatorMessage, setModeratorMessage] = useState("");
  const [replyTo, setReplyTo] = useState<ThreadMessage | null>(null);

  const invalidateThread = () => {
    void qc.invalidateQueries({
      queryKey: ["moderator", "disputes", disputeId, "thread"],
    });
  };

  const invalidateForensics = () => {
    void qc.invalidateQueries({
      queryKey: ["moderator", "disputes", disputeId, "forensics"],
    });
  };

  const invalidateAnalyses = () => {
    void qc.invalidateQueries({
      queryKey: ["moderator", "disputes", disputeId, "analyses"],
    });
  };

  const noteMutation = useMutation({
    mutationFn: () =>
      postAdminDisputeResolutionNote(accessToken, disputeId, {
        note: resolutionNote.trim() || "(empty note)",
      }),
    onSuccess: () => {
      toast.success("Resolution note added");
      setResolutionNote("");
      invalidateThread();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const resolveMutation = useMutation({
    mutationFn: () =>
      postAdminDisputeAction(accessToken, disputeId, {
        action: `resolve_${winner}`,
        note: resolutionDecisionNote.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success(`Dispute resolved in favor of ${winner}`);
      setResolutionDecisionNote("");
      invalidateThread();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const analyzeChatMutation = useMutation({
    mutationFn: () => postAdminDisputeAnalyzeChat(accessToken, disputeId),
    onSuccess: () => {
      toast.success("Chat analysis complete");
      invalidateAnalyses();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const rerunElaMutation = useMutation({
    mutationFn: () => postAdminEvidenceRerunEla(accessToken, evidenceId.trim()),
    onSuccess: () => {
      toast.success("ELA analysis queued");
      invalidateForensics();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const sendMessageMutation = useMutation({
    mutationFn: () =>
      postDisputeMessage(accessToken, disputeId, {
        message: moderatorMessage.trim(),
        message_type: "text",
        reply_to_message_id: replyTo?.id ?? null,
      }),
    onSuccess: () => {
      toast.success("Message sent");
      setModeratorMessage("");
      setReplyTo(null);
      invalidateThread();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const threadErr =
    threadQuery.isError && threadQuery.error instanceof Error
      ? threadQuery.error.message
      : null;

  const analysis = latestCompletedAnalysis(analysesQuery.data);
  const analysisSummary =
    analysis?.summary ||
    "AI analysis summarizes the buyer/seller chat context that happened before the dispute was opened.";
  const analysisRecommendation =
    analysis?.recommendation ||
    "Use this summary to decide what evidence to request next or whether to proceed with a final resolution.";

  return (
    <div className={cn(e.layout.container, "py-8 lg:py-12")}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <header className="max-w-2xl">
          <p className={cn(e.typography.eyebrow, "text-muted-foreground")}>
            Disputes
          </p>
          <h1
            className={cn(
              e.typography.displayLG,
              "mt-2 font-serif font-normal text-foreground",
            )}
          >
            Dispute console
          </h1>
          <p className="mt-2 break-all font-mono text-xs text-muted-foreground">
            {disputeId}
          </p>
        </header>
        <Button variant="outline" className="shrink-0 rounded-full" asChild>
          <Link href="/moderator/disputes/assigned">Back to assigned</Link>
        </Button>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Conversation
              </CardTitle>
              <CardDescription>
                Messaging-style view of the dispute conversation. Buyer messages
                are left, Seller messages are right, and Moderator messages are
                centered.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ThreadSnapshotChat
                data={threadQuery.data}
                isPending={threadQuery.isPending}
                errorMessage={threadErr}
                onReplyTo={(msg) => setReplyTo(msg)}
              />

              <div className="border-t border-border pt-4 space-y-2">
                {replyTo && (
                  <div className="flex items-start justify-between gap-2 rounded-lg border border-border bg-muted/30 p-3 text-sm">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-muted-foreground">
                        Replying to
                      </p>
                      <p className="mt-1 line-clamp-2 text-muted-foreground">
                        {replyTo.message}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setReplyTo(null)}
                    >
                      <XIcon
                        className="size-4"
                        aria-label="Clear reply target"
                      />
                    </Button>
                  </div>
                )}
                <Label
                  htmlFor="mod-message"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  Send message as moderator
                </Label>
                <div className="flex gap-2">
                  <Textarea
                    id="mod-message"
                    rows={2}
                    value={moderatorMessage}
                    onChange={(ev) => setModeratorMessage(ev.target.value)}
                    placeholder="Type a message to the dispute thread…"
                    className="min-h-[unset] resize-none"
                    disabled={sendMessageMutation.isPending}
                    onKeyDown={(ev) => {
                      if (ev.key === "Enter" && !ev.shiftKey) {
                        ev.preventDefault();
                        if (moderatorMessage.trim())
                          sendMessageMutation.mutate();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    disabled={
                      !moderatorMessage.trim() || sendMessageMutation.isPending
                    }
                    onClick={() => sendMessageMutation.mutate()}
                    className="shrink-0 self-end"
                  >
                    {sendMessageMutation.isPending ? "Sending…" : "Send"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="text-base font-semibold">
                  Evidence & ELA forensics
                </CardTitle>
                <CardDescription>
                  Run Error Level Analysis (ELA) on an evidence bundle and
                  review the heatmap side-by-side with the original.
                </CardDescription>
              </div>
              <div className="w-full max-w-sm space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Evidence bundle
                </Label>
                {(() => {
                  const evidenceOptions = extractEvidenceOptions(
                    threadQuery.data,
                  );
                  if (threadQuery.isPending) {
                    return <Skeleton className="h-9 w-full" />;
                  }
                  if (evidenceOptions.length === 0) {
                    return (
                      <p className="text-xs text-muted-foreground">
                        No evidence identifiers detected in this thread.
                      </p>
                    );
                  }
                  return (
                    <div className="flex gap-2">
                      <Select value={evidenceId} onValueChange={setEvidenceId}>
                        <SelectTrigger
                          size="sm"
                          className="w-full cursor-pointer"
                        >
                          <SelectValue placeholder="Select…" />
                        </SelectTrigger>
                        <SelectContent>
                          {evidenceOptions.map((opt) => (
                            <SelectItem key={opt.id} value={opt.id}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="shrink-0"
                        disabled={
                          !evidenceId.trim() || rerunElaMutation.isPending
                        }
                        onClick={() => rerunElaMutation.mutate()}
                      >
                        {rerunElaMutation.isPending ? "Queueing…" : "Run ELA"}
                      </Button>
                    </div>
                  );
                })()}
              </div>
            </CardHeader>
            <CardContent>
              <ForensicsResultsView
                data={forensicsQuery.data}
                threadData={threadQuery.data}
                isPending={forensicsQuery.isPending}
                errorMessage={
                  forensicsQuery.isError &&
                  forensicsQuery.error instanceof Error
                    ? forensicsQuery.error.message
                    : null
                }
              />
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="text-base font-semibold">
                  AI pre-dispute chat summary
                </CardTitle>
                <CardDescription>
                  This analysis summarizes buyer/seller chat context before the
                  dispute was opened, helping you spot intent, contradictions,
                  and missing evidence.
                </CardDescription>
              </div>
              <Button
                type="button"
                size="sm"
                disabled={analyzeChatMutation.isPending}
                onClick={() => analyzeChatMutation.mutate()}
              >
                {analyzeChatMutation.isPending
                  ? "Analyzing…"
                  : "Refresh summary"}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Summary
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                    {analysisSummary}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-muted/25 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Recommendation
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                    {analysisRecommendation}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Stored analyses
                </p>
                <ChatAnalysesView
                  data={analysesQuery.data}
                  isPending={analysesQuery.isPending}
                  errorMessage={
                    analysesQuery.isError &&
                    analysesQuery.error instanceof Error
                      ? analysesQuery.error.message
                      : null
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Case snapshot
              </CardTitle>
              <CardDescription>
                Quick stats and a starting point.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {threadQuery.isPending ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : (
                (() => {
                  const thread = threadQuery.data as {
                    messages?: ThreadMessage[];
                    evidence?: ThreadEvidence[];
                  } | null;
                  const messages = thread?.messages ?? [];
                  const evidence = thread?.evidence ?? [];
                  const forensics =
                    forensicsQuery.data as ForensicsResponse | null;
                  const tampered = (forensics?.evidence_results ?? []).filter(
                    (r) => Boolean(r.is_tampered),
                  ).length;

                  return (
                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded-lg border border-border bg-muted/25 p-3">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          Messages
                        </p>
                        <p className="mt-1 text-lg font-semibold text-foreground">
                          {messages.length}
                        </p>
                      </div>
                      <div className="rounded-lg border border-border bg-muted/25 p-3">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          Evidence
                        </p>
                        <p className="mt-1 text-lg font-semibold text-foreground">
                          {evidence.length}
                        </p>
                      </div>
                      <div className="rounded-lg border border-border bg-muted/25 p-3">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          Tampered
                        </p>
                        <p className="mt-1 text-lg font-semibold text-foreground">
                          {tampered}
                        </p>
                      </div>
                    </div>
                  );
                })()
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Moderator actions
              </CardTitle>
              <CardDescription>Notes and final resolution.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="mod-note">Resolution note</Label>
                <Textarea
                  id="mod-note"
                  rows={3}
                  value={resolutionNote}
                  onChange={(ev) => setResolutionNote(ev.target.value)}
                  placeholder="Internal note surfaced on the dispute ledger"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={noteMutation.isPending}
                  onClick={() => noteMutation.mutate()}
                >
                  Add note
                </Button>
              </div>

              <div className="space-y-3 border-t border-border pt-5">
                <p className="text-sm font-semibold text-foreground">
                  Resolve dispute
                </p>
                <p className="text-xs text-muted-foreground">
                  Your decision is final. Choose the winning party and record a
                  clear justification.
                </p>
                <div className="space-y-2">
                  <Label>Resolution</Label>
                  <Select
                    value={winner}
                    onValueChange={(v) => setWinner(v as "buyer" | "seller")}
                  >
                    <SelectTrigger size="sm" className="w-full cursor-pointer">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buyer">
                        Resolve in favor of Buyer
                      </SelectItem>
                      <SelectItem value="seller">
                        Resolve in favor of Seller
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="resolution-note">Justification</Label>
                  <Textarea
                    id="resolution-note"
                    rows={3}
                    value={resolutionDecisionNote}
                    onChange={(ev) =>
                      setResolutionDecisionNote(ev.target.value)
                    }
                    placeholder="Required: explain the rationale for this resolution decision"
                  />
                </div>
                <Button
                  type="button"
                  className="w-full"
                  disabled={
                    !resolutionDecisionNote.trim() || resolveMutation.isPending
                  }
                  onClick={() => resolveMutation.mutate()}
                >
                  {resolveMutation.isPending
                    ? "Submitting…"
                    : "Submit final resolution"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

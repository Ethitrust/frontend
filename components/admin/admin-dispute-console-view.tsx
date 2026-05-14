"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import {
  Bot,
  ExternalLink,
  FileText,
  ImageIcon,
  RotateCcw,
  ShieldAlert,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  fetchAdminDisputeAnalyses,
  fetchAdminDisputeThread,
  postAdminDisputeAction,
  postAdminDisputeAssignMediator,
  postAdminDisputeResolutionNote,
  fetchAdminDisputeForensics,
  postAdminDisputeAnalyzeChat,
  fetchAdminDisputeDetail,
  fetchAdminEscrowMessages,
  postAdminDisputeMessage,
} from "@/lib/admin/admin-platform-api";
import { ethitrustThemeTokens } from "@/lib/ethitrust-theme";
import { cn } from "@/lib/utils";

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
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

function filenameFromKey(key: string) {
  return key.split("/").pop() || key;
}

function isRenderableUrl(url: string | null | undefined) {
  if (!url) return false;
  return /^https?:\/\//i.test(url) || url.startsWith("/");
}

function mediaUrl(url: string | null | undefined) {
  return isRenderableUrl(url) ? url : null;
}

function getEvidenceVerdict(
  result?: Pick<
    ForensicsEvidenceResult,
    "ela_score" | "ela_status" | "is_tampered" | "ela_error"
  > | null,
) {
  if (!result) {
    return {
      label: "Not analyzed",
      detail: "No image forensics result is available yet.",
      className: "bg-muted text-muted-foreground",
    };
  }
  if (result.ela_error) {
    return {
      label: "Analysis failed",
      detail:
        "The image could not be checked. Re-run analysis before making a decision.",
      className: "bg-red-100 text-red-700",
    };
  }
  // With top-1% mean scoring, values are higher but more focused.
  // Backend auto-flags is_tampered at > 40.0.
  const score = result.ela_score ?? 0;

  if (result.is_tampered || score >= 40.0) {
    return {
      label: "Definitely edited",
      detail:
        "Strong pixel inconsistencies were detected. Review the highlighted heatmap area.",
      className: "bg-red-100 text-red-700",
    };
  }
  if (score >= 18.0) {
    return {
      label: "Likely edited",
      detail:
        "The heatmap shows suspicious compression differences that may indicate modification.",
      className: "bg-amber-100 text-amber-800",
    };
  }
  if (score >= 8.0) {
    return {
      label: "Needs review",
      detail:
        "Some artifacts were found, but they are not conclusive on their own.",
      className: "bg-sky-100 text-sky-800",
    };
  }
  if (result.ela_status?.toLowerCase() === "completed") {
    return {
      label: "No clear edit detected",
      detail:
        "The image does not show strong signs of manipulation in the current analysis.",
      className: "bg-emerald-100 text-emerald-800",
    };
  }
  return {
    label: "Analysis pending",
    detail: "The image is queued or still being processed.",
    className: "bg-amber-100 text-amber-800",
  };
}

function ImagePreview({
  src,
  alt,
  className,
  emptyLabel = "Image unavailable",
}: {
  src?: string | null;
  alt: string;
  className?: string;
  emptyLabel?: string;
}) {
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const resolvedSrc = mediaUrl(src);

  if (!resolvedSrc || failed) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-md bg-background text-muted-foreground",
          className,
        )}
      >
        <div className="px-4 text-center">
          <ImageIcon className="mx-auto size-6" aria-hidden />
          <p className="mt-2 text-xs">{emptyLabel}</p>
          {src && (
            <a
              href={src}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex text-xs font-medium text-primary hover:underline"
            >
              Open file
            </a>
          )}
        </div>
      </div>
    );
  }

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
          "group relative block overflow-hidden rounded-md bg-background",
          className,
        )}
      >
        <img
          src={resolvedSrc}
          alt={alt}
          className="h-full w-full object-contain"
          loading="lazy"
          onError={() => setFailed(true)}
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-background/80 px-2 py-1 text-[10px] text-muted-foreground opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
          <span className="truncate">Click to zoom</span>
          <span className="inline-flex items-center gap-1">
            <ZoomIn className="size-3" aria-hidden />
            <span>Zoom</span>
          </span>
        </div>
      </button>

      <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Image</DialogTitle>
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
            <a href={resolvedSrc} target="_blank" rel="noreferrer">
              <ExternalLink className="size-4" aria-hidden />
              Open original
            </a>
          </Button>
        </div>

        <div className="mt-3 h-[70vh] overflow-auto rounded-xl border border-border bg-muted/10 p-4">
          <div className="flex min-h-full items-center justify-center">
            <img
              src={resolvedSrc}
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
  recipient_id?: string | null;
  message_type: string;
  message: string;
  created_at: string;
  reply_to_message?: ThreadMessageReplyPreview | null;
};

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

function formatDateTime(iso: string | null) {
  return iso
    ? new Intl.DateTimeFormat("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(iso))
    : "-";
}

function roleBadgeClass(role: string | null) {
  switch (role?.toLowerCase()) {
    case "buyer":
      return "bg-sky-100 text-sky-800";
    case "seller":
      return "bg-emerald-100 text-emerald-800";
    case "moderator":
    case "admin":
      return "bg-violet-100 text-violet-800";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function PartyChannelChat({
  label,
  role,
  partyId,
  mediatorId,
  messages,
  evidence,
  forensicsData,
  accessToken,
  disputeId,
}: {
  label: string;
  role: "buyer" | "seller";
  partyId: string | null;
  mediatorId: string | null;
  messages: ThreadMessage[];
  evidence: ThreadEvidence[];
  forensicsData?: ForensicsResponse | null;
  accessToken: string;
  disputeId: string;
}) {
  const qc = useQueryClient();
  const [draft, setDraft] = useState("");

  const sendMutation = useMutation({
    mutationFn: () =>
      postAdminDisputeMessage(accessToken, disputeId, {
        message: draft.trim(),
        recipient_id: partyId,
      }),
    onSuccess: async () => {
      setDraft("");
      await qc.invalidateQueries({
        queryKey: ["admin", "disputes", disputeId, "thread"],
      });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Filter to messages in this private channel:
  // sender=party & recipient=mediator, or sender=mediator & recipient=party,
  // or system (recipient_id null — visible to all)
  const channelMessages = messages
    .filter((m) => {
      const senderId = m.sender_id;
      const recipientId = m.recipient_id ?? null;
      if (recipientId === null) return true; // system / legacy
      if (!partyId) return true;
      return (
        (senderId === partyId && recipientId === mediatorId) ||
        (senderId === mediatorId && recipientId === partyId)
      );
    })
    .sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );

  const forensicsByEvidenceId = new Map(
    (forensicsData?.evidence_results ?? []).map((result) => [
      result.evidence_id,
      result,
    ]),
  );
  const evidenceByMessage = new Map<string, ThreadEvidence[]>();
  evidence.forEach((ev) => {
    if (!ev.message_id) return;
    evidenceByMessage.set(ev.message_id, [
      ...(evidenceByMessage.get(ev.message_id) ?? []),
      ev,
    ]);
  });

  const initials = (name: string | null) =>
    (name || "?")
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const EvidenceAttachment = ({ ev }: { ev: ThreadEvidence }) => {
    const isImage = ev.file_type?.startsWith("image/");
    const verdict = getEvidenceVerdict(forensicsByEvidenceId.get(ev.id));
    return (
      <div className="overflow-hidden rounded-lg border border-border bg-background/80">
        <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/25 px-3 py-2">
          <p className="truncate text-xs font-medium text-foreground">
            {filenameFromKey(ev.object_key)}
          </p>
          {forensicsByEvidenceId.has(ev.id) && (
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
                verdict.className,
              )}
            >
              {verdict.label}
            </span>
          )}
        </div>
        {isImage ? (
          <div className="bg-muted/20 p-3">
            <ImagePreview
              src={ev.file_url}
              alt={ev.object_key}
              className="h-36 w-full"
            />
          </div>
        ) : (
          <a
            href={ev.file_url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 p-3 text-sm font-medium text-primary hover:underline"
          >
            <FileText className="size-4 shrink-0" aria-hidden />
            <span className="truncate">{filenameFromKey(ev.object_key)}</span>
          </a>
        )}
      </div>
    );
  };

  const headerColor =
    role === "buyer"
      ? "border-sky-200 bg-sky-50 text-sky-800"
      : "border-emerald-200 bg-emerald-50 text-emerald-800";

  return (
    <div className="flex flex-1 min-w-0 flex-col rounded-2xl border border-border bg-card/30 backdrop-blur-sm overflow-hidden shadow-sm transition-all hover:shadow-md">
      <div
        className={cn(
          "flex items-center gap-3 border-b px-6 py-4 text-sm font-bold uppercase tracking-widest",
          headerColor,
        )}
      >
        <span className="flex items-center gap-2">
          <div
            className={cn(
              "size-2 rounded-full",
              role === "buyer" ? "bg-sky-500" : "bg-emerald-500",
            )}
          />
          {label}
        </span>
        <Badge
          variant="secondary"
          className="rounded-full px-3 py-1 text-[10px]"
        >
          {role === "buyer" ? "Buyer" : "Seller"}
        </Badge>
        <span className="ml-auto text-xs font-normal opacity-70">
          {channelMessages.length} messages
        </span>
      </div>
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="h-150 flex-1 space-y-6 overflow-y-auto bg-muted/5 p-6 custom-scrollbar">
          <div className="mb-6 rounded-xl border border-border/50 bg-background/50 px-4 py-3 text-xs text-muted-foreground shadow-sm">
            <p className="flex items-center gap-2">
              <ShieldAlert className="size-3 text-primary" />
              <span>
                Private channel between{" "}
                <span className="font-bold text-foreground">
                  {role === "buyer" ? "Buyer" : "Seller"}
                </span>{" "}
                and <span className="font-bold text-foreground">Moderator</span>
                .
              </span>
            </p>
          </div>
          {channelMessages.length === 0 ? (
            <p className="py-8 text-center text-xs text-muted-foreground">
              No messages in this channel yet.
            </p>
          ) : (
            channelMessages.map((msg) => {
              const attached = evidenceByMessage.get(msg.id) ?? [];
              const isMediator = msg.sender_id === mediatorId;
              const isSystem =
                msg.message_type?.toLowerCase() === "system" ||
                (msg.sender_role ?? "").toLowerCase() === "system";
              return (
                <article
                  key={msg.id}
                  className={cn(
                    "flex gap-4 group",
                    isMediator && "flex-row-reverse",
                  )}
                >
                  <div
                    className={cn(
                      "mt-1 flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-bold shadow-sm transition-transform group-hover:scale-110",
                      isMediator
                        ? "bg-violet-600 text-white"
                        : role === "buyer"
                          ? "bg-sky-600 text-white"
                          : "bg-emerald-600 text-white",
                    )}
                  >
                    {initials(msg.sender_name)}
                  </div>
                  <div className={cn("min-w-0 max-w-[75%] space-y-2")}>
                    <div
                      className={cn(
                        "flex flex-wrap items-center gap-2 text-xs text-muted-foreground",
                        isMediator && "justify-end",
                      )}
                    >
                      <span className="font-bold text-foreground">
                        {msg.sender_name || (isMediator ? "Moderator" : role)}
                      </span>
                      <span className="text-[10px] opacity-60">
                        {formatDateTime(msg.created_at)}
                      </span>
                    </div>
                    <div
                      className={cn(
                        "rounded-2xl border px-4 py-3 text-sm leading-relaxed shadow-sm whitespace-pre-wrap transition-colors",
                        isMediator
                          ? "rounded-tr-none border-violet-500/20 bg-violet-600 text-white"
                          : "rounded-tl-none border-border bg-background text-foreground group-hover:bg-accent/5",
                      )}
                    >
                      {msg.message}
                    </div>
                    {attached.length > 0 && (
                      <div className="grid gap-3 pt-2">
                        {attached.map((ev) => (
                          <div key={ev.id} className="max-w-sm">
                            <EvidenceAttachment ev={ev} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </div>

        <div className="border-t border-border bg-background/50 p-4 backdrop-blur-md">
          <div className="flex items-end gap-3">
            <Textarea
              rows={2}
              value={draft}
              onChange={(ev) => setDraft(ev.target.value)}
              placeholder={`Send private message to ${role}...`}
              className="flex-1 min-h-15 resize-none text-sm rounded-xl border-border bg-background shadow-inner focus-visible:ring-primary/30"
              onKeyDown={(ev) => {
                if (ev.key === "Enter" && !ev.shiftKey) {
                  ev.preventDefault();
                  if (draft.trim()) sendMutation.mutate();
                }
              }}
            />
            <Button
              size="lg"
              disabled={!draft.trim() || sendMutation.isPending}
              onClick={() => sendMutation.mutate()}
              className="shrink-0 h-15 w-15 rounded-xl shadow-lg transition-transform active:scale-95"
            >
              {sendMutation.isPending ? "..." : "Send"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ThreadSnapshotChat({
  data,
  forensicsData,
  isPending,
  errorMessage,
}: {
  data: unknown;
  forensicsData?: unknown;
  isPending?: boolean;
  errorMessage?: string | null;
}) {
  if (isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-4/5 rounded-xl" />
        <Skeleton className="ml-auto h-20 w-3/5 rounded-xl" />
        <Skeleton className="h-24 w-2/3 rounded-xl" />
      </div>
    );
  }
  if (errorMessage)
    return <p className="text-sm text-destructive">{errorMessage}</p>;

  const payload = data as {
    messages?: ThreadMessage[];
    evidence?: ThreadEvidence[];
    participants?: { user_id: string; role: string }[];
  } | null;
  const forensicsPayload = forensicsData as ForensicsResponse | null;
  const messages = [...(payload?.messages ?? [])];
  const evidence = payload?.evidence ?? [];
  const participants = payload?.participants ?? [];

  if (messages.length === 0 && evidence.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No thread data available.</p>
    );
  }

  // Determine party IDs from participant list
  const buyerParticipant = participants.find((p) => p.role === "buyer");
  const sellerParticipant = participants.find((p) => p.role === "seller");

  const buyerId = buyerParticipant?.user_id ?? null;
  const sellerId = sellerParticipant?.user_id ?? null;

  // Use the current logged-in user as the mediator ID
  const mediatorId = (payload as any)?.currentUserId ?? null;

  const accessToken = (payload as any)?.accessToken ?? "";
  const disputeId = (payload as any)?.disputeId ?? "";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-8">
        <PartyChannelChat
          label="Buyer channel"
          role="buyer"
          partyId={buyerId}
          mediatorId={mediatorId}
          messages={messages}
          evidence={evidence}
          forensicsData={forensicsPayload}
          accessToken={accessToken}
          disputeId={disputeId}
        />
        <PartyChannelChat
          label="Seller channel"
          role="seller"
          partyId={sellerId}
          mediatorId={mediatorId}
          messages={messages}
          evidence={evidence}
          forensicsData={forensicsPayload}
          accessToken={accessToken}
          disputeId={disputeId}
        />
      </div>
    </div>
  );
}

function PreDisputeChatView({
  data,
  isPending,
  errorMessage,
}: {
  data: any;
  isPending?: boolean;
  errorMessage?: string | null;
}) {
  if (isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
    );
  }
  if (errorMessage)
    return <p className="text-sm text-destructive">{errorMessage}</p>;
  if (!data?.messages?.length) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center text-sm text-muted-foreground">
        No pre-dispute messages found in this escrow.
      </div>
    );
  }

  const messages = [...data.messages].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );

  // Group messages by sender to determine alternating sides
  let lastSenderId: string | null = null;
  const messagesWithSide = messages.map((m: any) => {
    const isNewSender = m.sender_id !== lastSenderId;
    lastSenderId = m.sender_id;
    return { ...m, isNewSender };
  });

  // Determine which sender should be on the right (use first sender as left)
  const firstSenderId = messages[0]?.sender_id;

  const initials = (name: string | null) =>
    (name || "?")
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  return (
    <div className="flex flex-col rounded-xl border border-border bg-linear-to-b from-muted/30 to-muted/10 overflow-hidden">
      {/* Chat header */}
      <div className="border-b border-border bg-card/50 px-4 py-3 backdrop-blur-sm">
        <p className="text-xs font-medium text-muted-foreground">
          The original conversation between parties before the dispute was
          raised.
        </p>
      </div>

      {/* Chat messages - scrollable */}
      <div className="flex-1 max-h-150 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messagesWithSide.map((m: any) => {
          const isRight = m.sender_id !== firstSenderId;
          const senderColor = isRight ? "bg-emerald-600" : "bg-sky-600";

          return (
            <div
              key={m.id}
              className={cn("flex gap-3 group", isRight && "flex-row-reverse")}
            >
              {/* Avatar */}
              <div
                className={cn(
                  "mt-1 flex size-9 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-sm transition-transform group-hover:scale-110",
                  senderColor,
                )}
              >
                {initials(m.sender_name)}
              </div>

              {/* Message bubble */}
              <div className={cn("min-w-0 max-w-[75%] space-y-1")}>
                {/* Sender info */}
                <div
                  className={cn(
                    "flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground",
                    isRight && "justify-end",
                  )}
                >
                  <span className="font-semibold text-foreground">
                    {m.sender_name || "User"}
                  </span>
                  <Badge
                    variant="outline"
                    className="h-4 px-1.5 text-[9px] capitalize"
                  >
                    {m.sender_role || "participant"}
                  </Badge>
                  <span className="opacity-70">
                    {formatDateTime(m.created_at)}
                  </span>
                </div>

                {/* Message content */}
                <div
                  className={cn(
                    "rounded-2xl border px-4 py-2.5 text-sm leading-relaxed shadow-sm whitespace-pre-wrap transition-colors",
                    isRight
                      ? "rounded-tr-none border-emerald-500/20 bg-emerald-50 text-emerald-950 dark:bg-emerald-950/30 dark:text-emerald-50"
                      : "rounded-tl-none border-sky-500/20 bg-sky-50 text-sky-950 dark:bg-sky-950/30 dark:text-sky-50",
                  )}
                >
                  {m.message}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Chat footer info */}
      <div className="border-t border-border bg-card/50 px-4 py-2 backdrop-blur-sm">
        <p className="text-[10px] text-muted-foreground">
          {messages.length} message{messages.length !== 1 ? "s" : ""} •
          Read-only view
        </p>
      </div>
    </div>
  );
}

function CaseAnalysisView({
  data,
  isPending,
  errorMessage,
}: {
  data: unknown;
  isPending?: boolean;
  errorMessage?: string | null;
}) {
  if (isPending) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
    );
  }
  if (errorMessage)
    return <p className="text-sm text-destructive">{errorMessage}</p>;

  const analysis = latestUsableAnalysis(data);
  if (!analysis) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-5 text-sm text-muted-foreground">
        No AI chat analysis is available yet. Run analysis to summarize the
        pre-dispute conversation.
      </div>
    );
  }

  const flaggedCount = Array.isArray(analysis.flagged_messages)
    ? analysis.flagged_messages.length
    : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground">
          <Bot className="size-3" aria-hidden />
          AI analysis summary
        </span>
        {analysis.risk_level && (
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-medium",
              analysis.risk_level.toLowerCase() === "high" &&
                "bg-red-100 text-red-700",
              analysis.risk_level.toLowerCase() === "medium" &&
                "bg-amber-100 text-amber-800",
              analysis.risk_level.toLowerCase() === "low" &&
                "bg-emerald-100 text-emerald-800",
              !["high", "medium", "low"].includes(
                analysis.risk_level.toLowerCase(),
              ) && "bg-muted text-muted-foreground",
            )}
          >
            {analysis.risk_level} risk
          </span>
        )}
        <span className="text-xs text-muted-foreground">
          {analysis.message_count_analyzed} messages reviewed
        </span>
      </div>

      {analysis.summary && (
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Summary
          </p>
          <p className="mt-2 text-sm leading-relaxed text-foreground whitespace-pre-wrap">
            {analysis.summary}
          </p>
        </div>
      )}

      {analysis.recommendation && (
        <div className="rounded-xl border border-border bg-muted/25 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Recommendation
          </p>
          <p className="mt-2 text-sm leading-relaxed text-foreground whitespace-pre-wrap">
            {analysis.recommendation}
          </p>
        </div>
      )}

      {Array.isArray(analysis.detected_intents) &&
        analysis.detected_intents.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {analysis.detected_intents.map((intent) => (
              <span
                key={intent}
                className="rounded-full border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground"
              >
                {intent}
              </span>
            ))}
          </div>
        )}

      {flaggedCount > 0 && (
        <p className="text-xs text-muted-foreground">
          {flaggedCount} message{flaggedCount === 1 ? "" : "s"} need closer
          review in the pre-dispute chat.
        </p>
      )}
    </div>
  );
}

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

  if (results.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No forensics results available.
      </p>
    );
  }

  const threadPayload = threadData as { evidence?: ThreadEvidence[] } | null;
  const evidenceById = new Map(
    (threadPayload?.evidence ?? []).map((ev) => [ev.id, ev]),
  );
  const evidenceByKey = new Map(
    (threadPayload?.evidence ?? []).map((ev) => [ev.object_key, ev]),
  );

  return (
    <div className="space-y-4">
      {results.map((ev) => {
        const verdict = getEvidenceVerdict(ev);
        return (
          <div
            key={ev.evidence_id}
            className="overflow-hidden rounded-xl border border-border bg-background shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/25 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p
                  className="truncate text-sm font-semibold text-foreground"
                  title={filenameFromKey(ev.object_key)}
                >
                  {filenameFromKey(ev.object_key)}
                </p>
                <p className="truncate font-mono text-[10px] text-muted-foreground">
                  {ev.evidence_id}
                </p>
              </div>
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
                  verdict.className,
                )}
              >
                {verdict.label}
              </span>
            </div>

            <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="grid gap-px bg-border md:grid-cols-2">
                {(() => {
                  const original =
                    evidenceById.get(ev.evidence_id) ??
                    evidenceByKey.get(ev.object_key);
                  const imagePanels = [
                    {
                      label: "Original",
                      url: original?.file_url,
                      icon: ImageIcon,
                      emptyLabel: "Original image could not be displayed",
                    },
                    {
                      label: "Likely edited areas",
                      url: ev.heatmap_url,
                      icon: ShieldAlert,
                      emptyLabel: "Heatmap is not available yet",
                    },
                  ];

                  return imagePanels.map((panel) => {
                    const Icon = panel.icon;
                    return (
                      <div key={panel.label} className="bg-muted/20 p-3">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            {panel.label}
                          </span>
                          {panel.url && (
                            <a
                              href={panel.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] font-medium text-primary hover:underline"
                            >
                              Open
                            </a>
                          )}
                        </div>
                        {mediaUrl(panel.url) ? (
                          <ImagePreview
                            src={panel.url}
                            alt={`${panel.label} for ${filenameFromKey(ev.object_key)}`}
                            className="h-96 w-full"
                            emptyLabel={panel.emptyLabel}
                          />
                        ) : (
                          <div className="flex h-96 items-center justify-center rounded-md bg-background text-muted-foreground">
                            <div className="text-center">
                              <Icon className="mx-auto size-6" aria-hidden />
                              <p className="mt-2 text-xs">{panel.emptyLabel}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>

              <div className="flex flex-col justify-center space-y-4 p-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Decision cue
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {verdict.label}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {verdict.detail}
                  </p>
                </div>

                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex justify-between gap-3">
                    <span>File type</span>
                    <span className="font-medium text-foreground">
                      {ev.file_type}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span>Completed</span>
                    <span className="text-right font-medium text-foreground">
                      {formatDateTime(ev.ela_completed_at)}
                    </span>
                  </div>
                  {ev.heatmap_object_key && (
                    <div className="flex justify-between gap-3">
                      <span>Heatmap</span>
                      <span
                        className="max-w-48 truncate font-mono text-[10px] text-foreground"
                        title={ev.heatmap_object_key}
                      >
                        {filenameFromKey(ev.heatmap_object_key)}
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
        );
      })}
      <p className="text-xs text-muted-foreground">
        Total results: {payload?.total ?? results.length}
      </p>
    </div>
  );
}

function latestUsableAnalysis(data: unknown) {
  const payload = data as ChatAnalysesResponse | null;
  const analyses = payload?.analyses ?? [];
  return [...analyses]
    .filter((analysis) => {
      const source = `${analysis.provider} ${analysis.model}`.toLowerCase();
      return (
        analysis.status?.toLowerCase() === "completed" &&
        !analysis.error &&
        /grok|xai/.test(source)
      );
    })
    .sort(
      (a, b) =>
        new Date(b.completed_at ?? b.created_at).getTime() -
        new Date(a.completed_at ?? a.created_at).getTime(),
    )[0];
}

function CaseSummaryCard({
  threadData,
  forensicsData,
  analysesData,
  isPending,
}: {
  threadData: unknown;
  forensicsData: unknown;
  analysesData: unknown;
  isPending?: boolean;
}) {
  if (isPending) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <Skeleton className="h-4 w-28" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  const thread = threadData as {
    messages?: ThreadMessage[];
    evidence?: ThreadEvidence[];
  } | null;
  const forensics = forensicsData as ForensicsResponse | null;
  const analysis = latestUsableAnalysis(analysesData);
  const messages = thread?.messages ?? [];
  const evidence = thread?.evidence ?? [];
  const evidenceResults = forensics?.evidence_results ?? [];
  const editedCount = evidenceResults.filter((result) =>
    ["Definitely edited", "Likely edited"].includes(
      getEvidenceVerdict(result).label,
    ),
  ).length;
  const participants = Array.from(
    new Set(
      messages
        .map((msg) => msg.sender_role)
        .filter((role): role is string => Boolean(role)),
    ),
  );

  const summary =
    analysis?.summary ||
    `This dispute has ${messages.length} message${messages.length === 1 ? "" : "s"} and ${evidence.length} evidence item${evidence.length === 1 ? "" : "s"} from ${participants.length ? participants.join(", ") : "the parties"}.`;

  const recommendation =
    analysis?.recommendation ||
    (editedCount > 0
      ? "Review the highlighted evidence before deciding the case."
      : "Continue mediation and request clearer evidence if the current record is not enough.");

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Case summary</CardTitle>
        <CardDescription>
          A quick read before reviewing the full chat and evidence.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
              Edited
            </p>
            <p className="mt-1 text-lg font-semibold text-foreground">
              {editedCount}
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Summary
          </p>
          <p className="mt-2 text-sm leading-relaxed text-foreground">
            {summary}
          </p>
        </div>

        <div className="rounded-lg border border-border bg-muted/25 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Next step
          </p>
          <p className="mt-2 text-sm leading-relaxed text-foreground">
            {recommendation}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminDisputeConsoleView({
  accessToken,
  disputeId,
  currentUserId,
}: {
  accessToken: string;
  disputeId: string;
  currentUserId: string;
}) {
  const e = ethitrustThemeTokens;
  const qc = useQueryClient();

  const threadQuery = useQuery({
    queryKey: ["admin", "disputes", disputeId, "thread"],
    queryFn: () => fetchAdminDisputeThread(accessToken, disputeId),
    enabled: Boolean(accessToken && disputeId),
  });

  const forensicsQuery = useQuery({
    queryKey: ["admin", "disputes", disputeId, "forensics"],
    queryFn: () => fetchAdminDisputeForensics(accessToken, disputeId),
    enabled: Boolean(accessToken && disputeId),
  });

  const analysesQuery = useQuery({
    queryKey: ["admin", "disputes", disputeId, "analyses"],
    queryFn: () => fetchAdminDisputeAnalyses(accessToken, disputeId),
    enabled: Boolean(accessToken && disputeId),
  });

  const disputeDetailQuery = useQuery({
    queryKey: ["admin", "disputes", disputeId, "detail"],
    queryFn: () => fetchAdminDisputeDetail(accessToken, disputeId),
    enabled: Boolean(accessToken && disputeId),
  });

  const escrowId = disputeDetailQuery.data?.escrow_id;
  const escrowMessagesQuery = useQuery({
    queryKey: ["admin", "escrows", escrowId, "messages"],
    queryFn: () => fetchAdminEscrowMessages(accessToken, escrowId),
    enabled: Boolean(accessToken && escrowId),
  });

  const [mediatorId, setMediatorId] = useState("");
  const [resolutionNote, setResolutionNote] = useState("");
  const [disputeAction, setDisputeAction] = useState("resolve_seller");
  const [disputeActionNote, setDisputeActionNote] = useState("");
  const [sellerPercentage, setSellerPercentage] = useState(80);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Get escrow amount for calculations
  const escrowAmount = disputeDetailQuery.data?.escrow_amount || 0;
  const sellerAmountCents = Math.round((escrowAmount * sellerPercentage) / 100);
  const buyerRefundCents = escrowAmount - sellerAmountCents;

  const invalidateThread = () => {
    void qc.invalidateQueries({
      queryKey: ["admin", "disputes", disputeId, "thread"],
    });
  };

  const invalidateForensics = () => {
    void qc.invalidateQueries({
      queryKey: ["admin", "disputes", disputeId, "forensics"],
    });
  };

  const invalidateAnalyses = () => {
    void qc.invalidateQueries({
      queryKey: ["admin", "disputes", disputeId, "analyses"],
    });
  };

  const mediatorMutation = useMutation({
    mutationFn: () =>
      postAdminDisputeAssignMediator(accessToken, disputeId, {
        mediator_user_id: mediatorId.trim(),
      }),
    onSuccess: () => {
      toast.success("Mediator assigned");
      setMediatorId("");
      invalidateThread();
    },
    onError: (err: Error) => toast.error(err.message),
  });

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

  const actionMutation = useMutation({
    mutationFn: () =>
      postAdminDisputeAction(accessToken, disputeId, {
        action: disputeAction,
        note: disputeActionNote.trim() || undefined,
        seller_amount_cents:
          disputeAction === "partial_settlement"
            ? sellerAmountCents
            : undefined,
      }),
    onSuccess: () => {
      toast.success("Dispute resolution applied successfully");
      setDisputeActionNote("");
      setShowConfirmDialog(false);
      invalidateThread();
    },
    onError: (err: Error) => {
      toast.error(err.message);
      setShowConfirmDialog(false);
    },
  });

  const analyzeChatMutation = useMutation({
    mutationFn: () => postAdminDisputeAnalyzeChat(accessToken, disputeId),
    onSuccess: () => {
      toast.success("Chat analysis complete");
      invalidateAnalyses();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const threadErr =
    threadQuery.isError && threadQuery.error instanceof Error
      ? threadQuery.error.message
      : null;

  return (
    <div className={cn(e.layout.container, "space-y-8 py-8 lg:py-12")}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <header className="max-w-2xl">
          <p className={cn(e.typography.eyebrow, "text-muted-foreground")}>
            Platform
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
          <Link href="/admin/disputes">Back to disputes</Link>
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Conversation
              </CardTitle>
              <CardDescription>
                Direct private communication channels with each party.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ThreadSnapshotChat
                data={
                  threadQuery.data
                    ? {
                        ...(threadQuery.data as any),
                        accessToken,
                        disputeId,
                        currentUserId,
                      }
                    : null
                }
                forensicsData={forensicsQuery.data}
                isPending={threadQuery.isPending}
                errorMessage={threadErr}
              />
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Image analysis
              </CardTitle>
              <CardDescription>
                Original image and ELA heatmap are displayed side by side for
                faster visual review.
              </CardDescription>
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
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Pre-dispute chat
              </CardTitle>
              <CardDescription>
                The original conversation between parties before the dispute was
                raised.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PreDisputeChatView
                data={escrowMessagesQuery.data}
                isPending={escrowMessagesQuery.isPending}
                errorMessage={
                  escrowMessagesQuery.isError &&
                  escrowMessagesQuery.error instanceof Error
                    ? escrowMessagesQuery.error.message
                    : null
                }
              />
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="text-base font-semibold">
                  AI analysis of the chat
                </CardTitle>
                <CardDescription>
                  AI-generated summary and risk assessment based on the
                  pre-dispute conversation.
                </CardDescription>
              </div>
              <Button
                type="button"
                size="sm"
                disabled={analyzeChatMutation.isPending}
                onClick={() => analyzeChatMutation.mutate()}
                className="shrink-0"
              >
                {analyzeChatMutation.isPending
                  ? "Analyzing..."
                  : "Refresh analysis"}
              </Button>
            </CardHeader>
            <CardContent>
              <CaseAnalysisView
                data={analysesQuery.data}
                isPending={analysesQuery.isPending}
                errorMessage={
                  analysesQuery.isError && analysesQuery.error instanceof Error
                    ? analysesQuery.error.message
                    : null
                }
              />
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6">
          <CaseSummaryCard
            threadData={threadQuery.data}
            forensicsData={forensicsQuery.data}
            analysesData={analysesQuery.data}
            isPending={
              threadQuery.isPending ||
              forensicsQuery.isPending ||
              analysesQuery.isPending
            }
          />

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Workflow tools
              </CardTitle>
              <CardDescription>
                Admin actions for assignment, notes, and case state.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">
                  Assign mediator
                </h3>
                <div className="space-y-2">
                  <Label htmlFor="med-id">Mediator user id</Label>
                  <Input
                    id="med-id"
                    value={mediatorId}
                    onChange={(ev) => setMediatorId(ev.target.value)}
                    placeholder="UUID"
                  />
                </div>
                <Button
                  type="button"
                  className="w-full"
                  disabled={!mediatorId.trim() || mediatorMutation.isPending}
                  onClick={() => mediatorMutation.mutate()}
                >
                  Assign mediator
                </Button>
              </div>

              <div className="space-y-3 border-t border-border pt-5">
                <h3 className="text-sm font-semibold text-foreground">
                  Resolution note
                </h3>
                <Textarea
                  rows={4}
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

              <div className="space-y-4 border-t border-border pt-5">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Dispute Resolution
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    After reviewing evidence and chat, choose a resolution
                  </p>
                </div>

                <div className="space-y-3">
                  <Label className="text-xs font-medium">Resolution Type</Label>

                  {/* Resolve in Favor of Buyer */}
                  <div
                    className={cn(
                      "cursor-pointer rounded-lg border-2 p-3 transition-all hover:border-sky-500/50",
                      disputeAction === "resolve_buyer"
                        ? "border-sky-500 bg-sky-50 dark:bg-sky-950/20"
                        : "border-border bg-background",
                    )}
                    onClick={() => setDisputeAction("resolve_buyer")}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        checked={disputeAction === "resolve_buyer"}
                        onChange={() => setDisputeAction("resolve_buyer")}
                        className="mt-0.5 size-4"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground">
                          Resolve in Favor of Buyer
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Full refund to buyer • Release escrow lock
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Resolve in Favor of Seller */}
                  <div
                    className={cn(
                      "cursor-pointer rounded-lg border-2 p-3 transition-all hover:border-emerald-500/50",
                      disputeAction === "resolve_seller"
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20"
                        : "border-border bg-background",
                    )}
                    onClick={() => setDisputeAction("resolve_seller")}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        checked={disputeAction === "resolve_seller"}
                        onChange={() => setDisputeAction("resolve_seller")}
                        className="mt-0.5 size-4"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground">
                          Resolve in Favor of Seller
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Release full amount to seller • Complete escrow
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Partial Settlement */}
                  <div
                    className={cn(
                      "cursor-pointer rounded-lg border-2 p-3 transition-all hover:border-violet-500/50",
                      disputeAction === "partial_settlement"
                        ? "border-violet-500 bg-violet-50 dark:bg-violet-950/20"
                        : "border-border bg-background",
                    )}
                    onClick={() => setDisputeAction("partial_settlement")}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        checked={disputeAction === "partial_settlement"}
                        onChange={() => setDisputeAction("partial_settlement")}
                        className="mt-0.5 size-4"
                      />
                      <div className="flex-1 space-y-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            Partial Settlement
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            Custom split between buyer and seller
                          </p>
                        </div>

                        {disputeAction === "partial_settlement" && (
                          <div className="space-y-3 rounded-md border border-border bg-background p-3">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-medium text-muted-foreground">
                                  Release to Seller
                                </span>
                                <span className="font-bold text-foreground">
                                  {sellerPercentage}%
                                </span>
                              </div>
                              <Slider
                                value={[sellerPercentage]}
                                onValueChange={(value) =>
                                  setSellerPercentage(value[0])
                                }
                                min={0}
                                max={100}
                                step={5}
                                className="w-full"
                              />
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">
                                  0%
                                </span>
                                <span className="text-muted-foreground">
                                  100%
                                </span>
                              </div>
                            </div>

                            <div className="space-y-1.5 rounded-md bg-muted/50 p-2 text-xs">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                  Escrow Amount:
                                </span>
                                <span className="font-medium">
                                  {(escrowAmount / 100).toFixed(2)} ETB
                                </span>
                              </div>
                              <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
                                <span>Seller Receives:</span>
                                <span className="font-bold">
                                  {(sellerAmountCents / 100).toFixed(2)} ETB
                                </span>
                              </div>
                              <div className="flex justify-between text-sky-700 dark:text-sky-400">
                                <span>Buyer Refund:</span>
                                <span className="font-bold">
                                  {(buyerRefundCents / 100).toFixed(2)} ETB
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Return to Negotiation */}
                  <div
                    className={cn(
                      "cursor-pointer rounded-lg border-2 p-3 transition-all hover:border-amber-500/50",
                      disputeAction === "return_to_negotiation"
                        ? "border-amber-500 bg-amber-50 dark:bg-amber-950/20"
                        : "border-border bg-background",
                    )}
                    onClick={() => setDisputeAction("return_to_negotiation")}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        checked={disputeAction === "return_to_negotiation"}
                        onChange={() =>
                          setDisputeAction("return_to_negotiation")
                        }
                        className="mt-0.5 size-4"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground">
                          Return to Negotiation
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Close dispute • Return escrow to active status
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="resolution-note"
                    className="text-xs font-medium"
                  >
                    Resolution Note{" "}
                    {disputeAction !== "return_to_negotiation" && (
                      <span className="text-destructive">*</span>
                    )}
                  </Label>
                  <Textarea
                    id="resolution-note"
                    rows={3}
                    value={disputeActionNote}
                    onChange={(ev) => setDisputeActionNote(ev.target.value)}
                    placeholder="Explain your decision and reasoning..."
                    className="text-sm"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    This note will be recorded in the audit log and may be
                    visible to parties.
                  </p>
                </div>

                <Button
                  type="button"
                  className={cn(
                    "w-full",
                    disputeAction === "resolve_buyer" &&
                      "bg-sky-600 hover:bg-sky-700",
                    disputeAction === "resolve_seller" &&
                      "bg-emerald-600 hover:bg-emerald-700",
                    disputeAction === "partial_settlement" &&
                      "bg-violet-600 hover:bg-violet-700",
                    disputeAction === "return_to_negotiation" &&
                      "bg-amber-600 hover:bg-amber-700",
                  )}
                  disabled={
                    actionMutation.isPending ||
                    (disputeAction !== "return_to_negotiation" &&
                      !disputeActionNote.trim())
                  }
                  onClick={() => setShowConfirmDialog(true)}
                >
                  {actionMutation.isPending
                    ? "Processing..."
                    : "Apply Resolution"}
                </Button>
              </div>
            </CardContent>

            {/* Confirmation Dialog */}
            <Dialog
              open={showConfirmDialog}
              onOpenChange={setShowConfirmDialog}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm Dispute Resolution</DialogTitle>
                  <DialogDescription>
                    This action is permanent and will affect the escrow funds.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-2">
                    <p className="text-sm font-semibold">
                      {disputeAction === "resolve_buyer" &&
                        "Resolve in Favor of Buyer"}
                      {disputeAction === "resolve_seller" &&
                        "Resolve in Favor of Seller"}
                      {disputeAction === "partial_settlement" &&
                        "Partial Settlement"}
                      {disputeAction === "return_to_negotiation" &&
                        "Return to Negotiation"}
                    </p>
                    <div className="text-xs text-muted-foreground space-y-1">
                      {disputeAction === "resolve_buyer" && (
                        <>
                          <p>
                            • Full refund: {(escrowAmount / 100).toFixed(2)} ETB
                            to buyer
                          </p>
                          <p>• Escrow lock will be released</p>
                          <p>• Dispute marked as resolved_buyer</p>
                        </>
                      )}
                      {disputeAction === "resolve_seller" && (
                        <>
                          <p>
                            • Full release: {(escrowAmount / 100).toFixed(2)}{" "}
                            ETB to seller
                          </p>
                          <p>• Escrow will be completed</p>
                          <p>• Dispute marked as resolved_seller</p>
                        </>
                      )}
                      {disputeAction === "partial_settlement" && (
                        <>
                          <p>
                            • Seller receives:{" "}
                            {(sellerAmountCents / 100).toFixed(2)} ETB (
                            {sellerPercentage}%)
                          </p>
                          <p>
                            • Buyer refund:{" "}
                            {(buyerRefundCents / 100).toFixed(2)} ETB (
                            {100 - sellerPercentage}%)
                          </p>
                          <p>• Escrow will be completed</p>
                        </>
                      )}
                      {disputeAction === "return_to_negotiation" && (
                        <>
                          <p>• Dispute will be closed</p>
                          <p>• Escrow returns to active status</p>
                          <p>• Parties can continue negotiation</p>
                        </>
                      )}
                    </div>
                  </div>
                  {disputeActionNote.trim() && (
                    <div className="rounded-lg border border-border bg-background p-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        Resolution Note:
                      </p>
                      <p className="text-sm">{disputeActionNote}</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowConfirmDialog(false)}
                    disabled={actionMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    className={cn(
                      "flex-1",
                      disputeAction === "resolve_buyer" &&
                        "bg-sky-600 hover:bg-sky-700",
                      disputeAction === "resolve_seller" &&
                        "bg-emerald-600 hover:bg-emerald-700",
                      disputeAction === "partial_settlement" &&
                        "bg-violet-600 hover:bg-violet-700",
                      disputeAction === "return_to_negotiation" &&
                        "bg-amber-600 hover:bg-amber-700",
                    )}
                    onClick={() => actionMutation.mutate()}
                    disabled={actionMutation.isPending}
                  >
                    {actionMutation.isPending ? "Processing..." : "Confirm"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </Card>
        </aside>
      </div>
    </div>
  );
}

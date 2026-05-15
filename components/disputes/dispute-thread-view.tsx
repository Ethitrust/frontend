"use client";

import Link from "next/link";
import { type FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Loader2Icon,
  MessageSquare,
  Paperclip,
  Reply,
  Scale,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Textarea } from "@/components/ui/textarea";
import { fetchAuthMe } from "@/lib/auth/me-session-api";
import { formatEscrowDateTime } from "@/lib/escrows/format-escrow";
import type { DisputeMessageRow } from "@/lib/disputes/dispute-types";
import {
  fetchMeDispute,
  fetchMeDisputeThread,
  postDisputeCancel,
  postDisputeEvidence,
  postDisputeMessage,
} from "@/lib/disputes/me-disputes-api";
import { ethitrustThemeTokens } from "@/lib/ethitrust-theme";
import { disputeEvidenceDescriptionSchema } from "@/lib/validators/dispute-evidence";
import { disputeMessageSchema } from "@/lib/validators/dispute-message";
import { cn } from "@/lib/utils";

function disputeLooksTerminal(status?: string | null): boolean {
  if (!status) return false;
  return /resolved|closed|cancel|canceled|settled|completed/i.test(status);
}

function formatDisputeStatus(status: string) {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function isSettlementPending(status: string): boolean {
  return (
    typeof status === "string" && status.toLowerCase() === "settlement_pending"
  );
}

export function DisputeThreadView(props: {
  accessToken: string;
  disputeId: string;
}) {
  const e = ethitrustThemeTokens;
  const { accessToken, disputeId } = props;
  const qc = useQueryClient();

  const invalidateDisputeQueries = async () => {
    await qc.invalidateQueries({ queryKey: ["me", "disputes", disputeId] });
    await qc.invalidateQueries({
      queryKey: ["me", "disputes", disputeId, "thread"],
    });
    await qc.invalidateQueries({ queryKey: ["me", "disputes", "list"] });
  };

  const disputeQuery = useQuery({
    queryKey: ["me", "disputes", disputeId],
    queryFn: () => fetchMeDispute(accessToken, disputeId),
    enabled: Boolean(accessToken && disputeId),
  });

  const threadQuery = useQuery({
    queryKey: ["me", "disputes", disputeId, "thread"],
    queryFn: () => fetchMeDisputeThread(accessToken, disputeId),
    enabled: Boolean(accessToken && disputeId),
  });

  const meQuery = useQuery({
    queryKey: ["me", "auth", "me"],
    queryFn: () => fetchAuthMe(accessToken),
    enabled: Boolean(accessToken),
    staleTime: 60_000,
  });

  const dispute = disputeQuery.data;
  const thread = threadQuery.data;
  const me = meQuery.data;

  const status = dispute?.status ?? "";
  const terminal = disputeLooksTerminal(status);
  const settlementPendingStatus = isSettlementPending(status);

  const participantRoleByUserId = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of thread?.participants ?? []) {
      if (p.user_id && p.role) map.set(p.user_id, p.role);
    }
    return map;
  }, [thread?.participants]);

  const sortedMessages = useMemo(() => {
    const msgs = [...(thread?.messages ?? [])];
    return msgs.sort((a, b) => {
      const ta = new Date(a.created_at ?? 0).getTime();
      const tb = new Date(b.created_at ?? 0).getTime();
      return ta - tb;
    });
  }, [thread?.messages]);

  const [messageDraft, setMessageDraft] = useState("");
  const [replyTo, setReplyTo] = useState<DisputeMessageRow | null>(null);

  const [evidenceDescription, setEvidenceDescription] = useState("");
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);

  const loadingShell = disputeQuery.isPending || threadQuery.isPending;

  const messageMutation = useMutation({
    mutationFn: async () => {
      const parsed = disputeMessageSchema.safeParse({
        message: messageDraft,
        message_type: "text",
        reply_to_message_id: replyTo?.id ?? undefined,
      });
      if (!parsed.success)
        throw new Error(parsed.error.issues[0]?.message ?? "Invalid message");
      // Automatically route to the assigned mediator when one exists.
      const mediatorId = dispute?.assigned_mediator_id ?? null;
      return postDisputeMessage(accessToken, disputeId, {
        ...parsed.data,
        recipient_id: mediatorId,
      });
    },
    onSuccess: async () => {
      toast.success("Message sent to moderator");
      setMessageDraft("");
      setReplyTo(null);
      await invalidateDisputeQueries();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const cancelMutation = useMutation({
    mutationFn: () => postDisputeCancel(accessToken, disputeId),
    onSuccess: async () => {
      toast.success("Dispute cancelled");
      await invalidateDisputeQueries();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const evidenceMutation = useMutation({
    mutationFn: async () => {
      const descParsed = disputeEvidenceDescriptionSchema.safeParse({
        description: evidenceDescription.trim() ? evidenceDescription : null,
      });
      if (!descParsed.success)
        throw new Error(
          descParsed.error.issues[0]?.message ?? "Invalid description",
        );
      if (!evidenceFile) throw new Error("Choose a file to upload.");

      // const fd = new FormData()
      // fd.append('file', evidenceFile)
      // const uploaded = await postDisputeEvidenceUpload(accessToken, disputeId, fd)
      return postDisputeEvidence(accessToken, disputeId, {
        message_id: replyTo?.id ?? undefined,
        file: evidenceFile,
        description: descParsed.data.description ?? undefined,
      });
    },
    onSuccess: async () => {
      toast.success("Evidence attached");
      setEvidenceFile(null);
      setEvidenceDescription("");
      await invalidateDisputeQueries();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function onSendMessage(e: FormEvent) {
    e.preventDefault();
    messageMutation.mutate();
  }

  function onEvidenceSubmit(e: FormEvent) {
    e.preventDefault();
    evidenceMutation.mutate();
  }

  const err =
    (disputeQuery.error as Error | undefined)?.message ??
    (threadQuery.error as Error | undefined)?.message ??
    "";

  return (
    <div className={cn(e.layout.container, "py-8 lg:py-12")}>
      <Button
        variant="ghost"
        size="sm"
        asChild
        className="-ml-2 mb-6 gap-2 text-muted-foreground"
      >
        <Link href="/disputes">
          <ArrowLeft className="size-4" aria-hidden />
          All disputes
        </Link>
      </Button>

      {disputeQuery.isError || threadQuery.isError ? (
        <Alert variant="destructive" className="mb-8">
          <AlertTitle>Could not load this dispute</AlertTitle>
          <AlertDescription>{err || "Request failed."}</AlertDescription>
        </Alert>
      ) : null}

      {loadingShell ? (
        <div className="space-y-4">
          <Skeleton className="h-36 w-full max-w-3xl rounded-xl" />
          <Skeleton className="h-64 w-full max-w-3xl rounded-xl" />
        </div>
      ) : dispute ? (
        <>
          <header className="max-w-3xl">
            <p className={cn(e.typography.eyebrow, "text-muted-foreground")}>
              Trust · Dispute room
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h1
                className={cn(
                  e.typography.displayLG,
                  "font-serif font-normal text-foreground",
                )}
              >
                {dispute.reason?.trim() || "Dispute"}
              </h1>
              {status ? (
                <Badge variant="outline" className="whitespace-nowrap">
                  {formatDisputeStatus(status)}
                </Badge>
              ) : null}
            </div>
            {dispute.description ? (
              <p className={cn(e.typography.bodyMuted, "mt-3")}>
                {dispute.description}
              </p>
            ) : null}
            <div className="mt-6 flex flex-wrap gap-3 text-sm">
              {dispute.escrow_id ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  asChild
                >
                  <Link
                    href={`/escrows/${encodeURIComponent(dispute.escrow_id)}`}
                  >
                    View escrow
                  </Link>
                </Button>
              ) : null}
              {(!terminal && me?.id && dispute?.raised_by && me.id === dispute.raised_by) ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full text-destructive hover:text-destructive"
                      disabled={cancelMutation.isPending}
                    >
                      {cancelMutation.isPending ? (
                        <>
                          <Loader2Icon
                            className="size-4 animate-spin"
                            aria-hidden
                          />
                          Cancelling…
                        </>
                      ) : (
                        "Cancel dispute"
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel this dispute?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will cancel the dispute and return the escrow to an active state. Only the party who raised the dispute can cancel it.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Back</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive hover:bg-destructive/90"
                        onClick={() => cancelMutation.mutate()}
                      >
                        Confirm cancel
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : null}
            </div>
          </header>

          <div className="mt-10 grid max-w-4xl gap-8 lg:grid-cols-[1fr_320px]">
            <Card className="shadow-sm lg:col-span-1">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <MessageSquare
                    className="size-4 text-muted-foreground"
                    aria-hidden
                  />
                  Your conversation with the moderator
                </CardTitle>
                <CardDescription>
                  Messages here are private between you and the assigned
                  moderator. The other party cannot see what you write here.
                  Present your case clearly and attach supporting evidence.
                </CardDescription>
              </CardHeader>
              <CardContent className="max-h-[min(520px,60vh)] space-y-3 overflow-y-auto py-6">
                {terminal && (
                  <Alert className="mb-6 border-primary/20 bg-primary/5">
                    <Scale className="size-4" />
                    <AlertTitle>Dispute Resolved</AlertTitle>
                    <AlertDescription>
                      This dispute has been resolved and is now closed. 
                      {dispute?.resolution_note && (
                        <p className="mt-2 text-sm font-medium italic">
                          "{dispute.resolution_note}"
                        </p>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
                {!terminal && dispute?.status === "escalated_mediation" && (
                  <Alert className="mb-6 border-blue-500/20 bg-blue-500/5">
                    <Scale className="size-4 text-blue-500" />
                    <AlertTitle>Mediation in Progress</AlertTitle>
                    <AlertDescription>
                      A moderator is reviewing your case. Please answer any questions they have and wait for a resolution.
                    </AlertDescription>
                  </Alert>
                )}
                {sortedMessages.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No messages yet.
                  </p>
                ) : (
                  sortedMessages.map((m) => {
                    const mine = Boolean(me?.id && m.sender_id === me.id);
                    const role = m.message_type === "system" 
                      ? "System" 
                      : (participantRoleByUserId.get(m.sender_id ?? "") ?? "Participant");
                    
                    const roleLabels: Record<string, string> = {
                      buyer: "Buyer",
                      seller: "Seller",
                      mediator: "Moderator",
                      System: "System Notification",
                    };
                    const label = roleLabels[role] || role;
                    return (
                      <div
                        key={m.id}
                        className={cn(
                          "flex flex-col gap-1",
                          mine ? "items-end text-right" : "items-start",
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[min(100%,28rem)] rounded-2xl border px-4 py-3 text-sm shadow-sm",
                            mine
                              ? "border-primary/20 bg-primary/5"
                              : "border-border bg-muted/40",
                          )}
                        >
                          <div className="mb-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                            <span className="font-medium">
                              {label}
                            </span>
                            <span aria-hidden>·</span>
                            <time dateTime={m.created_at ?? undefined}>
                              {m.created_at
                                ? formatEscrowDateTime(m.created_at)
                                : ""}
                            </time>
                          </div>
                          {m.reply_to_message && (
                            <div
                              className={cn(
                                "mb-2 rounded-md border px-2.5 py-1.5 text-xs",
                                mine
                                  ? "border-primary/10 bg-primary/[0.08] text-primary/80"
                                  : "border-border/60 bg-muted/30 text-muted-foreground",
                              )}
                            >
                              <p className="line-clamp-2">
                                {m.reply_to_message.text}
                              </p>
                            </div>
                          )}
                          <p className="whitespace-pre-wrap">{m.message}</p>
                          {terminal ? null : (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="mt-2 h-auto gap-1 px-0 py-0 text-xs text-muted-foreground"
                              onClick={() =>
                                setReplyTo({
                                  ...m,
                                })
                              }
                            >
                              <Reply className="size-3" aria-hidden /> Reply in
                              thread
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
              {terminal ? null : (
                <CardFooter className="flex-col items-stretch gap-4 border-t">
                  {replyTo ? (
                    <div className="flex items-start justify-between gap-2 rounded-lg border bg-muted/30 p-3 text-sm">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">
                          Reply to
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
                  ) : null}
                  <form
                    onSubmit={onSendMessage}
                    className="flex w-full flex-col gap-3"
                  >
                    <Label htmlFor="dispute-msg" className="sr-only">
                      Message
                    </Label>
                    <Textarea
                      id="dispute-msg"
                      value={messageDraft}
                      onChange={(ev) => setMessageDraft(ev.target.value)}
                      placeholder="Write your update clearly and calmly…"
                      rows={4}
                      className="resize-y"
                    />
                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        className="rounded-full"
                        disabled={messageMutation.isPending}
                      >
                        {messageMutation.isPending ? (
                          <>
                            <Loader2Icon
                              className="size-4 animate-spin"
                              aria-hidden
                            />
                            Sending…
                          </>
                        ) : (
                          "Send message"
                        )}
                      </Button>
                    </div>
                  </form>
                </CardFooter>
              )}
            </Card>

            <div className="space-y-8">
              {/* Waiting-for-mediator notice */}
              {!dispute.assigned_mediator_id && (
                <Alert>
                  <AlertTitle>Awaiting moderator assignment</AlertTitle>
                  <AlertDescription>
                    A platform moderator will be assigned shortly. You can
                    submit evidence now — they will review everything when they
                    join the case.
                  </AlertDescription>
                </Alert>
              )}

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <Scale
                      className="size-4 text-muted-foreground"
                      aria-hidden
                    />
                    Participants
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {(thread?.participants?.length ?? 0) === 0 ? (
                    <p className="text-muted-foreground">
                      Participant list not returned.
                    </p>
                  ) : (
                    (thread!.participants ?? []).map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between gap-3"
                      >
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {(p.user_id ?? "").slice(0, 8)}…
                        </span>
                        <Badge variant="outline" className="capitalize">
                          {p.role ?? "participant"}
                        </Badge>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader className="border-b">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <Paperclip
                      className="size-4 text-muted-foreground"
                      aria-hidden
                    />
                    Evidence
                  </CardTitle>
                  <CardDescription>
                   Upload a file as evidence for the moderator to review.
                  Accepted formats: images, PDF. All evidence is private to this
                  case and visible only to you and the moderator.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 py-6">
                  {(thread?.evidence?.length ?? 0) === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No evidence yet.
                    </p>
                  ) : (
                    <ul className="space-y-3 text-sm">
                      {(thread!.evidence ?? []).map((ev) => (
                        <li key={ev.id} className="rounded-lg border p-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-medium">
                              {ev.file_type ?? "File"}
                            </span>
                            {ev.is_tampered ? (
                              <Badge variant="destructive">
                                Tamper concern
                              </Badge>
                            ) : null}
                          </div>
                          {ev.description ? (
                            <p className="mt-2 text-xs text-muted-foreground">
                              {ev.description}
                            </p>
                          ) : null}
                          {ev.file_url && /^https?:\/\//i.test(ev.file_url) ? (
                            <Button
                              variant="link"
                              className="mt-2 h-auto p-0"
                              asChild
                              size="sm"
                            >
                              <a
                                href={ev.file_url}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Open attachment
                              </a>
                            </Button>
                          ) : (
                            <p className="mt-2 font-mono text-[11px] text-muted-foreground break-all">
                              {ev.object_key}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
                {terminal ? null : (
                  <CardFooter className="flex-col items-stretch gap-4 border-t">
                    <form
                      onSubmit={onEvidenceSubmit}
                      className="flex flex-col gap-3"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="dispute-evidence-file">File</Label>
                        <Input
                          id="dispute-evidence-file"
                          type="file"
                          accept="image/*,.pdf,.doc,.docx"
                          onChange={(ev) =>
                            setEvidenceFile(ev.target.files?.[0] ?? null)
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dispute-evidence-desc">
                          Caption (optional)
                        </Label>
                        <Input
                          id="dispute-evidence-desc"
                          value={evidenceDescription}
                          onChange={(ev) =>
                            setEvidenceDescription(ev.target.value)
                          }
                          placeholder="e.g. delivery photo, signed receipt…"
                          maxLength={500}
                        />
                      </div>
                      <Button
                        type="submit"
                        variant="outline"
                        className="rounded-full self-end"
                        disabled={evidenceMutation.isPending || !evidenceFile}
                      >
                        {evidenceMutation.isPending ? (
                          <>
                            <Loader2Icon
                              className="size-4 animate-spin"
                              aria-hidden
                            />
                            Uploading…
                          </>
                        ) : (
                          "Upload evidence"
                        )}
                      </Button>
                    </form>
                  </CardFooter>
                )}
              </Card>
            </div>
          </div>
        </>
      ) : null}

    </div>
  );
}

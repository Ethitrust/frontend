"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
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
} from "@/components/ui/alert-dialog";
import { Spinner } from "@/components/ui/spinner";
import { postOrgEscrowResend } from "@/lib/org-escrows/org-escrows-api";
import { useAuthStore } from "@/stores/auth-store";

export function ResendOrgEscrowInviteDialog({
  orgId,
  escrowId,
  receiverEmail,
  open,
  onOpenChange,
}: {
  orgId: string;
  escrowId: string;
  receiverEmail?: string | null;
  open: boolean;
  onOpenChange: (next: boolean) => void;
}) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => postOrgEscrowResend(accessToken!, orgId, escrowId),
    onSuccess: () => {
      toast.success("Invite resent", {
        description: receiverEmail
          ? `A fresh invitation was sent to ${receiverEmail}.`
          : undefined,
      });
      void queryClient.invalidateQueries({ queryKey: ["me", "org-escrows"] });
      onOpenChange(false);
    },
    onError: (err: unknown) =>
      toast.error(
        err instanceof Error ? err.message : "Could not resend invite",
      ),
  });

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Resend invitation?</AlertDialogTitle>
          <AlertDialogDescription>
            {receiverEmail ? (
              <>
                A new invitation email will be sent to{" "}
                <span className="font-medium text-foreground">
                  {receiverEmail}
                </span>
                .
              </>
            ) : (
              "A new invitation email will be sent to the counterparty."
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={mutation.isPending}
            className="rounded-full"
          >
            Not now
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={mutation.isPending}
            onClick={(e) => {
              e.preventDefault();
              mutation.mutate();
            }}
            className="rounded-full"
          >
            {mutation.isPending ? (
              <>
                <Spinner className="mr-2 size-3" aria-hidden />
                Sending…
              </>
            ) : (
              "Resend invite"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

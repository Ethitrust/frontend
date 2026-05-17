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
import { postOrgEscrowCancel } from "@/lib/org-escrows/org-escrows-api";
import { useAuthStore } from "@/stores/auth-store";

export function CancelOrgEscrowDialog({
  orgId,
  escrowId,
  escrowTitle,
  open,
  onOpenChange,
  onCancelled,
}: {
  orgId: string;
  escrowId: string;
  escrowTitle?: string;
  open: boolean;
  onOpenChange: (next: boolean) => void;
  /** Called after the mutation succeeds (e.g. for navigation). */
  onCancelled?: () => void;
}) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => postOrgEscrowCancel(accessToken!, orgId, escrowId),
    onSuccess: (res) => {
      toast.success("Escrow cancelled", {
        description: res?.refunded
          ? "Funds were refunded to the buyer."
          : escrowTitle ?? undefined,
      });
      void queryClient.invalidateQueries({ queryKey: ["me", "org-escrows"] });
      onOpenChange(false);
      onCancelled?.();
    },
    onError: (err: unknown) =>
      toast.error(
        err instanceof Error ? err.message : "Could not cancel escrow",
      ),
  });

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel this escrow?</AlertDialogTitle>
          <AlertDialogDescription>
            {escrowTitle ? (
              <>
                Cancelling{" "}
                <span className="font-medium text-foreground">
                  {escrowTitle}
                </span>{" "}
                will end the deal and refund any funded amount to the buyer.
                This cannot be undone.
              </>
            ) : (
              <>
                Cancelling will end the deal and refund any funded amount to
                the buyer. This cannot be undone.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={mutation.isPending}
            className="rounded-full"
          >
            Keep escrow
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={mutation.isPending}
            onClick={(e) => {
              e.preventDefault();
              mutation.mutate();
            }}
            className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {mutation.isPending ? (
              <>
                <Spinner className="mr-2 size-3" aria-hidden />
                Cancelling…
              </>
            ) : (
              "Cancel escrow"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

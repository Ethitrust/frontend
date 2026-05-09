import type { EscrowRow } from "@/lib/escrows/escrow-list-types";

export type ViewerEscrowParty = "initiator" | "receiver" | "unknown";

export function escrowPartyForViewer(
  escrow: Pick<EscrowRow, "initiator_id" | "receiver_id" | "receiver_email">,
  viewerId: string,
  receiverEmail?: string,
): ViewerEscrowParty {
  if (escrow.initiator_id === viewerId) return "initiator";

  if (escrow.receiver_id === viewerId) return "receiver";

  if (escrow.receiver_email === receiverEmail) return "receiver";

  return "unknown";
}

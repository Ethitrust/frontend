"use client";

import { use } from "react";
import { UserShell } from "@/components/user-shell";
import DisputeRoom from "./dispute-room";

export default function DisputeCasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <UserShell>
      <DisputeRoom disputeId={id} />
    </UserShell>
  );
}

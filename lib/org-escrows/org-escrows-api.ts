"use client";

import { getBffErrorMessage } from "@/lib/api/upstream-errors";

import type {
  OrgEscrowCreateResponse,
  OrgEscrowDetail,
  OrgEscrowEventsResponse,
  OrgEscrowHealth,
  OrgEscrowReportSummary,
  OrgEscrowsListResponse,
  OrgWebhookLogRow,
} from "@/lib/org-escrows/org-escrow-types";

async function parseJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchOrgEscrowsList(
  accessToken: string,
  orgId: string,
  opts: {
    page?: number;
    pageSize?: number;
    status?: string;
    search?: string;
    isActive?: boolean | null;
  } = {},
): Promise<OrgEscrowsListResponse> {
  const q = new URLSearchParams();
  q.set("page", String(opts.page ?? 1));
  q.set("page_size", String(opts.pageSize ?? 20));
  if (opts.status) q.set("status", opts.status);
  if (opts.search?.trim()) q.set("search", opts.search.trim());
  if (opts.isActive === true || opts.isActive === false) {
    q.set("is_active", String(opts.isActive));
  }

  const res = await fetch(`/api/me/org-escrows?${q}`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
      "X-Organization-Id": orgId,
    },
    cache: "no-store",
  });
  const data = await parseJson(res);
  if (!res.ok) {
    throw new Error(getBffErrorMessage(data));
  }
  if (
    !data ||
    typeof data !== "object" ||
    !Array.isArray((data as OrgEscrowsListResponse).items)
  ) {
    throw new Error("Unexpected org escrows list response.");
  }
  const row = data as OrgEscrowsListResponse;
  return {
    items: row.items,
    page: typeof row.page === "number" ? row.page : (opts.page ?? 1),
    page_size:
      typeof row.page_size === "number" ? row.page_size : (opts.pageSize ?? 20),
    total: typeof row.total === "number" ? row.total : row.items.length,
    total_pages: typeof row.total_pages === "number" ? row.total_pages : 1,
  };
}

export async function fetchOrgEscrowReportSummary(
  accessToken: string,
  orgId: string,
  dateFrom: string,
  dateTo: string,
): Promise<OrgEscrowReportSummary> {
  const q = new URLSearchParams({
    date_from: dateFrom,
    date_to: dateTo,
  });
  const res = await fetch(`/api/me/org-escrows/reports/summary?${q}`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
      "X-Organization-Id": orgId,
    },
    cache: "no-store",
  });
  const data = await parseJson(res);
  if (!res.ok) {
    throw new Error(getBffErrorMessage(data));
  }
  if (
    !data ||
    typeof data !== "object" ||
    typeof (data as OrgEscrowReportSummary).organization_id !== "string"
  ) {
    throw new Error("Unexpected org escrow report response.");
  }
  const row = data as OrgEscrowReportSummary & {
    volume_over_time?: OrgEscrowReportSummary["volume_over_time"];
  };
  return {
    ...row,
    volume_over_time: Array.isArray(row.volume_over_time)
      ? row.volume_over_time
      : [],
  };
}

export async function fetchOrgEscrowDetail(
  accessToken: string,
  orgId: string,
  escrowId: string,
): Promise<OrgEscrowDetail> {
  const res = await fetch(
    `/api/me/org-escrows/${encodeURIComponent(escrowId)}/detail`,
    {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
        "X-Organization-Id": orgId,
      },
      cache: "no-store",
    },
  );
  const data = await parseJson(res);
  if (!res.ok) {
    throw new Error(getBffErrorMessage(data));
  }
  if (
    !data ||
    typeof data !== "object" ||
    typeof (data as OrgEscrowDetail).escrow_id !== "string"
  ) {
    throw new Error("Unexpected org escrow detail response.");
  }
  const row = data as OrgEscrowDetail;
  return {
    ...row,
    risk_flags: Array.isArray(row.risk_flags) ? row.risk_flags : [],
  };
}

export async function fetchOrgEscrowEvents(
  accessToken: string,
  orgId: string,
  escrowId: string,
): Promise<OrgEscrowEventsResponse> {
  const res = await fetch(
    `/api/me/org-escrows/${encodeURIComponent(escrowId)}/events`,
    {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
        "X-Organization-Id": orgId,
      },
      cache: "no-store",
    },
  );
  const data = await parseJson(res);
  if (!res.ok) {
    throw new Error(getBffErrorMessage(data));
  }
  if (
    !data ||
    typeof data !== "object" ||
    !Array.isArray((data as OrgEscrowEventsResponse).events)
  ) {
    throw new Error("Unexpected org escrow events response.");
  }
  const row = data as OrgEscrowEventsResponse;
  return {
    escrow_id: row.escrow_id,
    events: row.events,
    total: typeof row.total === "number" ? row.total : row.events.length,
  };
}

export async function fetchOrgEscrowHealth(
  accessToken: string,
  orgId: string,
  escrowId: string,
): Promise<OrgEscrowHealth> {
  const res = await fetch(
    `/api/me/org-escrows/${encodeURIComponent(escrowId)}/health`,
    {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
        "X-Organization-Id": orgId,
      },
      cache: "no-store",
    },
  );
  const data = await parseJson(res);
  if (!res.ok) {
    throw new Error(getBffErrorMessage(data));
  }
  if (
    !data ||
    typeof data !== "object" ||
    typeof (data as OrgEscrowHealth).escrow_id !== "string"
  ) {
    throw new Error("Unexpected org escrow health response.");
  }
  return data as OrgEscrowHealth;
}

export async function fetchOrgEscrowWebhookLogs(
  accessToken: string,
  orgId: string,
  escrowId: string,
): Promise<OrgWebhookLogRow[]> {
  const res = await fetch(
    `/api/me/org-escrows/${encodeURIComponent(escrowId)}/webhooks`,
    {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
        "X-Organization-Id": orgId,
      },
      cache: "no-store",
    },
  );
  const data = await parseJson(res);
  if (!res.ok) {
    throw new Error(getBffErrorMessage(data));
  }
  if (!Array.isArray(data)) {
    throw new Error("Unexpected org escrow webhooks response.");
  }
  return data as OrgWebhookLogRow[];
}

export async function postOrgEscrowCreate(
  accessToken: string,
  orgId: string,
  body: unknown,
  idempotencyKey?: string,
): Promise<OrgEscrowCreateResponse> {
  const key = idempotencyKey?.trim() || crypto.randomUUID();
  const res = await fetch("/api/me/org-escrows", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      "X-Organization-Id": orgId,
      "X-Idempotency-Key": key,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const data = await parseJson(res);
  if (!res.ok) {
    throw new Error(getBffErrorMessage(data));
  }
  if (
    !data ||
    typeof data !== "object" ||
    typeof (data as OrgEscrowCreateResponse).id !== "string"
  ) {
    throw new Error("Unexpected create org escrow response.");
  }
  return data as OrgEscrowCreateResponse;
}

export async function postOrgEscrowCancel(
  accessToken: string,
  orgId: string,
  escrowId: string,
): Promise<void> {
  const res = await fetch(
    `/api/me/org-escrows/${encodeURIComponent(escrowId)}/cancel`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "X-Organization-Id": orgId,
      },
      body: "{}",
      cache: "no-store",
    },
  );
  const data = await parseJson(res);
  if (!res.ok) {
    throw new Error(getBffErrorMessage(data));
  }
}

export async function postOrgEscrowResend(
  accessToken: string,
  orgId: string,
  escrowId: string,
): Promise<void> {
  const res = await fetch(
    `/api/me/org-escrows/${encodeURIComponent(escrowId)}/resend`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "X-Organization-Id": orgId,
      },
      body: "{}",
      cache: "no-store",
    },
  );
  const data = await parseJson(res);
  if (!res.ok) {
    throw new Error(getBffErrorMessage(data));
  }
}

export async function fetchOrgWebhookLog(
  accessToken: string,
  orgId: string,
): Promise<OrgWebhookLogRow[]> {
  const res = await fetch("/api/me/org-escrows/webhooks", {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
      "X-Organization-Id": orgId,
    },
    cache: "no-store",
  });
  const data = await parseJson(res);
  if (!res.ok) {
    throw new Error(getBffErrorMessage(data));
  }
  if (!Array.isArray(data)) {
    throw new Error("Unexpected webhook log response.");
  }
  return data as OrgWebhookLogRow[];
}

export async function postOrgWebhookTest(
  accessToken: string,
  orgId: string,
): Promise<{ success: boolean; http_status?: number | null; error?: string | null; target_url?: string | null }> {
  const res = await fetch("/api/me/org-escrows/webhooks/test", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      "X-Organization-Id": orgId,
    },
    body: "{}",
    cache: "no-store",
  });
  const data = await parseJson(res);
  if (!res.ok) {
    throw new Error(getBffErrorMessage(data));
  }
  return data as { success: boolean; http_status?: number | null; error?: string | null; target_url?: string | null };
}

"use client";

import { getBffErrorMessage } from "@/lib/api/upstream-errors";

import type {
  OrgEscrowCancelResponse,
  OrgEscrowDetail,
  OrgEscrowEventsResponse,
  OrgEscrowHealth,
  OrgEscrowReportSummary,
  OrgEscrowStatusFlags,
  OrgEscrowsListResponse,
  OrgWebhookLogRow,
} from "@/lib/org-escrows/org-escrow-types";

/**
 * Client-side API module for the nested org-escrow surface:
 *   /api/v1/organizations/{org_id}/escrows/*
 *
 * Each function takes the user's bearer token + the org id. The BFF
 * (app/api/me/org/[org_id]/escrows/*) forwards to the upstream FastAPI
 * with the user's `Authorization` header; the upstream enforces role.
 */

async function parseJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function bffBase(orgId: string): string {
  return `/api/me/org/${encodeURIComponent(orgId)}/escrows`;
}

function authHeaders(accessToken: string): HeadersInit {
  return {
    Accept: "application/json",
    Authorization: `Bearer ${accessToken}`,
  };
}

function jsonAuthHeaders(accessToken: string): HeadersInit {
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  };
}

export type FetchOrgEscrowsListOptions = {
  page?: number;
  pageSize?: number;
  status?: string;
  search?: string;
  isActive?: boolean | null;
  dateFrom?: string | null;
  dateTo?: string | null;
};

export async function fetchOrgEscrowsList(
  accessToken: string,
  orgId: string,
  opts: FetchOrgEscrowsListOptions = {},
): Promise<OrgEscrowsListResponse> {
  const q = new URLSearchParams();
  q.set("page", String(opts.page ?? 1));
  q.set("page_size", String(opts.pageSize ?? 20));
  if (opts.status) q.set("status", opts.status);
  if (opts.search?.trim()) q.set("search", opts.search.trim());
  if (opts.isActive === true || opts.isActive === false) {
    q.set("is_active", String(opts.isActive));
  }
  if (opts.dateFrom) q.set("date_from", opts.dateFrom);
  if (opts.dateTo) q.set("date_to", opts.dateTo);

  const res = await fetch(`${bffBase(orgId)}?${q.toString()}`, {
    headers: authHeaders(accessToken),
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
  dateFrom?: string,
  dateTo?: string,
): Promise<OrgEscrowReportSummary> {
  const q = new URLSearchParams();
  if (dateFrom) q.set("date_from", dateFrom);
  if (dateTo) q.set("date_to", dateTo);
  const qs = q.toString();
  const url = qs
    ? `${bffBase(orgId)}/reports/summary?${qs}`
    : `${bffBase(orgId)}/reports/summary`;

  const res = await fetch(url, {
    headers: authHeaders(accessToken),
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
  const row = data as OrgEscrowReportSummary;
  return {
    ...row,
    volume_over_time: Array.isArray(row.volume_over_time)
      ? row.volume_over_time
      : [],
  };
}

/** GET /escrows/{escrow_id} — status flags. */
export async function fetchOrgEscrow(
  accessToken: string,
  orgId: string,
  escrowId: string,
): Promise<OrgEscrowStatusFlags> {
  const res = await fetch(
    `${bffBase(orgId)}/${encodeURIComponent(escrowId)}`,
    {
      headers: authHeaders(accessToken),
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
    typeof (data as OrgEscrowStatusFlags).escrow_id !== "string"
  ) {
    throw new Error("Unexpected org escrow status response.");
  }
  return data as OrgEscrowStatusFlags;
}

export async function fetchOrgEscrowDetail(
  accessToken: string,
  orgId: string,
  escrowId: string,
): Promise<OrgEscrowDetail> {
  const res = await fetch(
    `${bffBase(orgId)}/${encodeURIComponent(escrowId)}/detail`,
    {
      headers: authHeaders(accessToken),
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
    `${bffBase(orgId)}/${encodeURIComponent(escrowId)}/events`,
    {
      headers: authHeaders(accessToken),
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
    `${bffBase(orgId)}/${encodeURIComponent(escrowId)}/health`,
    {
      headers: authHeaders(accessToken),
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
    `${bffBase(orgId)}/${encodeURIComponent(escrowId)}/webhooks`,
    {
      headers: authHeaders(accessToken),
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

/** Org-wide webhook deliveries (50 most recent). */
export async function fetchOrgWebhookLog(
  accessToken: string,
  orgId: string,
): Promise<OrgWebhookLogRow[]> {
  const res = await fetch(`${bffBase(orgId)}/webhooks`, {
    headers: authHeaders(accessToken),
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

// NOTE: org-escrow CREATION is intentionally not exposed on this dashboard.
// Organizations create escrows via the public API only. The corresponding
// `POST /api/v1/organizations/{org_id}/escrows` upstream endpoint has no BFF
// or client helper here.

export async function postOrgEscrowCancel(
  accessToken: string,
  orgId: string,
  escrowId: string,
): Promise<OrgEscrowCancelResponse | null> {
  const res = await fetch(
    `${bffBase(orgId)}/${encodeURIComponent(escrowId)}/cancel`,
    {
      method: "POST",
      headers: jsonAuthHeaders(accessToken),
      body: "{}",
      cache: "no-store",
    },
  );
  const data = await parseJson(res);
  if (!res.ok) {
    throw new Error(getBffErrorMessage(data));
  }
  if (data && typeof data === "object" && "id" in data) {
    return data as OrgEscrowCancelResponse;
  }
  return null;
}

export async function postOrgEscrowResend(
  accessToken: string,
  orgId: string,
  escrowId: string,
): Promise<void> {
  const res = await fetch(
    `${bffBase(orgId)}/${encodeURIComponent(escrowId)}/resend`,
    {
      method: "POST",
      headers: jsonAuthHeaders(accessToken),
      body: "{}",
      cache: "no-store",
    },
  );
  const data = await parseJson(res);
  if (!res.ok) {
    throw new Error(getBffErrorMessage(data));
  }
}

/**
 * Legacy: fire a test webhook ping. NOT part of the new nested surface;
 * kept for the developer-tools webhook config view. Targets the old route.
 * @deprecated Will be removed once the developer view is migrated.
 */
export async function postOrgWebhookTest(
  accessToken: string,
  orgId: string,
): Promise<{
  success: boolean;
  http_status?: number | null;
  error?: string | null;
  target_url?: string | null;
}> {
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
  return data as {
    success: boolean;
    http_status?: number | null;
    error?: string | null;
    target_url?: string | null;
  };
}

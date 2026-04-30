import { fetchApi } from "@/lib/api";

export async function getVerificationQueue() {
  return fetchApi(`/admin/verifications?status=pending`);
}

export async function getVerification(id: string) {
  return fetchApi(`/admin/verifications/${id}`);
}

export async function getForensicReport(id: string) {
  return fetchApi(`/admin/verifications/${id}/forensics`);
}

export async function approveVerification(id: string, payload: any = {}) {
  return fetchApi(`/admin/verifications/${id}/approve`, { method: "POST", body: JSON.stringify(payload) });
}

export async function rejectVerification(id: string, payload: any = {}) {
  return fetchApi(`/admin/verifications/${id}/reject`, { method: "POST", body: JSON.stringify(payload) });
}

export async function requestMoreInfo(id: string, payload: any = {}) {
  return fetchApi(`/admin/verifications/${id}/request-info`, { method: "POST", body: JSON.stringify(payload) });
}

export async function getAuditLogs(params?: Record<string, any>) {
  const qs = params ? new URLSearchParams(params as any).toString() : "";
  return fetchApi(`/admin/audit-logs${qs ? `?${qs}` : ""}`);
}

export async function getEscrowStateHistory(escrowId: string) {
  return fetchApi(`/admin/escrows/${escrowId}/history`);
}

export default {
  getVerificationQueue,
  getVerification,
  getForensicReport,
  approveVerification,
  rejectVerification,
  requestMoreInfo,
  getAuditLogs,
  getEscrowStateHistory,
};

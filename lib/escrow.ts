import { fetchApi } from "@/lib/api";

export async function getEscrow(id: string) {
  return fetchApi(`/escrows/${id}`);
}

export async function createEscrow(payload: any) {
  return fetchApi(`/escrows`, { method: "POST", body: JSON.stringify(payload) });
}

export async function fundEscrow(id: string, opts: { return_url?: string } = {}) {
  return fetchApi(`/escrows/${id}/fund`, { method: "POST", body: JSON.stringify(opts) });
}

export async function markDelivered(id: string) {
  return fetchApi(`/escrows/${id}/deliver`, { method: "POST" });
}

export async function releaseEscrow(id: string) {
  return fetchApi(`/escrows/${id}/release`, { method: "POST" });
}

export async function openDispute(id: string, payload: any = {}) {
  return fetchApi(`/escrows/${id}/dispute`, { method: "POST", body: JSON.stringify(payload) });
}

export async function createMilestone(id: string, payload: any) {
  return fetchApi(`/escrows/${id}/milestones`, { method: "POST", body: JSON.stringify(payload) });
}

export async function submitMilestone(escrowId: string, milestoneId: string, payload: any) {
  return fetchApi(`/escrows/${escrowId}/milestones/${milestoneId}/submit`, { method: "POST", body: JSON.stringify(payload) });
}

export async function acceptMilestone(escrowId: string, milestoneId: string) {
  return fetchApi(`/escrows/${escrowId}/milestones/${milestoneId}/accept`, { method: "POST" });
}

export async function rejectMilestone(escrowId: string, milestoneId: string, reason?: string) {
  return fetchApi(`/escrows/${escrowId}/milestones/${milestoneId}/reject`, { method: "POST", body: JSON.stringify({ reason }) });
}

export default getEscrow;

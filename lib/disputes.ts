import { fetchApi } from "@/lib/api";

export async function getDispute(id: string) {
  return fetchApi(`/disputes/${id}`);
}

export async function getMessages(id: string) {
  return fetchApi(`/disputes/${id}/messages`);
}

export async function postMessage(id: string, payload: { body?: string; attachments?: string[]; metadata?: any }) {
  return fetchApi(`/disputes/${id}/messages`, { method: "POST", body: JSON.stringify(payload) });
}

export async function resolveDispute(id: string, payload: { resolution?: string } = {}) {
  return fetchApi(`/disputes/${id}/resolve`, { method: "POST", body: JSON.stringify(payload) });
}

export async function escalateDispute(id: string, payload: { reason?: string } = {}) {
  return fetchApi(`/disputes/${id}/escalate`, { method: "POST", body: JSON.stringify(payload) });
}

export default getDispute;

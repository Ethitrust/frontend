import { fetchApi } from "@/lib/api";

export async function listApiKeys() {
  return fetchApi(`/developer/keys`);
}

export async function createApiKey(name?: string) {
  return fetchApi(`/developer/keys`, { method: "POST", body: JSON.stringify({ name }) });
}

export async function revokeApiKey(id: string) {
  return fetchApi(`/developer/keys/${id}/revoke`, { method: "POST" });
}

export async function getWebhookConfig() {
  return fetchApi(`/developer/webhook`);
}

export async function updateWebhookConfig(payload: any) {
  return fetchApi(`/developer/webhook`, { method: "POST", body: JSON.stringify(payload) });
}

export async function testWebhookDelivery(payload: any = {}) {
  return fetchApi(`/developer/webhook/test`, { method: "POST", body: JSON.stringify(payload) });
}

export async function getRequestLogs(limit = 50) {
  return fetchApi(`/developer/logs?limit=${limit}`);
}

export default {
  listApiKeys,
  createApiKey,
  revokeApiKey,
  getWebhookConfig,
  updateWebhookConfig,
  testWebhookDelivery,
  getRequestLogs,
};

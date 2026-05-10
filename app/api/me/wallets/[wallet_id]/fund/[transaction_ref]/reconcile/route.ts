import { proxyV1PostJson } from "@/lib/api/proxy-v1";

/** BFF for `POST /api/v1/wallets/{wallet_id}/fund/{transaction_ref}/reconcile` */
export async function POST(
  request: Request,
  context: { params: Promise<{ wallet_id: string; transaction_ref: string }> },
) {
  const { wallet_id, transaction_ref } = await context.params;
  return proxyV1PostJson(
    request,
    `/api/v1/wallets/${encodeURIComponent(wallet_id)}/fund/${encodeURIComponent(transaction_ref)}/reconcile`,
  );
}

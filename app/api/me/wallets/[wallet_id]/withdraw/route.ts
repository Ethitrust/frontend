import { proxyV1PostJson } from '@/lib/api/proxy-v1'

/** BFF for `POST /api/v1/wallets/{wallet_id}/withdraw` */
export async function POST(
  request: Request,
  context: { params: Promise<{ wallet_id: string }> },
) {
  const { wallet_id } = await context.params
  return proxyV1PostJson(request, `/api/v1/wallets/${encodeURIComponent(wallet_id)}/withdraw`)
}

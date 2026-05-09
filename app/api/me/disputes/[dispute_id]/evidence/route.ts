import { proxyV1PostJson, proxyV1PostMultipart } from "@/lib/api/proxy-v1";

type Ctx = { params: Promise<{ dispute_id: string }> };

/** BFF for `POST /api/v1/disputes/{dispute_id}/evidence`. */
export async function POST(request: Request, context: Ctx) {
  const { dispute_id } = await context.params;
  return proxyV1PostMultipart(
    request,
    `/api/v1/disputes/${encodeURIComponent(dispute_id)}/evidence`,
  );
}

import { proxyV1PostMultipart } from '@/lib/api/proxy-v1'

/** BFF for `POST /api/v1/kyc/submit` (multipart manual KYC: id metadata + document files). */
export async function POST(request: Request) {
  return proxyV1PostMultipart(request, '/api/v1/kyc/submit')
}

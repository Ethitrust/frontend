import { proxyV1GetJson, proxyV1PostMultipart } from '@/lib/api/proxy-v1'

/** BFF for `GET /api/v1/kyc/status` (latest manual KYC submission). */
export async function GET(request: Request) {
  return proxyV1GetJson(request, '/api/v1/kyc/status')
}

/** BFF for `POST /api/v1/kyc/submit` (multipart manual KYC: id metadata + document files). */
export async function POST(request: Request) {
  return proxyV1PostMultipart(request, '/api/v1/kyc/submit')
}

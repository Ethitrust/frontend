import { proxyV1PostMultipart } from '@/lib/api/proxy-v1'

/** BFF for `POST …/applications/business-license/upload-url` (multipart `file`). */
export async function POST(request: Request) {
  return proxyV1PostMultipart(
    request,
    '/api/v1/organizations/applications/business-license/upload-url',
  )
}

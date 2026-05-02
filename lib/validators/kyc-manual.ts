import { z } from 'zod'

export const kycManualSchema = z.object({
  holderName: z.string().trim().min(1, 'Enter the name as shown on your ID').max(255),
  idType: z.enum(['national_id', 'passport', 'drivers_license']),
  idNumber: z.string().trim().min(1, 'Enter your document number').max(128),
})

export type KycManualFormValues = z.infer<typeof kycManualSchema>

/** Matches `POST /api/v1/kyc/submit`: front image required; back and selfie optional. */
export function assertManualFiles(files: {
  front: File | null
  back: File | null
  selfie: File | null
}): string | null {
  if (!files.front) return 'Add a photo of the front of your government ID.'

  const maxBytes = 12 * 1024 * 1024
  const toCheck: File[] = [files.front]
  if (files.back) toCheck.push(files.back)
  if (files.selfie) toCheck.push(files.selfie)
  for (const f of toCheck) {
    if (f.size > maxBytes) return 'Each file must be 12 MB or smaller.'
    if (!/^image\/(jpeg|png|webp)$/.test(f.type)) return 'Use JPG, PNG, or WEBP photos for uploads.'
  }
  return null
}

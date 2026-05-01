import { z } from 'zod'

export const kycManualSchema = z.object({
  holderName: z.string().trim().min(3, 'Enter the name as shown on your ID').max(120),
  idType: z.enum(['national_id', 'passport', 'drivers_license']),
  idNumber: z.string().trim().min(4, 'Enter your document number').max(64),
  notes: z.string().trim().max(500).optional(),
})

export type KycManualFormValues = z.infer<typeof kycManualSchema>

export function assertManualFiles(files: {
  front: File | null
  back: File | null
  selfie: File | null
}): string | null {
  if (!files.front) return 'Add a photo of the front of your government ID.'
  if (!files.back) return 'Add a photo of the back of your government ID.'
  if (!files.selfie) return 'Add a photo of yourself holding the ID beside your face (if required by policy).'

  const maxBytes = 12 * 1024 * 1024
  for (const f of [files.front, files.back, files.selfie]) {
    if (f!.size > maxBytes) return 'Each file must be 12 MB or smaller.'
    if (!/^image\/(jpeg|png|webp)$/.test(f!.type))
      return 'Use JPG, PNG, or WEBP photos for uploads.'
  }
  return null
}

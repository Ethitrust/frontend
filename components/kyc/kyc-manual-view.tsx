'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ComplianceFlowShell } from '@/components/kyc/compliance-flow-shell'
import { KycSessionGate } from '@/components/kyc/kyc-session-gate'
import { postManualKycSubmission } from '@/lib/kyc/me-kyc-api'
import {
  assertManualFiles,
  kycManualSchema,
  type KycManualFormValues,
} from '@/lib/validators/kyc-manual'

function fileLabel(name: string, file: File | null) {
  return (
    <p className="text-xs text-muted-foreground">
      {name}: {file ? `${file.name} (${(file.size / 1024).toFixed(0)} KB)` : 'No file selected'}
    </p>
  )
}

export function KycManualView() {
  return (
    <KycSessionGate
      title="Manual ID submission"
      description="Collect document photos for an operations review when automatic checks are not available."
    >
      {(accessToken) => <KycManualSignedIn accessToken={accessToken} />}
    </KycSessionGate>
  )
}

function KycManualSignedIn({ accessToken }: { accessToken: string }) {
  const qc = useQueryClient()
  const [front, setFront] = useState<File | null>(null)
  const [back, setBack] = useState<File | null>(null)
  const [selfie, setSelfie] = useState<File | null>(null)

  const form = useForm<KycManualFormValues>({
    resolver: zodResolver(kycManualSchema),    
    defaultValues: {
      holderName: '',
      idType: 'national_id',
      idNumber: '',
    },
  })

  const submitMutation = useMutation({
    mutationFn: async (values: KycManualFormValues) => {
      const fileError = assertManualFiles({ front, back, selfie })
      if (fileError) throw new Error(fileError)

      const fd = new FormData()
      fd.set('full_name', values.holderName.trim())
      fd.set('id_number', values.idNumber.trim())
      fd.set('id_type', values.idType)

      fd.set('front_id_file', front!, front!.name)
      if (back) fd.set('back_id_file', back, back.name)
      if (selfie) fd.set('selfie_file', selfie, selfie.name)

      return postManualKycSubmission(accessToken, fd)
    },
    onSuccess: () => {
      toast.success('Documents submitted', {
        description: 'Your packet was uploaded for manual review. We will refresh your profile status.',
      })
      void qc.invalidateQueries({ queryKey: ['me', 'auth', 'profile'] })
      form.reset({ holderName: '', idType: 'national_id', idNumber: '' })
      setFront(null)
      setBack(null)
      setSelfie(null)
    },
    onError: (err) => {
      toast.error('Submission failed', {
        description: err instanceof Error ? err.message : 'Request failed.',
      })
    },
  })

  function onSubmit(values: KycManualFormValues) {
    submitMutation.mutate(values)
  }

  return (
    <ComplianceFlowShell
      title="Manual ID submission"
      description="Upload sharp, well-lit photos of your ID and a portrait. Review teams use them when digital verification is not possible."
      contentClassName="max-w-3xl"
    >
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Document packet</CardTitle>
          <CardDescription>
            Match the legal name and number on the physical ID. Blur or glare will slow manual review.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid gap-6 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="holderName"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Full legal name</FormLabel>
                      <FormControl>
                        <Input placeholder="As printed on the ID" className="rounded-lg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="idType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Document type</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="w-full rounded-lg">
                            <SelectValue placeholder="Choose type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="national_id">National ID card</SelectItem>
                          <SelectItem value="passport">Passport</SelectItem>
                          <SelectItem value="drivers_license">Driver’s licence</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="idNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Document number</FormLabel>
                      <FormControl>
                        <Input className="rounded-lg font-mono text-sm uppercase" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4 rounded-xl border bg-muted/20 p-4">
                <p className="text-sm font-medium text-foreground">Photos</p>
                <div className="grid gap-4 md:grid-cols-3">
                  <FormItem>
                    <FormLabel>Front</FormLabel>
                    <FormControl>
                      <Input
                        accept="image/jpeg,image/png,image/webp"
                        type="file"
                        className="rounded-lg bg-background"
                        onChange={(ev) => setFront(ev.target.files?.[0] ?? null)}
                      />
                    </FormControl>
                    {fileLabel('Front', front)}
                  </FormItem>
                  <FormItem>
                    <FormLabel>Back (optional)</FormLabel>
                    <FormControl>
                      <Input
                        accept="image/jpeg,image/png,image/webp"
                        type="file"
                        className="rounded-lg bg-background"
                        onChange={(ev) => setBack(ev.target.files?.[0] ?? null)}
                      />
                    </FormControl>
                    {fileLabel('Back', back)}
                  </FormItem>
                  <FormItem>
                    <FormLabel>Selfie (optional)</FormLabel>
                    <FormDescription className="text-xs">Add a live photo if you want to strengthen the submission.</FormDescription>
                    <FormControl>
                      <Input
                        accept="image/jpeg,image/png,image/webp"
                        type="file"
                        className="rounded-lg bg-background"
                        onChange={(ev) => setSelfie(ev.target.files?.[0] ?? null)}
                      />
                    </FormControl>
                    {fileLabel('Selfie', selfie)}
                  </FormItem>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button type="submit" className="rounded-full" disabled={submitMutation.isPending}>
                  {submitMutation.isPending ? 'Uploading…' : 'Submit for review'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full"
                  disabled={submitMutation.isPending}
                  onClick={() => {
                    form.reset({ holderName: '', idType: 'national_id', idNumber: '' })
                    setFront(null)
                    setBack(null)
                    setSelfie(null)
                  }}
                >
                  Clear fields
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-4 border-t bg-muted/10 text-sm text-muted-foreground">
          <span>Try electronic verification?</span>
          <Link href="/kyc/fayda" className="text-primary underline-offset-4 hover:underline">
            Open Fayda flow
          </Link>
          <span aria-hidden>·</span>
          <Link href="/kyc" className="text-primary underline-offset-4 hover:underline">
            Verification overview
          </Link>
        </CardFooter>
      </Card>
    </ComplianceFlowShell>
  )
}

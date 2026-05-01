'use client'

import Link from 'next/link'
import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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
import { Textarea } from '@/components/ui/textarea'
import { ComplianceFlowShell } from '@/components/kyc/compliance-flow-shell'
import { KycSessionGate } from '@/components/kyc/kyc-session-gate'
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

function KycManualSignedIn({ accessToken: _accessToken }: { accessToken: string }) {
  const [front, setFront] = useState<File | null>(null)
  const [back, setBack] = useState<File | null>(null)
  const [selfie, setSelfie] = useState<File | null>(null)

  const form = useForm<KycManualFormValues>({
    resolver: zodResolver(kycManualSchema),
    defaultValues: {
      holderName: '',
      idType: 'national_id',
      idNumber: '',
      notes: '',
    },
  })

  function onSubmit(values: KycManualFormValues) {
    const fileError = assertManualFiles({ front, back, selfie })
    if (fileError) {
      toast.error(fileError)
      return
    }
    toast.message('Packet prepared locally', {
      description:
        'Document upload routes are not in the published reference yet, so nothing was uploaded. This page is ready to connect when your team exposes them.',
    })
    form.reset({ holderName: '', idType: 'national_id', idNumber: '', notes: '' })
    setFront(null)
    setBack(null)
    setSelfie(null)
  }

  return (
    <ComplianceFlowShell
      title="Manual ID submission"
      description="Upload sharp, well-lit photos of your ID and a portrait. Review teams use them when digital verification is not possible."
      contentClassName="max-w-3xl"
    >
      <Alert className="mb-8 border-sky-200 bg-sky-50/80 text-sky-950 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-100">
        <AlertTitle>Preview mode</AlertTitle>
        <AlertDescription>
          Document upload and review queues are not described in the current API reference. Rehearse the flow here;
          files stay in your browser until a service is connected.
        </AlertDescription>
      </Alert>

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
                    <FormLabel>Back</FormLabel>
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
                    <FormLabel>Selfie with ID</FormLabel>
                    <FormDescription className="text-xs">Portrait beside the document edge if policy requires.</FormDescription>
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

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes for reviewers (optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Explain name changes, document renewals, or extra context."
                        className="min-h-[96px] rounded-lg"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-wrap gap-3">
                <Button type="submit" className="rounded-full">
                  Submit for review (preview)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => {
                    form.reset({ holderName: '', idType: 'national_id', idNumber: '', notes: '' })
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

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
import { ComplianceFlowShell } from '@/components/kyc/compliance-flow-shell'
import { KycSessionGate } from '@/components/kyc/kyc-session-gate'
import {
  kycFaydaSendSchema,
  type KycFaydaSendPayload,
  kycFaydaVerifySchema,
  type KycFaydaVerifyPayload,
} from '@/lib/validators/kyc-fayda'

export function KycFaydaView() {
  return (
    <KycSessionGate
      title="Fayda verification"
      description="Two-step digital identity flow using Ethiopia’s national directory when your deployment enables it."
    >
      {(accessToken) => <KycFaydaSignedIn accessToken={accessToken} />}
    </KycSessionGate>
  )
}

function KycFaydaSignedIn({ accessToken: _accessToken }: { accessToken: string }) {
  const [phase, setPhase] = useState<'send' | 'verify'>('send')
  const [lastIdentifier, setLastIdentifier] = useState('')

  const sendForm = useForm<KycFaydaSendPayload>({
    resolver: zodResolver(kycFaydaSendSchema),
    defaultValues: { identifier: '' },
  })

  const verifyForm = useForm<KycFaydaVerifyPayload>({
    resolver: zodResolver(kycFaydaVerifySchema),
    defaultValues: { code: '' },
  })

  function onSend(values: KycFaydaSendPayload) {
    setLastIdentifier(values.identifier.trim())
    setPhase('verify')
    verifyForm.reset({ code: '' })
    toast.message('Code step unlocked', {
      description:
        'Fayda messaging is not part of the documented API yet, so no SMS was sent. This step is here so the experience is ready when your backend enables it.',
    })
  }

  function onVerify(values: KycFaydaVerifyPayload) {
    toast.message('Verification captured', {
      description: `We kept a ${values.code.length}-digit preview only. Hook this step to your production gateway when it is ready.`,
    })
    verifyForm.reset({ code: '' })
  }

  return (
    <ComplianceFlowShell
      title="Fayda verification"
      description="Send a one-time code to a Fayda-linked mobile number or identifier, then confirm the digits you receive."
    >
      <Alert className="mb-8 border-sky-200 bg-sky-50/80 text-sky-950 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-100">
        <AlertTitle>Preview mode</AlertTitle>
        <AlertDescription>
          The current API reference documents your profile verification state, not the dedicated Fayda messaging service.
          Nothing leaves this browser until that integration ships.
        </AlertDescription>
      </Alert>

      <div className="space-y-6">
        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          <span className={phase === 'send' ? 'font-medium text-foreground' : ''}>1 · Request code</span>
          <span aria-hidden className="text-muted-foreground/60">
            →
          </span>
          <span className={phase === 'verify' ? 'font-medium text-foreground' : ''}>2 · Enter code</span>
        </div>

        {phase === 'send' ? (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Where should we send the code?</CardTitle>
              <CardDescription>
                Use the mobile number registered with Fayda or the FAN-style identifier your compliance team provided.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...sendForm}>
                <form onSubmit={sendForm.handleSubmit(onSend)} className="space-y-6">
                  <FormField
                    control={sendForm.control}
                    name="identifier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone or Fayda identifier</FormLabel>
                        <FormControl>
                          <Input
                            autoComplete="tel"
                            placeholder="+2519… or FAN"
                            className="rounded-lg font-mono text-sm"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Example formats: +251912345678, 0912345678, or your FAN reference.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="rounded-full">
                    Continue to code entry
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Confirm the OTP</CardTitle>
              <CardDescription>
                Enter the numbers from SMS or USSD against identifier{' '}
                <span className="font-semibold text-foreground">{lastIdentifier}</span>.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...verifyForm}>
                <form onSubmit={verifyForm.handleSubmit(onVerify)} className="space-y-6">
                  <FormField
                    control={verifyForm.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>One-time password</FormLabel>
                        <FormControl>
                          <Input
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            placeholder="000000"
                            className="max-w-xs rounded-lg font-mono text-lg tracking-[0.2em]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>Typically four to eight digits depending on Fayda rollout.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex flex-wrap gap-3">
                    <Button type="submit" className="rounded-full">
                      Verify (preview)
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-full"
                      onClick={() => {
                        setPhase('send')
                        verifyForm.reset({ code: '' })
                      }}
                    >
                      Adjust identifier
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
            <CardFooter className="text-sm text-muted-foreground">
              Prefer uploads instead?{' '}
              <Link href="/kyc/manual" className="text-primary underline-offset-4 hover:underline">
                Switch to manual review
              </Link>
              .
            </CardFooter>
          </Card>
        )}
      </div>
    </ComplianceFlowShell>
  )
}

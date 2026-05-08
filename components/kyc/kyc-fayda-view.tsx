'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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
  extractFaydaTransactionId,
  fetchFaydaTaskStatus,
  postFaydaSendOtp,
  postFaydaVerifyOtp,
} from '@/lib/kyc/me-kyc-api'
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

function KycFaydaSignedIn({ accessToken }: { accessToken: string }) {
  const qc = useQueryClient()
  const [phase, setPhase] = useState<'send' | 'verify'>('send')
  const [lastIdentifier, setLastIdentifier] = useState('')
  const [sendTaskId, setSendTaskId] = useState('')
  const [verifyTaskId, setVerifyTaskId] = useState('')
  const [transactionId, setTransactionId] = useState('')

  const sendForm = useForm<KycFaydaSendPayload>({
    resolver: zodResolver(kycFaydaSendSchema),
    defaultValues: { identifier: '' },
  })

  const verifyForm = useForm<KycFaydaVerifyPayload>({
    resolver: zodResolver(kycFaydaVerifySchema),
    defaultValues: { code: '' },
  })

  const sendMutation = useMutation({
    mutationFn: (values: KycFaydaSendPayload) => postFaydaSendOtp(accessToken, values.identifier.trim()),
    onSuccess: (data, values) => {
      setLastIdentifier(values.identifier.trim())
      setSendTaskId(data.task_id)
      setVerifyTaskId('')
      setTransactionId('')
      setPhase('verify')
      verifyForm.reset({ code: '' })
      toast.success('Fayda OTP request queued')
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Could not request Fayda OTP')
    },
  })

  const sendTaskQuery = useQuery({
    queryKey: ['me', 'kyc', 'fayda', 'task', sendTaskId],
    queryFn: () => fetchFaydaTaskStatus(accessToken, sendTaskId),
    enabled: Boolean(sendTaskId && !transactionId),
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return status === 'SUCCESS' || status === 'FAILURE' ? false : 1500
    },
  })

  useEffect(() => {
    const task = sendTaskQuery.data
    if (!task) return
    if (task.status === 'FAILURE') {
      toast.error(task.error ?? 'Fayda OTP request failed')
      return
    }
    if (task.status !== 'SUCCESS') return
    const tx = extractFaydaTransactionId(task.result)
    if (!tx) {
      toast.error('Fayda did not return a transaction id.')
      return
    }
    setTransactionId(tx)
    toast.success('OTP sent. Enter the code you received.')
  }, [sendTaskQuery.data])

  const verifyMutation = useMutation({
    mutationFn: (values: KycFaydaVerifyPayload) =>
      postFaydaVerifyOtp(accessToken, {
        fan_or_fin: lastIdentifier,
        transaction_id: transactionId,
        otp: values.code.trim(),
      }),
    onSuccess: (data) => {
      setVerifyTaskId(data.task_id)
      toast.success('Fayda verification queued')
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Could not verify Fayda OTP')
    },
  })

  const verifyTaskQuery = useQuery({
    queryKey: ['me', 'kyc', 'fayda', 'task', verifyTaskId],
    queryFn: () => fetchFaydaTaskStatus(accessToken, verifyTaskId),
    enabled: Boolean(verifyTaskId),
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return status === 'SUCCESS' || status === 'FAILURE' ? false : 1500
    },
  })

  useEffect(() => {
    const task = verifyTaskQuery.data
    if (!task) return
    if (task.status === 'FAILURE') {
      toast.error(task.error ?? 'Fayda verification failed')
      return
    }
    if (task.status !== 'SUCCESS') return
    toast.success('Fayda verification complete')
    verifyForm.reset({ code: '' })
    void qc.invalidateQueries({ queryKey: ['me', 'auth', 'profile'] })
  }, [qc, verifyForm, verifyTaskQuery.data])

  function onSend(values: KycFaydaSendPayload) {
    sendMutation.mutate(values)
  }

  function onVerify(values: KycFaydaVerifyPayload) {
    if (!transactionId) {
      toast.error('Wait for Fayda to return a transaction id before verifying.')
      return
    }
    verifyMutation.mutate(values)
  }

  return (
    <ComplianceFlowShell
      title="Fayda verification"
      description="Send a one-time code to a Fayda-linked mobile number or identifier, then confirm the digits you receive."
    >
      <Alert className="mb-8 border-sky-200 bg-sky-50/80 text-sky-950 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-100">
        <AlertTitle>Live Fayda request</AlertTitle>
        <AlertDescription>
          OTP requests are sent through the backend Fayda integration. Keep this tab open while the task updates.
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
                  <Button type="submit" className="rounded-full" disabled={sendMutation.isPending}>
                    {sendMutation.isPending ? 'Requesting OTP…' : 'Send OTP'}
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
              {!transactionId ? (
                <Alert className="mb-6">
                  <AlertTitle>Waiting for Fayda</AlertTitle>
                  <AlertDescription>
                    Current task status: {sendTaskQuery.data?.status ?? 'PENDING'}.
                  </AlertDescription>
                </Alert>
              ) : null}
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
                    <Button
                      type="submit"
                      className="rounded-full"
                      disabled={!transactionId || verifyMutation.isPending || verifyTaskQuery.data?.status === 'PENDING'}
                    >
                      {verifyMutation.isPending || verifyTaskQuery.data?.status === 'PENDING'
                        ? 'Verifying…'
                        : 'Verify OTP'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-full"
                      onClick={() => {
                        setPhase('send')
                        setSendTaskId('')
                        setVerifyTaskId('')
                        setTransactionId('')
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
              {verifyTaskQuery.data?.status === 'SUCCESS' ? 'Verification complete. ' : null}
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

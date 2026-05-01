'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { REGEXP_ONLY_DIGITS } from 'input-otp'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useSearchParams } from 'next/navigation'
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { Spinner } from '@/components/ui/spinner'
import {
  useResendVerificationMutation,
  useVerifyEmailMutation,
} from '@/lib/api/auth-mutations'
import { ethitrustThemeTokens } from '@/lib/ethitrust-theme'
import {
  resendVerificationPayloadSchema,
  verifyEmailPayloadSchema,
  type VerifyEmailPayload,
} from '@/lib/validators/verify-email'
import { cn } from '@/lib/utils'

export function VerifyEmailPanel({ className }: { className?: string }) {
  const searchParams = useSearchParams()
  const emailFromQuery = searchParams.get('email')?.trim() ?? ''
  const [verified, setVerified] = useState(false)

  const verifyMutation = useVerifyEmailMutation()
  const resendMutation = useResendVerificationMutation()

  const form = useForm<VerifyEmailPayload>({
    resolver: zodResolver(verifyEmailPayloadSchema),
    defaultValues: {
      email: emailFromQuery,
      otp: '',
    },
  })

  useEffect(() => {
    if (emailFromQuery) {
      form.setValue('email', emailFromQuery)
    }
  }, [emailFromQuery, form.setValue])

  function onSubmit(values: VerifyEmailPayload) {
    verifyMutation.mutate(values, {
      onSuccess: () => {
        setVerified(true)
        form.reset({ email: values.email, otp: '' })
      },
    })
  }

  function resendCode() {
    const email = form.getValues('email')
    const parsed = resendVerificationPayloadSchema.safeParse({ email })
    if (!parsed.success) {
      toast.error('Enter a valid email address first.')
      return
    }
    resendMutation.mutate({ email: parsed.data.email })
  }

  const e = ethitrustThemeTokens
  const busy = verifyMutation.isPending || resendMutation.isPending

  return (
    <Card className={cn('w-full max-w-md border-border shadow-sm', className)}>
      <CardHeader className="gap-2">
        <p className={e.typography.eyebrow}>Email verification</p>
        <CardTitle className={cn(e.typography.displayLG, 'font-serif font-normal')}>
          Enter your verification code
        </CardTitle>
        <CardDescription className="text-base leading-relaxed">
          We sent a 6-digit code to your inbox. Enter it below to confirm this address before
          escrow actions.
        </CardDescription>
      </CardHeader>

      {verified ? (
        <>
          <CardContent className="py-6">
            <p className="text-center text-sm leading-relaxed text-foreground">
              Your email is verified. You can sign in to continue.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 border-t border-border pt-6">
            <Button asChild className="h-11 w-full rounded-full" variant="default">
              <Link href="/signin">Sign in</Link>
            </Button>
            <Button asChild variant="ghost" className="text-muted-foreground">
              <Link href="/">Back to home</Link>
            </Button>
          </CardFooter>
        </>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="grid gap-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        autoComplete="email"
                        placeholder="you@company.et"
                        disabled={busy}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="otp"
                render={({ field }) => (
                  <FormItem className="items-center gap-3">
                    <FormLabel className="self-start">Verification code</FormLabel>
                    <FormControl>
                      <InputOTP
                        maxLength={6}
                        pattern={REGEXP_ONLY_DIGITS}
                        inputMode="numeric"
                        disabled={busy}
                        value={field.value}
                        onChange={field.onChange}
                      >
                        <InputOTPGroup className="gap-1.5">
                          {[0, 1, 2, 3, 4, 5].map((i) => (
                            <InputOTPSlot key={i} index={i} />
                          ))}
                        </InputOTPGroup>
                      </InputOTP>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>

            <CardFooter className="flex flex-col gap-4 border-t border-border pt-6">
              <Button
                type="submit"
                disabled={busy}
                size="lg"
                className="h-11 w-full rounded-full transition-transform hover:scale-[1.02]"
              >
                {verifyMutation.isPending ? (
                  <>
                    <Spinner className="size-4" />
                    Verifying…
                  </>
                ) : (
                  'Verify email'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                className="h-11 w-full rounded-full"
                onClick={resendCode}
              >
                {resendMutation.isPending ? (
                  <>
                    <Spinner className="size-4" />
                    Sending…
                  </>
                ) : (
                  'Resend code'
                )}
              </Button>
              <Button asChild variant="ghost" className="text-muted-foreground">
                <Link href="/signin">Back to sign in</Link>
              </Button>
            </CardFooter>
          </form>
        </Form>
      )}
    </Card>
  )
}

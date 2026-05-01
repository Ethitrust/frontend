'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { ethitrustThemeTokens } from '@/lib/ethitrust-theme'
import {
  forgotPasswordPayloadSchema,
  type ForgotPasswordPayload,
} from '@/lib/validators/forgot-password'
import { cn } from '@/lib/utils'

export function ForgotPasswordForm({ className }: { className?: string }) {
  const form = useForm<ForgotPasswordPayload>({
    resolver: zodResolver(forgotPasswordPayloadSchema),
    defaultValues: { email: '' },
  })

  async function onSubmit(values: ForgotPasswordPayload) {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    const data: unknown = await res.json().catch(() => null)

    if (!res.ok) {
      const msg =
        typeof data === 'object' &&
        data !== null &&
        'error' in data &&
        typeof (data as { error?: unknown }).error === 'string'
          ? (data as { error: string }).error
          : 'Something went wrong'
      toast.error(msg)
      return
    }

    const message =
      typeof data === 'object' &&
      data !== null &&
      'message' in data &&
      typeof (data as { message?: unknown }).message === 'string'
        ? (data as { message: string }).message
        : 'Check your inbox.'
    toast.success(message)
    form.reset()
  }

  const e = ethitrustThemeTokens

  return (
    <Card className={cn('w-full max-w-md border-border shadow-sm', className)}>
      <CardHeader className="gap-2">
        <p className={e.typography.eyebrow}>Account access</p>
        <CardTitle className={cn(e.typography.displayLG, 'font-serif font-normal')}>
          Forgot password
        </CardTitle>
        <CardDescription className="text-base leading-relaxed">
          Enter your work email and we&apos;ll send a reset link if an account exists.
        </CardDescription>
      </CardHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="grid gap-4">
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
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>

          <CardFooter className="flex flex-col gap-4 border-t border-border pt-6">
            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              size="lg"
              className="h-11 w-full rounded-full transition-transform hover:scale-[1.02]"
            >
              {form.formState.isSubmitting ? (
                <>
                  <Spinner className="size-4" />
                  Sending link…
                </>
              ) : (
                'Send reset link'
              )}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Remember your password?{' '}
              <Link
                href="/signin"
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}

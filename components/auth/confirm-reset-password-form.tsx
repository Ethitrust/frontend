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
  confirmResetPasswordFormSchema,
  type ConfirmResetPasswordFormValues,
} from '@/lib/validators/confirm-reset-password'
import { cn } from '@/lib/utils'

export function ConfirmResetPasswordForm({
  token,
  className,
}: {
  token: string
  className?: string
}) {
  const form = useForm<ConfirmResetPasswordFormValues>({
    resolver: zodResolver(confirmResetPasswordFormSchema),
    defaultValues: {
      token,
      email: '',
      new_password: '',
      password_confirm: '',
    },
  })

  async function onSubmit(values: ConfirmResetPasswordFormValues) {
    const res = await fetch('/api/auth/confirm-reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: values.token,
        email: values.email,
        new_password: values.new_password,
      }),
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

    toast.success(
      typeof data === 'object' &&
        data !== null &&
        'message' in data &&
        typeof (data as { message?: unknown }).message === 'string'
        ? (data as { message: string }).message
        : 'Password reset successfully.',
    )
    form.reset({ token, email: '', new_password: '', password_confirm: '' })
  }

  const e = ethitrustThemeTokens

  if (!token) {
    return (
      <Card className={cn('w-full max-w-md border-border shadow-sm', className)}>
        <CardHeader className="gap-2">
          <p className={e.typography.eyebrow}>Reset password</p>
          <CardTitle className={cn(e.typography.displayLG, 'font-serif font-normal')}>
            Invalid link
          </CardTitle>
          <CardDescription>
            This page needs a reset token from your email. Request a new link below.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-col gap-2 border-t border-border pt-6">
          <Button asChild className="h-11 w-full rounded-full">
            <Link href="/forgot-password">Request reset link</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/signin">Sign in</Link>
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className={cn('w-full max-w-md border-border shadow-sm', className)}>
      <CardHeader className="gap-2">
        <p className={e.typography.eyebrow}>Account access</p>
        <CardTitle className={cn(e.typography.displayLG, 'font-serif font-normal')}>
          Reset your password
        </CardTitle>
        <CardDescription className="text-base leading-relaxed">
          Enter your email and choose a new password.
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
                      placeholder="you@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="new_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="new-password"
                      placeholder="At least 8 characters"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password_confirm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="new-password"
                      placeholder="Repeat password"
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
                  Updating…
                </>
              ) : (
                'Reset password'
              )}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              <Link href="/signin" className="underline-offset-4 hover:underline">
                Sign in instead
              </Link>
            </p>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}

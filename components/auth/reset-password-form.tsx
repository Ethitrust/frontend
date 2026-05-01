'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
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
  resetPasswordFormSchema,
  type ResetPasswordFormValues,
} from '@/lib/validators/reset-password'
import { cn } from '@/lib/utils'

export function ResetPasswordForm({ className }: { className?: string }) {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')?.trim() ?? ''

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: {
      token: '',
      password: '',
      password_confirm: '',
    },
  })

  useEffect(() => {
    form.setValue('token', token)
  }, [token, form])

  async function onSubmit(values: ResetPasswordFormValues) {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: values.token,
        password: values.password,
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
        : 'Password updated.',
    )
    form.reset({ token: values.token, password: '', password_confirm: '' })
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
          Choose a new password
        </CardTitle>
        <CardDescription className="text-base leading-relaxed">
          Use a strong password you haven&apos;t used elsewhere.
        </CardDescription>
      </CardHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="grid gap-4">
            <FormField
              control={form.control}
              name="password"
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
                'Update password'
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

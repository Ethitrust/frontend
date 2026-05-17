'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'

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
import { useLoginMutation } from '@/lib/api/auth-mutations'
import { fetchAuthMe } from '@/lib/auth/me-session-api'
import { isPlatformAdminRole } from '@/lib/auth/roles'
import { ethitrustThemeTokens } from '@/lib/ethitrust-theme'
import {
  loginPayloadSchema,
  type LoginPayload,
} from '@/lib/validators/login'
import { cn } from '@/lib/utils'

export function LoginForm({ className }: { className?: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const loginMutation = useLoginMutation()

  // Forward `?next=` to the signup link so users keep their post-auth target.
  const nextParamForLink = searchParams.get('next')
  const safeNextForLink =
    nextParamForLink && nextParamForLink.startsWith('/') ? nextParamForLink : null
  const signupHref = safeNextForLink
    ? `/signup?next=${encodeURIComponent(safeNextForLink)}`
    : '/signup'

  const form = useForm<LoginPayload>({
    resolver: zodResolver(loginPayloadSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  function onSubmit(values: LoginPayload) {
    loginMutation.mutate(values, {
      onSuccess: async (data) => {
        form.reset({ ...values, password: '' })

        // Honour the `next` query param for invite / KYC redirect flows.
        // Validate it starts with `/` to prevent open-redirect attacks.
        const nextParam = searchParams.get('next')
        const safeNext = nextParam && nextParam.startsWith('/') ? nextParam : null

        let nextPath = safeNext || '/dashboard'
        try {
          const me = await fetchAuthMe(data.access_token)
          if (isPlatformAdminRole(me.role)) nextPath = '/admin'
        } catch {
          /* stay on dashboard if /me fails */
        }
        router.push(nextPath)
      },
    })
  }

  const e = ethitrustThemeTokens

  return (
    <Card className={cn('w-full max-w-md border-border shadow-sm', className)}>
      <CardHeader className="gap-2">
        <p className={e.typography.eyebrow}>Welcome back</p>
        <CardTitle className={cn(e.typography.displayLG, 'font-serif font-normal')}>
          Sign in to your workspace
        </CardTitle>
        <CardDescription className="text-base leading-relaxed">
          Access your escrow dashboards, links, and team settings.
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
                      disabled={loginMutation.isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between gap-2">
                    <FormLabel>Password</FormLabel>
                    <Link
                      href="/forgot-password"
                      className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="current-password"
                      placeholder="••••••••"
                      disabled={loginMutation.isPending}
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
              disabled={loginMutation.isPending}
              size="lg"
              className="h-11 w-full rounded-full transition-transform hover:scale-[1.02]"
            >
              {loginMutation.isPending ? (
                <>
                  <Spinner className="size-4" />
                  Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Need an account?{' '}
              <Link
                href={signupHref}
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                Create one
              </Link>
            </p>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}

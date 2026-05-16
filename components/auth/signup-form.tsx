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
import { useRegisterMutation } from '@/lib/api/auth-mutations'
import { ethitrustThemeTokens } from '@/lib/ethitrust-theme'
import {
  signupPayloadSchema,
  type SignupPayload,
} from '@/lib/validators/signup'
import { cn } from '@/lib/utils'

export function SignupForm({ className }: { className?: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const registerMutation = useRegisterMutation()

  const form = useForm<SignupPayload>({
    resolver: zodResolver(signupPayloadSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      phone_number: '',
      email: searchParams.get('email') || '',
      password: '',
    },
  })

  function onSubmit(values: SignupPayload) {
    registerMutation.mutate(values, {
      onSuccess: () => {
        form.reset()
        // Forward the `next` param so invite intent survives through email verification.
        const nextParam = searchParams.get('next')
        const safeNext = nextParam && nextParam.startsWith('/') ? nextParam : null
        const verifyUrl = `/verify-email?email=${encodeURIComponent(values.email.trim())}${safeNext ? `&next=${encodeURIComponent(safeNext)}` : ''}`
        router.push(verifyUrl)
      },
    })
  }

  const e = ethitrustThemeTokens

  return (
    <Card className={cn('w-full max-w-md border-border shadow-sm', className)}>
      <CardHeader className="gap-2">
        <p className={e.typography.eyebrow}>Get started</p>
        <CardTitle className={cn(e.typography.displayLG, 'font-serif font-normal')}>
          Create your workspace
        </CardTitle>
        <CardDescription className="text-base leading-relaxed">
          Business escrow accounts for Ethiopian B2B trades — verify once, then issue
          escrow links whenever you need them.
        </CardDescription>
      </CardHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First name</FormLabel>
                    <FormControl>
                      <Input
                        autoComplete="given-name"
                        placeholder="Meron"
                        disabled={registerMutation.isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last name</FormLabel>
                    <FormControl>
                      <Input
                        autoComplete="family-name"
                        placeholder="Tadesse"
                        disabled={registerMutation.isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="phone_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone number</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="+251 9XX XXX XXX"
                      disabled={registerMutation.isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Work email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      autoComplete="email"
                      placeholder="you@company.et"
                      disabled={registerMutation.isPending}
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
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="new-password"
                      placeholder="At least 8 characters"
                      disabled={registerMutation.isPending}
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
              disabled={registerMutation.isPending}
              size="lg"
              className="h-11 w-full rounded-full transition-transform hover:scale-[1.02]"
            >
              {registerMutation.isPending ? (
                <>
                  <Spinner className="size-4" />
                  Creating account…
                </>
              ) : (
                'Create account'
              )}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
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

"use client";

import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Mail, Shield } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useResendVerificationMutation } from "@/lib/api/auth-mutations";
import { fetchAuthMe } from "@/lib/auth/me-session-api";
import { formatEscrowDateTime } from "@/lib/escrows/format-escrow";
import { ethitrustThemeTokens } from "@/lib/ethitrust-theme";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

export function UserSecuritySettingsView() {
  const e = ethitrustThemeTokens;
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);

  const meQuery = useQuery({
    queryKey: ["me", "auth", "me"],
    queryFn: () => fetchAuthMe(accessToken!),
    enabled: Boolean(accessToken),
    staleTime: 60_000,
  });

  const resendMutation = useResendVerificationMutation();

  if (!accessToken) {
    return (
      <div className={cn(e.layout.container, "py-8 lg:py-12")}>
        <header className="max-w-2xl">
          <p className={cn(e.typography.eyebrow, "text-muted-foreground")}>
            Account
          </p>
          <h1
            className={cn(
              e.typography.displayLG,
              "mt-2 font-serif font-normal text-foreground",
            )}
          >
            Security
          </h1>
          <p className={cn(e.typography.bodyMuted, "mt-3")}>
            Sign in to review verification, two-factor status, and links to
            reset your password or confirm your email.
          </p>
        </header>
        <Card className="mt-10 max-w-md shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Sign in required
            </CardTitle>
            <CardDescription>
              Security checks use your authenticated session.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="rounded-full">
              <Link href="/signin">Sign in</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const me = meQuery.data;
  const loading = meQuery.isPending;

  function resendToSessionEmail() {
    if (!me?.email) return;
    resendMutation.mutate(
      { email: me.email },
      {
        onSuccess: () => {
          void queryClient.invalidateQueries({
            queryKey: ["me", "auth", "me"],
          });
        },
      },
    );
  }

  return (
    <div className={cn(e.layout.container, "py-8 lg:py-12")}>
      <header className="max-w-3xl">
        <p className={cn(e.typography.eyebrow, "text-muted-foreground")}>
          Account
        </p>
        <h1
          className={cn(
            e.typography.displayLG,
            "mt-2 font-serif font-normal text-foreground",
          )}
        >
          Security
        </h1>
        <p
          className={cn(
            e.typography.bodyMuted,
            "mt-3 max-w-2xl leading-relaxed",
          )}
        >
          Live sign-in status from your session. Password reset uses the email
          flow; two-factor reflects the backend until dedicated enrollment APIs
          are available in the product.
        </p>
      </header>

      {meQuery.isError ? (
        <Alert variant="destructive" className="mt-8">
          <AlertTitle>Could not load account</AlertTitle>
          <AlertDescription>
            {meQuery.error instanceof Error
              ? meQuery.error.message
              : "Request failed"}
          </AlertDescription>
        </Alert>
      ) : null}

      {loading ? (
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-52 rounded-xl lg:col-span-2" />
          <Skeleton className="h-44 rounded-xl" />
          <Skeleton className="h-44 rounded-xl" />
        </div>
      ) : null}

      {!loading && me ? (
        <>
          {me.banned ? (
            <Alert variant="destructive" className="mt-8">
              <Shield className="size-4 shrink-0" aria-hidden />
              <AlertTitle>Account restricted</AlertTitle>
              <AlertDescription>
                Security actions may be limited. Contact Ethi-Trust support if
                you believe this is a mistake.
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <Card className="shadow-sm lg:col-span-2">
              <CardHeader className="border-b">
                <div className="flex flex-wrap items-center gap-2">
                  <Mail className="size-4 text-muted-foreground" aria-hidden />
                  <CardTitle className="text-lg font-semibold">
                    Email & session
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="grid gap-6 pt-6 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Email
                  </p>
                  <p className="mt-1 font-medium break-all">{me.email}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Verification
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {me.email_verified ? (
                      <Badge variant="secondary" className="font-normal">
                        Verified
                      </Badge>
                    ) : (
                      <>
                        <Badge variant="outline" className="font-normal">
                          Not verified
                        </Badge>
                        <Button
                          asChild
                          variant="link"
                          className="h-auto p-0 text-sm"
                        >
                          <Link
                            href={`/verify-email?email=${encodeURIComponent(me.email)}`}
                          >
                            Enter code
                          </Link>
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Last account update
                  </p>
                  <p className="mt-1 text-sm tabular-nums text-muted-foreground">
                    {formatEscrowDateTime(me.updated_at)}
                  </p>
                </div>
              </CardContent>
              {!me.email_verified ? (
                <CardContent className="border-t pt-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-muted-foreground">
                      We can send another 6-digit code to this address. After
                      you receive it, enter it on the verify page.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-full shrink-0"
                      disabled={resendMutation.isPending}
                      onClick={resendToSessionEmail}
                    >
                      {resendMutation.isPending ? (
                        <>
                          <Spinner className="size-4" aria-hidden />
                          Sending…
                        </>
                      ) : (
                        "Resend verification email"
                      )}
                    </Button>
                  </div>
                </CardContent>
              ) : null}
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="border-b">
                <div className="flex items-center gap-2">
                  <KeyRound
                    className="size-4 text-muted-foreground"
                    aria-hidden
                  />
                  <CardTitle className="text-base font-semibold">
                    Password
                  </CardTitle>
                </div>
                <CardDescription>
                  The public API spec documents email-based reset, not an
                  in-session password change endpoint.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6 text-sm leading-relaxed text-muted-foreground">
                <p>
                  Use “Forgot password” with your account email. You will
                  receive reset instructions if the account exists.
                </p>
                <Button asChild className="rounded-full">
                  <Link href="/forgot-password">Reset password via email</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="border-b">
                <div className="flex items-center gap-2">
                  <Shield
                    className="size-4 text-muted-foreground"
                    aria-hidden
                  />
                  <CardTitle className="text-base font-semibold">
                    Two-factor authentication
                  </CardTitle>
                </div>
                <CardDescription>
                  Status only — enrollment is not wired to a documented user
                  endpoint yet.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm text-muted-foreground">
                    Current state:
                  </p>
                  {me.two_factor_enabled ? (
                    <Badge variant="secondary" className="font-normal">
                      Enabled
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="font-normal">
                      Not enabled
                    </Badge>
                  )}
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  When the backend exposes enable/disable and backup codes, they
                  will appear here. Until then, rely on a strong password and
                  verified email.
                </p>
              </CardContent>
            </Card>
          </div>

          <p className="mt-10 text-sm text-muted-foreground">
            <Button asChild variant="link" className="h-auto p-0 text-sm">
              <Link href="/profile">Back to profile</Link>
            </Button>
          </p>
        </>
      ) : null}
    </div>
  );
}

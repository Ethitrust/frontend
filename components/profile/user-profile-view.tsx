"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { KeyRound, Mail, Shield, User } from "lucide-react";

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
import { fetchAuthMe, fetchAuthProfile } from "@/lib/auth/me-session-api";
import { formatEscrowDateTime } from "@/lib/escrows/format-escrow";
import { presentKycStatus } from "@/lib/kyc/kyc-presentation";
import { ethitrustThemeTokens } from "@/lib/ethitrust-theme";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

export function UserProfileView() {
  const e = ethitrustThemeTokens;
  const accessToken = useAuthStore((s) => s.accessToken);

  const meQuery = useQuery({
    queryKey: ["me", "auth", "me"],
    queryFn: () => fetchAuthMe(accessToken!),
    enabled: Boolean(accessToken),
    staleTime: 60_000,
  });

  const profileQuery = useQuery({
    queryKey: ["me", "auth", "profile"],
    queryFn: () => fetchAuthProfile(accessToken!),
    enabled: Boolean(accessToken),
    staleTime: 60_000,
  });

  const loading = Boolean(
    accessToken && (meQuery.isPending || profileQuery.isPending),
  );
  const me = meQuery.data;
  const profile = profileQuery.data;
  const kyc = profile ? presentKycStatus(profile.kyc_status) : null;

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
            Profile
          </h1>
          <p className={cn(e.typography.bodyMuted, "mt-3")}>
            Sign in to see your account details, verification state, and quick
            links to security and KYC.
          </p>
        </header>
        <Card className="mt-10 max-w-md shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Sign in required
            </CardTitle>
            <CardDescription>
              Your profile is loaded from the authenticated session.
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
          Profile
        </h1>
        <p
          className={cn(
            e.typography.bodyMuted,
            "mt-3 max-w-2xl leading-relaxed",
          )}
        >
          use KYC and security pages for the next steps.
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

      {profileQuery.isError ? (
        <Alert variant="destructive" className="mt-8">
          <AlertTitle>Could not load profile</AlertTitle>
          <AlertDescription>
            {profileQuery.error instanceof Error
              ? profileQuery.error.message
              : "Request failed"}
          </AlertDescription>
        </Alert>
      ) : null}

      {me?.banned ? (
        <Alert variant="destructive" className="mt-8">
          <Shield className="size-4 shrink-0" aria-hidden />
          <AlertTitle>Account restricted</AlertTitle>
          <AlertDescription>
            This account has restrictions. Contact Ethi-Trust support if you
            need access restored.
          </AlertDescription>
        </Alert>
      ) : null}

      {me && !me.email_verified ? (
        <Alert className="mt-8 border-amber-200 bg-amber-50/80 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
          <Mail className="size-4 shrink-0" aria-hidden />
          <AlertTitle>Email not verified</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-3">
            <span>
              Confirm your email to avoid limits on sensitive actions.
            </span>
            <Button
              size="sm"
              variant="outline"
              className="rounded-full border-amber-800/40"
              asChild
            >
              <Link href="/signin">Return to sign in</Link>
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      {loading ? (
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-56 rounded-xl lg:col-span-2" />
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      ) : null}

      {!loading && me && profile && kyc ? (
        <>
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <Card className="shadow-sm lg:col-span-2">
              <CardHeader className="border-b">
                <div className="flex items-center gap-2">
                  <User className="size-4 text-muted-foreground" aria-hidden />
                  <CardTitle className="text-lg font-semibold">
                    Account
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="grid gap-6 pt-6 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Display name
                  </p>
                  <p className="mt-1 font-medium text-foreground">
                    {me.name || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Email
                  </p>
                  <p className="mt-1 font-medium break-all">{me.email}</p>
                  <div className="mt-2">
                    {me.email_verified ? (
                      <Badge variant="secondary" className="font-normal">
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="font-normal">
                        Unverified
                      </Badge>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Role
                  </p>
                  <p className="mt-1 font-medium capitalize text-foreground">
                    {me.role || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Two-factor
                  </p>
                  <p className="mt-1 font-medium text-foreground">
                    {me.two_factor_enabled ? "Enabled" : "Not enabled"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    User ID
                  </p>
                  <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                    {me.id}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Member since
                  </p>
                  <p className="mt-1 text-sm tabular-nums text-muted-foreground">
                    {formatEscrowDateTime(me.created_at)}
                  </p>
                </div>
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
                    Verification profile
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-5 pt-6">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Legal name
                  </p>
                  <p className="mt-1 font-medium text-foreground">
                    {[profile.first_name, profile.last_name]
                      .filter(Boolean)
                      .join(" ") ||
                      me.name ||
                      "Not provided"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Phone
                  </p>
                  <p className="mt-1 font-medium tabular-nums">
                    {profile.phone_number?.trim() || "Not provided"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    KYC status
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge
                      variant={kyc.variant}
                      className="font-normal capitalize"
                    >
                      {kyc.label}
                    </Badge>
                    <Button
                      asChild
                      variant="link"
                      className="h-auto p-0 text-sm"
                    >
                      <Link href="/kyc">View details</Link>
                    </Button>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {kyc.description}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Profile record ID
                  </p>
                  <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                    {profile.id}
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Created
                    </p>
                    <p className="mt-1 text-sm tabular-nums text-muted-foreground">
                      {formatEscrowDateTime(profile.created_at)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Updated
                    </p>
                    <p className="mt-1 text-sm tabular-nums text-muted-foreground">
                      {formatEscrowDateTime(profile.updated_at)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="border-b">
                <div className="flex items-center gap-2">
                  <KeyRound
                    className="size-4 text-muted-foreground"
                    aria-hidden
                  />
                  <CardTitle className="text-base font-semibold">
                    Next steps
                  </CardTitle>
                </div>
                <CardDescription>
                  Common actions from this workspace.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-6 text-sm text-muted-foreground">
                <p>
                  Update password, sessions, and two-factor under security.
                  Complete or review identity checks under verification.
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button asChild variant="secondary" className="rounded-full">
                    <Link href="/settings/security">Open security</Link>
                  </Button>
                  <Button asChild variant="secondary" className="rounded-full">
                    <Link href="/kyc">Open verification</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}

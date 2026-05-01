"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { IdCard, Mail, ScanFace, ShieldCheck } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { KycSessionGate } from "@/components/kyc/kyc-session-gate";
import { fetchAuthMe, fetchAuthProfile } from "@/lib/auth/me-session-api";
import { formatEscrowDateTime } from "@/lib/escrows/format-escrow";
import { presentKycStatus } from "@/lib/kyc/kyc-presentation";
import { ethitrustThemeTokens } from "@/lib/ethitrust-theme";
import { cn } from "@/lib/utils";

export function KycOverviewView() {
  return (
    <KycSessionGate
      title="Identity verification"
      description="See how Ethi-Trust interprets your account today, finish email confirmation if needed, and choose Fayda or manual identity checks."
    >
      {(accessToken) => <KycOverviewSignedIn accessToken={accessToken} />}
    </KycSessionGate>
  );
}

function KycOverviewSignedIn({ accessToken }: { accessToken: string }) {
  const e = ethitrustThemeTokens;

  const meQuery = useQuery({
    queryKey: ["me", "auth", "me"],
    queryFn: () => fetchAuthMe(accessToken),
  });

  const profileQuery = useQuery({
    queryKey: ["me", "auth", "profile"],
    queryFn: () => fetchAuthProfile(accessToken),
  });

  const loading = meQuery.isPending || profileQuery.isPending;
  const me = meQuery.data;
  const profile = profileQuery.data;
  const kyc = profile ? presentKycStatus(profile.kyc_status) : null;

  return (
    <div className={cn(e.layout.container, "py-8 lg:py-12")}>
      <header className="max-w-3xl">
        <p className={cn(e.typography.eyebrow, "text-muted-foreground")}>
          Compliance
        </p>
        <h1
          className={cn(
            e.typography.displayLG,
            "mt-2 font-serif font-normal text-foreground",
          )}
        >
          Identity verification
        </h1>
        <p
          className={cn(
            e.typography.bodyMuted,
            "mt-3 max-w-2xl leading-relaxed",
          )}
        >
          See the latest verification status from your Ethi-Trust profile,
          finish email confirmation if needed, and open Fayda or manual flows
          when you are ready.
        </p>
      </header>

      {meQuery.isError ? (
        <Alert variant="destructive" className="mt-8">
          <AlertTitle>Could not load account session</AlertTitle>
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
          <ShieldCheck className="size-4 shrink-0" aria-hidden />
          <AlertTitle>Account restricted</AlertTitle>
          <AlertDescription>
            Compliance actions cannot continue while restrictions are applied.
            Reach out to Ethi-Trust support for help.
          </AlertDescription>
        </Alert>
      ) : null}

      {loading ? (
        <div className="mt-10 space-y-4">
          <Skeleton className="h-40 max-w-xl rounded-xl" />
          <Skeleton className="h-36 max-w-xl rounded-xl" />
        </div>
      ) : null}

      {!loading && me && profile && kyc ? (
        <>
          {me.email_verified ? null : (
            <Alert className="mt-8 border-amber-200 bg-amber-50/80 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
              <Mail className="size-4 shrink-0" aria-hidden />
              <AlertTitle>Confirm your email</AlertTitle>
              <AlertDescription className="flex flex-wrap items-center gap-3">
                <span>
                  Finish email verification before you rely on escrow or wallet
                  limits.
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
          )}

          <div className="mt-10 grid gap-6 lg:grid-cols-2 lg:gap-10">
            <Card className="shadow-sm lg:col-span-2">
              <CardHeader className="border-b">
                <CardTitle className="flex flex-wrap items-center gap-3 text-lg font-semibold">
                  Current verification status
                  <Badge
                    variant={kyc.variant}
                    className="font-normal capitalize"
                  >
                    {kyc.label}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  {kyc.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 pt-6 sm:grid-cols-2 lg:grid-cols-4">
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
                    Phone on file
                  </p>
                  <p className="mt-1 font-medium tabular-nums">
                    {profile.phone_number?.trim() || "Not provided"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Support reference
                  </p>
                  <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                    {profile.id}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Last updated
                  </p>
                  <p className="mt-1 text-sm tabular-nums text-muted-foreground">
                    {formatEscrowDateTime(profile.updated_at)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ScanFace
                    className="size-4 text-muted-foreground"
                    aria-hidden
                  />
                  <CardTitle className="text-base font-semibold">
                    National ID · Fayda
                  </CardTitle>
                </div>
                <CardDescription>
                  Complete one-time codes against Ethiopia’s Fayda-linked
                  directory when operational teams enable this path.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm leading-relaxed text-muted-foreground">
                Use Fayda before manual uploads whenever your organization
                mandates digital checks.
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline" className="rounded-full">
                  <Link href="/kyc/fayda">Continue with Fayda</Link>
                </Button>
              </CardFooter>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <IdCard
                    className="size-4 text-muted-foreground"
                    aria-hidden
                  />
                  <CardTitle className="text-base font-semibold">
                    Manual document review
                  </CardTitle>
                </div>
                <CardDescription>
                  Upload government ID portraits when electronic verification
                  cannot reach your record.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm leading-relaxed text-muted-foreground">
                Operators review JPG, PNG, or WEBP uploads when this channel
                replaces automatic checks.
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline" className="rounded-full">
                  <Link href="/kyc/manual">Upload documents manually</Link>
                </Button>
              </CardFooter>
            </Card>

            <Card className="border-dashed bg-muted/40 shadow-none lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base font-semibold">
                  Reminder
                </CardTitle>
                <CardDescription>
                  Invitation flows may apply their own checks—keep the name and
                  phone on this screen aligned with what you use when joining an
                  escrow.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { IdCard, Mail, ShieldCheck, Fingerprint, Info } from "lucide-react";

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
      description="See your current verification status, finish email confirmation if needed, and submit manual identity documents for review."
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
          finish email confirmation if needed, and submit manual documents when
          review is required.
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

          <div className="mt-10 flex flex-col gap-8">
            <Card className="relative overflow-hidden border bg-gradient-to-br from-card to-muted/20 shadow-sm transition-all hover:shadow-md">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent opacity-50 pointer-events-none" />
              <CardHeader className="relative border-b bg-muted/10 pb-6 pt-8">
                <CardTitle className="flex flex-wrap items-center gap-3 text-xl font-semibold tracking-tight">
                  Current verification status
                  <Badge
                    variant={kyc.variant}
                    className="px-3 py-1 text-xs font-medium uppercase tracking-wider"
                  >
                    {kyc.label}
                  </Badge>
                </CardTitle>
                <CardDescription className="mt-2 text-base leading-relaxed text-muted-foreground">
                  {kyc.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="relative grid gap-8 pt-8 sm:grid-cols-2 lg:grid-cols-4">
                <div className="group">
                  <p className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground transition-colors group-hover:text-primary">
                    <IdCard className="size-3.5" />
                    Legal name
                  </p>
                  <p className="mt-2 text-lg font-medium tracking-tight text-foreground">
                    {[profile.first_name, profile.last_name]
                      .filter(Boolean)
                      .join(" ") ||
                      me.name ||
                      "Not provided"}
                  </p>
                </div>
                <div className="group">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground transition-colors group-hover:text-primary">
                    Phone on file
                  </p>
                  <p className="mt-2 text-lg font-medium tabular-nums tracking-tight">
                    {profile.phone_number?.trim() || "Not provided"}
                  </p>
                </div>
                <div className="group">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground transition-colors group-hover:text-primary">
                    Support reference
                  </p>
                  <p className="mt-2 break-all font-mono text-sm text-muted-foreground">
                    {profile.id}
                  </p>
                </div>
                <div className="group">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground transition-colors group-hover:text-primary">
                    Last updated
                  </p>
                  <p className="mt-2 text-sm tabular-nums text-muted-foreground">
                    {formatEscrowDateTime(profile.updated_at)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              <Card className="flex flex-col shadow-sm transition-all hover:shadow-md">
                <CardHeader>
                  <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-primary/10">
                    <IdCard className="size-6 text-primary" aria-hidden />
                  </div>
                  <CardTitle className="text-lg font-semibold tracking-tight">
                    Manual document review
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Upload government ID photos and track review status directly.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 text-sm leading-relaxed text-muted-foreground">
                  The front of your ID is required. Back-side photos and a selfie
                  are optional but can help our compliance team verify your documents faster.
                </CardContent>
                <CardFooter className="pt-4">
                  <Button asChild className="w-full rounded-full sm:w-auto" variant="default">
                    <Link href="/kyc/manual">Open manual review</Link>
                  </Button>
                </CardFooter>
              </Card>

              <Card className="relative flex flex-col overflow-hidden shadow-sm transition-all hover:shadow-md">
                <div className="absolute right-0 top-0 translate-x-[30%] translate-y-[-20%] opacity-[0.03] pointer-events-none">
                  <Fingerprint className="size-64" />
                </div>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-emerald-500/10">
                      <Fingerprint className="size-6 text-emerald-600 dark:text-emerald-400" aria-hidden />
                    </div>
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-900/50 dark:text-emerald-300">
                      Coming Soon
                    </Badge>
                  </div>
                  <CardTitle className="text-lg font-semibold tracking-tight">
                    Fayda Integration
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Instant verification with Ethiopia's National ID system.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 text-sm leading-relaxed text-muted-foreground">
                  We are working closely with national authorities to bring 1-click Fayda integration. 
                  Soon, you will be able to verify your identity instantly using your Fayda digital ID, skipping manual document uploads.
                </CardContent>
                <CardFooter className="pt-4">
                  <Button disabled variant="outline" className="w-full rounded-full sm:w-auto bg-muted/50 cursor-not-allowed">
                    Integration pending
                  </Button>
                </CardFooter>
              </Card>
            </div>

            <Alert className="border-primary/20 bg-primary/5 text-foreground mt-2">
              <Info className="size-5 text-primary" aria-hidden />
              <AlertTitle className="font-medium text-primary">Verification reminder</AlertTitle>
              <AlertDescription className="text-sm leading-relaxed mt-1">
                Invitation flows may apply their own identity checks. Keep the legal name and phone number on this screen aligned with the details you use when participating in escrows.
              </AlertDescription>
            </Alert>
          </div>
        </>
      ) : null}
    </div>
  );
}

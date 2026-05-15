"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Loader2Icon, Briefcase, FileText, CheckCircle2, Building, Hash } from "lucide-react";
import { toast } from "sonner";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ethitrustThemeTokens } from "@/lib/ethitrust-theme";
import {
  fetchMeOrganizations,
  postBusinessLicenseUploadUrl,
  postOrganizationApply,
} from "@/lib/organizations/me-organizations-api";
import { organizationApplySchema } from "@/lib/validators/org-apply";
import { cn } from "@/lib/utils";

export function OrganizationApplyView({
  accessToken,
}: {
  accessToken: string;
}) {
  const e = ethitrustThemeTokens;
  const queryClient = useQueryClient();
  const orgsQuery = useQuery({
    queryKey: ["me", "organizations"],
    queryFn: () => fetchMeOrganizations(accessToken),
    staleTime: 30_000,
  });

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [tin, setTin] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [commercialRegistrationFile, setCommercialRegistrationFile] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState<{
    orgId: string;
    orgName: string;
    appStatus: string;
  } | null>(null);

  const applyMutation = useMutation({
    mutationFn: async () => {
      const parsed = organizationApplySchema.safeParse({ name, slug, tin, email, phone, address });
      if (!parsed.success) {
        throw new Error(
          parsed.error.issues[0]?.message ?? "Check the form fields.",
        );
      }
      if (!licenseFile)
        throw new Error("Choose a business license file to upload.");
      if (!commercialRegistrationFile)
        throw new Error("Choose a certificate of commercial registration file to upload.");

      const licenseFd = new FormData();
      licenseFd.append("file", licenseFile);
      
      const commRegFd = new FormData();
      commRegFd.append("file", commercialRegistrationFile);

      const [uploadedLicense, uploadedCommReg] = await Promise.all([
        postBusinessLicenseUploadUrl(accessToken, licenseFd),
        postBusinessLicenseUploadUrl(accessToken, commRegFd)
      ]);

      return postOrganizationApply(accessToken, {
        name: parsed.data.name,
        slug: parsed.data.slug,
        tin: parsed.data.tin,
        email: parsed.data.email,
        phone_number: parsed.data.phone,
        address: parsed.data.address,
        business_license_file_id: uploadedLicense.file_id,
        commercial_registration_file_id: uploadedCommReg.file_id,
      });
    },
    onSuccess: (data) => {
      toast.success("Application submitted");
      setSubmitted({
        orgId: data.organization.id,
        orgName: data.organization.name,
        appStatus: data.application.status,
      });
      setLicenseFile(null);
      setCommercialRegistrationFile(null);
      void queryClient.invalidateQueries({ queryKey: ["me", "organizations"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function deriveSlugFromName() {
    const base = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 80);
    if (base.length >= 2) setSlug(base);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    applyMutation.mutate();
  }

  return (
    <div className={cn(e.layout.container, "py-8 lg:py-12")}>
      <header className="max-w-2xl">
        <p className={cn(e.typography.eyebrow, "text-muted-foreground")}>
          Organization
        </p>
        <h1
          className={cn(
            e.typography.displayLG,
            "mt-2 font-serif font-normal text-foreground",
          )}
        >
          Apply as a business
        </h1>
        <p className={cn(e.typography.bodyMuted, "mt-3")}>
          Create an organization workspace, attach your licence for KYB review,
          and keep team actions under one slug. Approved orgs unlock the
          Organization dashboard and escrow tools.
        </p>
      </header>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr),minmax(280px,22rem)] lg:items-start lg:gap-12 xl:gap-16">
        <div className="min-w-0">
          {submitted ? (
            <Card className="w-full overflow-hidden border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/20">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="flex size-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50">
                    <CheckCircle2 className="size-8 text-emerald-600 dark:text-emerald-400" aria-hidden />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold tracking-tight text-emerald-950 dark:text-emerald-50">
                      Application Received
                    </h3>
                    <p className="text-sm text-emerald-800 dark:text-emerald-200/80 max-w-md mx-auto">
                      We created <span className="font-medium">“{submitted.orgName}”</span> with application status{" "}
                      <span className="font-medium capitalize underline decoration-emerald-500/30 underline-offset-2">
                        {submitted.appStatus}
                      </span>
                      .
                    </p>
                    <p className="text-sm text-emerald-800 dark:text-emerald-200/80 max-w-md mx-auto">
                      You can monitor the workspace for updates while our compliance team reviews your business licence.
                    </p>
                  </div>
                  <Button
                    asChild
                    className="mt-2 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600"
                  >
                    <Link
                      href={`/org/${encodeURIComponent(submitted.orgId)}/dashboard`}
                    >
                      Go to organization workspace
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="relative w-full overflow-hidden border bg-card shadow-sm transition-all hover:shadow-md">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50 pointer-events-none" />
              <CardHeader className="relative border-b bg-muted/20 pb-6 pt-6">
                <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-primary/10">
                  <Briefcase className="size-6 text-primary" aria-hidden />
                </div>
                <CardTitle className="text-xl font-semibold tracking-tight">
                  Organization application
                </CardTitle>
                <CardDescription className="mt-1.5 text-sm leading-relaxed">
                  Provide your business details and upload your business licence. 
                  Once approved, your organization unlocks dedicated escrow and workspace features.
                </CardDescription>
              </CardHeader>
              <CardContent className="relative pt-6">
                <form className="grid gap-6 sm:grid-cols-2" onSubmit={onSubmit}>
                  <div className="space-y-2.5 sm:col-span-2">
                    <Label htmlFor="org-name" className="flex items-center gap-1.5 text-sm font-medium">
                      <Building className="size-4 text-muted-foreground" /> Legal or trading name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="org-name"
                      value={name}
                      onChange={(ev) => setName(ev.target.value)}
                      placeholder="Ethi-Trust Trading PLC"
                      maxLength={200}
                      autoComplete="organization"
                      className="transition-colors focus-visible:ring-primary/30"
                    />
                  </div>
                  <div className="space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Label htmlFor="org-slug" className="flex items-center gap-1.5 text-sm font-medium">
                        Workspace slug <span className="text-destructive">*</span>
                      </Label>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="h-7 text-xs rounded-full bg-muted/50 hover:bg-muted"
                        onClick={deriveSlugFromName}
                      >
                        Generate from name
                      </Button>
                    </div>
                    <div className="flex items-center rounded-md border border-input bg-transparent shadow-sm transition-colors focus-within:ring-1 focus-within:ring-primary/30 focus-within:border-primary/50">
                      <span className="flex items-center px-3 text-muted-foreground text-sm border-r border-input bg-muted/30 select-none py-2">
                        ethi.trust/
                      </span>
                      <input
                        id="org-slug"
                        value={slug}
                        onChange={(ev) => setSlug(ev.target.value.toLowerCase())}
                        placeholder="trading"
                        maxLength={80}
                        className="flex w-full rounded-r-md bg-transparent px-3 py-2 text-sm shadow-none font-mono focus-visible:outline-none placeholder:text-muted-foreground"
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground/80 leading-relaxed">
                      Lowercase letters, numbers, and single hyphens only.
                      Appears in org URLs once approved.
                    </p>
                  </div>
                  <div className="space-y-2.5">
                    <Label htmlFor="org-tin" className="flex items-center gap-1.5 text-sm font-medium">
                      <Hash className="size-4 text-muted-foreground" /> TIN <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="org-tin"
                      value={tin}
                      onChange={(ev) => setTin(ev.target.value)}
                      maxLength={64}
                      placeholder="Enter your Tax Identification Number"
                      className="transition-colors focus-visible:ring-primary/30"
                    />
                  </div>
                  <div className="space-y-2.5">
                    <Label htmlFor="org-email" className="flex items-center gap-1.5 text-sm font-medium">
                      Contact Email <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="org-email"
                      type="email"
                      value={email}
                      onChange={(ev) => setEmail(ev.target.value)}
                      placeholder="contact@acme.com"
                      className="transition-colors focus-visible:ring-primary/30"
                    />
                  </div>
                  <div className="space-y-2.5">
                    <Label htmlFor="org-phone" className="flex items-center gap-1.5 text-sm font-medium">
                      Phone Number <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="org-phone"
                      value={phone}
                      onChange={(ev) => setPhone(ev.target.value)}
                      placeholder="+251 9..."
                      className="transition-colors focus-visible:ring-primary/30"
                    />
                  </div>
                  <div className="space-y-2.5 sm:col-span-2">
                    <Label htmlFor="org-address" className="flex items-center gap-1.5 text-sm font-medium">
                      Business Address <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="org-address"
                      value={address}
                      onChange={(ev) => setAddress(ev.target.value)}
                      placeholder="Addis Ababa, Ethiopia"
                      className="transition-colors focus-visible:ring-primary/30"
                    />
                  </div>
                  <div className="space-y-2.5 sm:col-span-2">
                    <Label htmlFor="org-license" className="flex items-center gap-1.5 text-sm font-medium">
                      <FileText className="size-4 text-muted-foreground" /> Business licence
                    </Label>
                    <p className="text-[11px] text-muted-foreground/80 leading-relaxed -mt-1 mb-2">
                      Business licence from The Ministry of Trade and Industry.
                    </p>
                    <div className="rounded-lg border border-dashed border-border/60 bg-muted/10 p-2 transition-colors hover:bg-muted/30 hover:border-primary/30">
                      <Input
                        id="org-license"
                        type="file"
                        accept=".pdf,image/*"
                        className="file:mr-4 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-1.5 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/20 text-muted-foreground text-sm cursor-pointer border-0 bg-transparent shadow-none px-0 py-0 h-auto"
                        onChange={(ev) =>
                          setLicenseFile(ev.target.files?.[0] ?? null)
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2.5 sm:col-span-2">
                    <Label htmlFor="org-comm-reg" className="flex items-center gap-1.5 text-sm font-medium">
                      <FileText className="size-4 text-muted-foreground" /> Certificate of Commercial Registration
                    </Label>
                    <p className="text-[11px] text-muted-foreground/80 leading-relaxed -mt-1 mb-2">
                      Proves the business is legally recognized.
                    </p>
                    <div className="rounded-lg border border-dashed border-border/60 bg-muted/10 p-2 transition-colors hover:bg-muted/30 hover:border-primary/30">
                      <Input
                        id="org-comm-reg"
                        type="file"
                        accept=".pdf,image/*"
                        className="file:mr-4 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-1.5 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/20 text-muted-foreground text-sm cursor-pointer border-0 bg-transparent shadow-none px-0 py-0 h-auto"
                        onChange={(ev) =>
                          setCommercialRegistrationFile(ev.target.files?.[0] ?? null)
                        }
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-2 pt-2">
                    <Button
                      type="submit"
                      className="w-full sm:w-auto rounded-full"
                      disabled={applyMutation.isPending}
                    >
                      {applyMutation.isPending ? (
                        <>
                          <Loader2Icon
                            className="size-4 animate-spin mr-2"
                            aria-hidden
                          />
                          Submitting…
                        </>
                      ) : (
                        "Submit application"
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>

        <aside
          className="min-w-0 lg:sticky lg:top-[5.25rem]"
          aria-labelledby="orgs-you-belong-heading"
        >
          <Card className="shadow-sm">
            <CardHeader className="border-b pb-4">
              <CardTitle
                id="orgs-you-belong-heading"
                className="flex items-center gap-2 text-base font-semibold"
              >
                <Building2
                  className="size-4 text-muted-foreground"
                  aria-hidden
                />
                Your organizations
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {orgsQuery.isPending ? (
                <div className="space-y-3">
                  <Skeleton className="h-14 w-full rounded-lg" />
                  <Skeleton className="h-14 w-full rounded-lg" />
                  <Skeleton className="h-14 w-full rounded-lg" />
                </div>
              ) : orgsQuery.isError ? (
                <div className="space-y-3">
                  <Alert variant="destructive">
                    <AlertTitle className="text-sm">
                      Could not load organizations
                    </AlertTitle>
                    <AlertDescription className="text-xs">
                      {orgsQuery.error instanceof Error
                        ? orgsQuery.error.message
                        : "Request failed."}
                    </AlertDescription>
                  </Alert>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={() => void orgsQuery.refetch()}
                  >
                    Retry
                  </Button>
                </div>
              ) : !orgsQuery.data?.length ? (
                <div className="flex flex-col items-center justify-center space-y-3 py-6 text-center">
                  <div className="flex size-12 items-center justify-center rounded-full bg-muted/50">
                    <Building2 className="size-5 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground px-4">
                    You are not linked to any organization yet. After you submit
                    an application—or accept an invite—new workspaces will appear here.
                  </p>
                </div>
              ) : (
                <ul className="flex flex-col gap-2">
                  {orgsQuery.data.map((org) => (
                    <li key={org.id}>
                      <Link
                        href={`/org/${encodeURIComponent(org.id)}/dashboard`}
                        className="flex flex-col gap-1 rounded-lg border border-border/80 bg-muted/25 px-3 py-2.5 text-sm transition-colors hover:bg-muted/50"
                      >
                        <span className="truncate font-medium text-foreground">
                          {org.name}
                        </span>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                          <span className="font-mono">{org.slug}</span>
                          {org.status ? (
                            <Badge
                              variant="secondary"
                              className="text-[10px] font-normal capitalize"
                            >
                              {org.status}
                            </Badge>
                          ) : null}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

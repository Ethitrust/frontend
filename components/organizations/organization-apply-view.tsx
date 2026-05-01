"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Loader2Icon } from "lucide-react";
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
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState<{
    orgId: string;
    orgName: string;
    appStatus: string;
  } | null>(null);

  const applyMutation = useMutation({
    mutationFn: async () => {
      const parsed = organizationApplySchema.safeParse({ name, slug, tin });
      if (!parsed.success) {
        throw new Error(
          parsed.error.issues[0]?.message ?? "Check the form fields.",
        );
      }
      if (!licenseFile)
        throw new Error("Choose a business license file to upload.");

      const fd = new FormData();
      fd.append("file", licenseFile);
      const uploaded = await postBusinessLicenseUploadUrl(accessToken, fd);
      return postOrganizationApply(accessToken, {
        ...parsed.data,
        business_license_file_id: uploaded.file_id,
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
            <Alert className="border-emerald-200 bg-emerald-50/70 dark:bg-emerald-950/30 dark:border-emerald-900">
              <AlertTitle className="text-emerald-900 dark:text-emerald-100">
                Application received
              </AlertTitle>
              <AlertDescription className="space-y-2 text-emerald-900/90 dark:text-emerald-100/90">
                <p>
                  We created “{submitted.orgName}” with application status{" "}
                  <span className="font-medium capitalize">
                    {submitted.appStatus}
                  </span>
                  .
                </p>
                <p>
                  You can monitor the workspace for updates after compliance
                  reviews your licence.
                </p>
                <Button
                  asChild
                  className="mt-2 rounded-full"
                  variant="outline"
                  size="sm"
                >
                  <Link
                    href={`/org/${encodeURIComponent(submitted.orgId)}/dashboard`}
                  >
                    Go to organization workspace
                  </Link>
                </Button>
              </AlertDescription>
            </Alert>
          ) : (
            <Card className="max-w-xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold">
                  Organization application
                </CardTitle>
                <CardDescription>
                  Upload your business licence PDF or image — the server
                  allocates storage and links the{" "}
                  <code className="text-xs">file_id</code> to your application
                  (see apidoc).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-6" onSubmit={onSubmit}>
                  <div className="space-y-2">
                    <Label htmlFor="org-name">Legal or trading name</Label>
                    <Input
                      id="org-name"
                      value={name}
                      onChange={(ev) => setName(ev.target.value)}
                      placeholder="Ethi-Trust Trading PLC"
                      maxLength={200}
                      autoComplete="organization"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-end justify-between gap-2">
                      <Label htmlFor="org-slug">Workspace slug</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-auto px-2 py-1 text-xs text-muted-foreground"
                        onClick={deriveSlugFromName}
                      >
                        Generate from name
                      </Button>
                    </div>
                    <Input
                      id="org-slug"
                      value={slug}
                      onChange={(ev) => setSlug(ev.target.value.toLowerCase())}
                      placeholder="ethitrust-trading"
                      maxLength={80}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Lowercase letters, numbers, and single hyphens only.
                      Appears in org URLs once approved.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="org-tin">TIN</Label>
                    <Input
                      id="org-tin"
                      value={tin}
                      onChange={(ev) => setTin(ev.target.value)}
                      maxLength={64}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="org-license">Business licence file</Label>
                    <Input
                      id="org-license"
                      type="file"
                      accept=".pdf,image/*"
                      onChange={(ev) =>
                        setLicenseFile(ev.target.files?.[0] ?? null)
                      }
                    />
                  </div>
                  <Button
                    type="submit"
                    className="rounded-full"
                    disabled={applyMutation.isPending}
                  >
                    {applyMutation.isPending ? (
                      <>
                        <Loader2Icon
                          className="size-4 animate-spin"
                          aria-hidden
                        />
                        Submitting…
                      </>
                    ) : (
                      "Submit application"
                    )}
                  </Button>
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
                <p className="text-sm text-muted-foreground">
                  You are not linked to any organization yet. After you submit
                  an application—or accept an invite—new workspaces will show up
                  here with a quick link into the org dashboard.
                </p>
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

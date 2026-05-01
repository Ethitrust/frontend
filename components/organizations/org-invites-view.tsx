'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Building2, Loader2Icon } from 'lucide-react'
import { toast } from 'sonner'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { formatEscrowDateTime } from '@/lib/escrows/format-escrow'
import {
  fetchMeOrganizations,
  postOrgInviteDecision,
} from '@/lib/organizations/me-organizations-api'
import { ethitrustThemeTokens } from '@/lib/ethitrust-theme'
import { orgInviteDecisionSchema } from '@/lib/validators/org-invite-decision'
import { cn } from '@/lib/utils'

export function OrgInvitesLoading() {
  const e = ethitrustThemeTokens
  return (
    <div className={cn(e.layout.container, 'space-y-8 py-8 lg:py-12')}>
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-32 w-full max-w-xl" />
      <Skeleton className="h-52 w-full max-w-2xl" />
    </div>
  )
}

export function OrgInvitesView({ accessToken }: { accessToken: string }) {
  const router = useRouter()
  const qc = useQueryClient()
  const sp = useSearchParams()
  const e = ethitrustThemeTokens

  const fromQueryOrg = useMemo(() => {
    return (
      sp.get('organization_id')?.trim() ||
      sp.get('org_id')?.trim() ||
      sp.get('org')?.trim() ||
      ''
    )
  }, [sp])

  const fromQueryToken = useMemo(() => {
    return sp.get('invitation_token')?.trim() || sp.get('token')?.trim() || ''
  }, [sp])

  const [orgField, setOrgField] = useState(fromQueryOrg)
  const [tokenField, setTokenField] = useState(fromQueryToken)

  useEffect(() => {
    setOrgField(fromQueryOrg)
    setTokenField(fromQueryToken)
  }, [fromQueryOrg, fromQueryToken])

  const orgsQuery = useQuery({
    queryKey: ['me', 'organizations'],
    queryFn: () => fetchMeOrganizations(accessToken),
    enabled: Boolean(accessToken),
  })

  const decisionMutation = useMutation({
    mutationFn: ({ decision }: { decision: 'accept' | 'reject' }) => {
      const parsed = orgInviteDecisionSchema.safeParse({
        org_id: orgField.trim(),
        invitation_token: tokenField.trim(),
      })
      if (!parsed.success)
        throw new Error(parsed.error.issues[0]?.message ?? 'Organization ID and token must be valid UUIDs.')

      return postOrgInviteDecision(accessToken, parsed.data.org_id, {
        invitation_token: parsed.data.invitation_token,
        decision,
      })
    },
    onSuccess: async (org, vars) => {
      await qc.invalidateQueries({ queryKey: ['me', 'organizations'] })
      if (vars.decision === 'accept') {
        toast.success(`Joined ${org.name}`)
        router.push(`/org/${encodeURIComponent(org.id)}/dashboard`)
        return
      }
      toast.message('Invitation declined')
      setTokenField('')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <div className={cn(e.layout.container, 'py-8 lg:py-12')}>
      <header className="max-w-2xl">
        <p className={cn(e.typography.eyebrow, 'text-muted-foreground')}>Organization</p>
        <h1 className={cn(e.typography.displayLG, 'mt-2 font-serif font-normal text-foreground')}>
          Team invites
        </h1>
        <p className={cn(e.typography.bodyMuted, 'mt-3')}>
          Accept or decline invitations to join another company&apos;s workspace. Email links typically include{' '}
          <code className="text-xs">org_id</code> (or <code className="text-xs">organization_id</code>) and an{' '}
          <code className="text-xs">invitation_token</code>; we merge those into your decision call to{' '}
          <code className="text-xs">invite-member/decision</code>.
        </p>
      </header>

      {orgsQuery.isError ? (
        <Alert variant="destructive" className="mt-8">
          <AlertTitle>Could not load your organizations</AlertTitle>
          <AlertDescription>
            {orgsQuery.error instanceof Error ? orgsQuery.error.message : 'Request failed'}
          </AlertDescription>
        </Alert>
      ) : null}

      <Card className="mt-10 max-w-xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Respond to invite</CardTitle>
          <CardDescription>
            Paste identifiers from your invite email or open this page from an invite link — query parameters
            preload the inputs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="invite-org">Organization ID</Label>
              <Input
                id="invite-org"
                value={orgField}
                onChange={(ev) => setOrgField(ev.target.value)}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-token">Invitation token</Label>
              <Input
                id="invite-token"
                value={tokenField}
                onChange={(ev) => setTokenField(ev.target.value)}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className="font-mono text-sm"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                className="rounded-full"
                disabled={decisionMutation.isPending}
                onClick={() => decisionMutation.mutate({ decision: 'accept' })}
              >
                {decisionMutation.isPending ? (
                  <Loader2Icon className="size-4 animate-spin" aria-hidden />
                ) : null}
                Accept invite
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-full text-destructive hover:text-destructive"
                disabled={decisionMutation.isPending}
                onClick={() => decisionMutation.mutate({ decision: 'reject' })}
              >
                Decline
              </Button>
            </div>
            <Alert>
              <AlertTitle className="text-sm font-medium">If decline fails</AlertTitle>
              <AlertDescription className="text-xs">
                Exported apidoc only documents decision <span className="font-mono">accept</span>. If refusal
                returns a validation error, use your admin contact or disregard the stale invite—the platform may
                not expose programmatic decline yet.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-10 max-w-2xl shadow-sm">
        <CardHeader className="flex-row flex-wrap items-center gap-3 space-y-0">
          <Building2 className="size-5 text-muted-foreground" aria-hidden />
          <div>
            <CardTitle className="text-base font-semibold">Your workspaces</CardTitle>
            <CardDescription>Organizations tied to your account after you join them.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {orgsQuery.isPending ? (
            <div className="space-y-3">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : !(orgsQuery.data?.length ?? 0) ? (
            <p className="text-sm text-muted-foreground">
              You are not a member of any organization yet. Complete an invitation above or apply for your own workspace
              on <Link href="/organizations/apply">Apply as a business</Link>.
            </p>
          ) : (
            <ul className="space-y-3">
              {orgsQuery.data!.map((o) => (
                <li key={o.id}>
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
                    <div>
                      <p className="font-medium">{o.name}</p>
                      <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{o.slug}</p>
                      {o.created_at ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Created {formatEscrowDateTime(o.created_at)}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="capitalize">
                        {String(o.status).replace(/_/g, ' ') || '—'}
                      </Badge>
                      <Button asChild variant="outline" size="sm" className="rounded-full">
                        <Link href={`/org/${encodeURIComponent(o.id)}/dashboard`}>Open</Link>
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

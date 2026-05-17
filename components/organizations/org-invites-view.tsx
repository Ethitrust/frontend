'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Building2, Loader2Icon, MailCheck } from 'lucide-react'
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
import { Skeleton } from '@/components/ui/skeleton'
import { formatEscrowDateTime } from '@/lib/escrows/format-escrow'
import {
  fetchMeInvites,
  fetchMeOrganizations,
  postMeInviteDecision,
  postOrgInviteDecision,
} from '@/lib/organizations/me-organizations-api'
import type { MeInviteRow } from '@/lib/organizations/organization-types'
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

function shortToken(token: string): string {
  if (token.length <= 16) return token
  return `${token.slice(0, 8)}…${token.slice(-4)}`
}

/**
 * `/org-invites` — lists pending invites addressed to the current user.
 * Inline Accept / Decline use `POST /organizations/invites/me/{id}/decision`.
 */
export function OrgInvitesView({ accessToken }: { accessToken: string }) {
  const router = useRouter()
  const qc = useQueryClient()
  const e = ethitrustThemeTokens

  const invitesQuery = useQuery({
    queryKey: ['me', 'invites', 'pending'],
    queryFn: () => fetchMeInvites(accessToken, 'pending'),
    enabled: Boolean(accessToken),
  })

  const orgsQuery = useQuery({
    queryKey: ['me', 'organizations'],
    queryFn: () => fetchMeOrganizations(accessToken),
    enabled: Boolean(accessToken),
  })

  const decisionMutation = useMutation({
    mutationFn: ({
      invite,
      decision,
    }: {
      invite: MeInviteRow
      decision: 'accept' | 'reject'
    }) => postMeInviteDecision(accessToken, invite.id, decision),
    onSuccess: async (result, vars) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['me', 'invites'] }),
        qc.invalidateQueries({ queryKey: ['me', 'organizations'] }),
      ])
      if (vars.decision === 'accept') {
        // The new decision response is `{ decision, message }` — surface the
        // server message and use the invite row's org context for the redirect.
        toast.success(
          result.message || `Joined ${vars.invite.org_name ?? 'the workspace'}`,
        )
        router.push(`/org/${encodeURIComponent(vars.invite.org_id)}/dashboard`)
        return
      }
      toast.message(result.message || 'Invitation declined')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const invites = invitesQuery.data ?? []
  const isPending = decisionMutation.isPending

  return (
    <div className={cn(e.layout.container, 'py-8 lg:py-12')}>
      <header className="max-w-2xl">
        <p className={cn(e.typography.eyebrow, 'text-muted-foreground')}>
          Organization
        </p>
        <h1
          className={cn(
            e.typography.displayLG,
            'mt-2 font-serif font-normal text-foreground',
          )}
        >
          Team invites
        </h1>
        <p className={cn(e.typography.bodyMuted, 'mt-3')}>
          Invitations to join another company&apos;s workspace appear here.
          Accept to join the workspace immediately, or decline to clear the
          invite.
        </p>
      </header>

      {invitesQuery.isError ? (
        <Alert variant="destructive" className="mt-8 max-w-2xl">
          <AlertTitle>Could not load your invitations</AlertTitle>
          <AlertDescription>
            {invitesQuery.error instanceof Error
              ? invitesQuery.error.message
              : 'Request failed'}
          </AlertDescription>
        </Alert>
      ) : null}

      <Card className="mt-10 max-w-2xl shadow-sm">
        <CardHeader className="flex-row items-center gap-3 space-y-0">
          <MailCheck className="size-5 text-muted-foreground" aria-hidden />
          <div>
            <CardTitle className="text-base font-semibold">
              Pending invitations
            </CardTitle>
            <CardDescription>
              {invitesQuery.isPending
                ? 'Loading…'
                : `${invites.length} invitation${invites.length === 1 ? '' : 's'} waiting for a response.`}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {invitesQuery.isPending ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : invites.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No pending invitations. If you have an invite email, open the
              link inside it to respond.
            </p>
          ) : (
            <ul className="space-y-3">
              {invites.map((invite) => (
                <InviteRow
                  key={invite.id}
                  invite={invite}
                  pending={isPending}
                  onDecision={(decision) =>
                    decisionMutation.mutate({ invite, decision })
                  }
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="mt-10 max-w-2xl shadow-sm">
        <CardHeader className="flex-row flex-wrap items-center gap-3 space-y-0">
          <Building2 className="size-5 text-muted-foreground" aria-hidden />
          <div>
            <CardTitle className="text-base font-semibold">
              Your workspaces
            </CardTitle>
            <CardDescription>
              Organizations tied to your account after you join them.
            </CardDescription>
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
              You are not a member of any organization yet. Accept an
              invitation above or apply for your own workspace on{' '}
              <Link
                href="/organizations/apply"
                className="underline-offset-2 hover:underline"
              >
                Apply as a business
              </Link>
              .
            </p>
          ) : (
            <ul className="space-y-3">
              {orgsQuery.data!.map((o) => (
                <li key={o.id}>
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
                    <div>
                      <p className="font-medium">{o.name}</p>
                      <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                        {o.slug}
                      </p>
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
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="rounded-full"
                      >
                        <Link
                          href={`/org/${encodeURIComponent(o.id)}/dashboard`}
                        >
                          Open
                        </Link>
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

function InviteRow({
  invite,
  pending,
  onDecision,
}: {
  invite: MeInviteRow
  pending: boolean
  onDecision: (decision: 'accept' | 'reject') => void
}) {
  return (
    <li>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-foreground">
            {invite.org_name ?? 'Workspace invite'}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Role:{' '}
            <span className="font-medium capitalize text-foreground">
              {invite.role}
            </span>
            {invite.invited_by ? <> · invited by {invite.invited_by}</> : null}
          </p>
          {invite.expires_at ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Expires {formatEscrowDateTime(invite.expires_at)}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full text-destructive hover:text-destructive"
            disabled={pending}
            onClick={() => onDecision('reject')}
          >
            Decline
          </Button>
          <Button
            type="button"
            size="sm"
            className="rounded-full"
            disabled={pending}
            onClick={() => onDecision('accept')}
          >
            {pending ? (
              <Loader2Icon className="size-4 animate-spin" aria-hidden />
            ) : null}
            Accept
          </Button>
        </div>
      </div>
    </li>
  )
}

/**
 * `/org-invites/decision?invitation_token=…&org_id=…` — the page reached from
 * an invite email. Reads the token + org id from the URL, displays them, and
 * exposes Accept / Decline without any user-editable inputs.
 *
 * Uses the legacy per-org decision endpoint
 * (`POST /organizations/{org_id}/invite-member/decision`) since the email link
 * carries the org id and the token, not an invite id.
 */
export function OrgInviteDecisionView({
  accessToken,
}: {
  accessToken: string
}) {
  const router = useRouter()
  const qc = useQueryClient()
  const sp = useSearchParams()
  const e = ethitrustThemeTokens

  const orgId = useMemo(
    () =>
      (
        sp.get('organization_id')?.trim() ||
        sp.get('org_id')?.trim() ||
        sp.get('org')?.trim() ||
        ''
      ),
    [sp],
  )

  const invitationToken = useMemo(
    () => sp.get('invitation_token')?.trim() || sp.get('token')?.trim() || '',
    [sp],
  )

  const parsed = useMemo(
    () =>
      orgInviteDecisionSchema.safeParse({
        org_id: orgId,
        invitation_token: invitationToken,
      }),
    [orgId, invitationToken],
  )

  const decisionMutation = useMutation({
    mutationFn: ({ decision }: { decision: 'accept' | 'reject' }) => {
      if (!parsed.success) {
        throw new Error(
          parsed.error.issues[0]?.message ??
            'This invite link is missing the organization id or token.',
        )
      }
      return postOrgInviteDecision(accessToken, parsed.data.org_id, {
        invitation_token: parsed.data.invitation_token,
        decision,
      })
    },
    onSuccess: async (result, vars) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['me', 'invites'] }),
        qc.invalidateQueries({ queryKey: ['me', 'organizations'] }),
      ])
      if (vars.decision === 'accept') {
        // The decision response is `{ decision, message }`. Surface the server
        // message and redirect to the org dashboard using the org id from the
        // invite URL params.
        toast.success(result.message || 'Joined the workspace')
        if (parsed.success) {
          router.push(`/org/${encodeURIComponent(parsed.data.org_id)}/dashboard`)
        } else {
          router.push('/dashboard')
        }
        return
      }
      toast.message(result.message || 'Invitation declined')
      router.push('/org-invites')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <div className={cn(e.layout.container, 'py-8 lg:py-12')}>
      <header className="max-w-2xl">
        <p className={cn(e.typography.eyebrow, 'text-muted-foreground')}>
          Organization
        </p>
        <h1
          className={cn(
            e.typography.displayLG,
            'mt-2 font-serif font-normal text-foreground',
          )}
        >
          Respond to invitation
        </h1>
        <p className={cn(e.typography.bodyMuted, 'mt-3')}>
          You opened a workspace invitation link. Review the details below and
          choose to accept or decline.
        </p>
      </header>

      <Card className="mt-10 max-w-xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Invitation details
          </CardTitle>
          <CardDescription>
            The organization will be revealed when you accept.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {parsed.success ? (
            <dl className="grid gap-4 sm:grid-cols-[8rem_1fr]">
              <dt className="text-xs uppercase tracking-wider text-muted-foreground sm:pt-1">
                Organization ID
              </dt>
              <dd className="break-all font-mono text-xs text-foreground">
                {orgId}
              </dd>

              <dt className="text-xs uppercase tracking-wider text-muted-foreground sm:pt-1">
                Invitation token
              </dt>
              <dd className="break-all font-mono text-xs text-foreground">
                <span title={invitationToken}>{shortToken(invitationToken)}</span>
              </dd>
            </dl>
          ) : (
            <Alert variant="destructive">
              <AlertTitle>Invalid invitation link</AlertTitle>
              <AlertDescription>
                The link is missing the organization id or invitation token.
                Open the latest email we sent you and use the link inside.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              className="rounded-full"
              disabled={!parsed.success || decisionMutation.isPending}
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
              disabled={!parsed.success || decisionMutation.isPending}
              onClick={() => decisionMutation.mutate({ decision: 'reject' })}
            >
              Decline
            </Button>
            <Button
              asChild
              type="button"
              variant="ghost"
              className="rounded-full"
            >
              <Link href="/org-invites">All invites</Link>
            </Button>
          </div>

          <Alert>
            <AlertTitle className="text-sm font-medium">
              If decline fails
            </AlertTitle>
            <AlertDescription className="text-xs">
              Some platform versions only document <span className="font-mono">accept</span>.
              If decline returns a validation error, simply ignore the stale
              invite — it expires automatically.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}

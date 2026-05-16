'use client'

import React, { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Crown,
  Info,
  Loader2Icon,
  Pause,
  Play,
  Shield,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { formatEscrowDateTime } from '@/lib/escrows/format-escrow'
import {
  cancelOrgInvite,
  deleteOrgMember,
  fetchOrgInvites,
  fetchOrgMembers,
  pauseOrgMember,
  postOrgInvite,
  resumeOrgMember,
} from '@/lib/org/org-organizations-api'
import { fetchAuthMe } from '@/lib/auth/me-session-api'
import { useAuthStore } from '@/stores/auth-store'

// ─── Role metadata ────────────────────────────────────────────────────────────

const ROLE_META: Record<
  string,
  { label: string; icon: LucideIcon; color: string; permissions: string[] }
> = {
  owner: {
    label: 'Owner',
    icon: Crown,
    color: 'text-violet-600',
    permissions: [
      'Full organization control',
      'Invite & manage all members',
      'Pause / remove members & admins',
      'Manage API keys',
      'Edit org profile & webhook config',
      'View and manage org wallet',
      'Create and manage all escrows',
    ],
  },
  admin: {
    label: 'Admin',
    icon: ShieldCheck,
    color: 'text-blue-600',
    permissions: [
      'Create and manage escrows',
      'View org wallet (read-only)',
      'View and use API keys',
      'Cannot manage team members',
      'Cannot edit org profile',
    ],
  },
  member: {
    label: 'Member',
    icon: Shield,
    color: 'text-emerald-600',
    permissions: [
      'Create and participate in escrows',
      'View their own escrows',
      'Cannot access settings or API keys',
      'Cannot view org wallet',
    ],
  },
}

function RolePermissionsTooltip({ role }: { role: string }) {
  const meta = ROLE_META[role] ?? ROLE_META['member']
  const Icon = meta.icon
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`inline-flex items-center gap-1 cursor-help ${meta.color}`}>
            <Icon className="size-3.5" />
            <span className="capitalize text-sm">{meta.label}</span>
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-56 p-3">
          <p className="mb-1.5 font-semibold text-xs">{meta.label} permissions</p>
          <ul className="space-y-0.5">
            {meta.permissions.map((p) => (
              <li key={p} className="text-xs text-muted-foreground flex gap-1.5">
                <span className="mt-0.5 text-foreground">·</span>
                {p}
              </li>
            ))}
          </ul>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function OrgSettingsTeamActions({ orgId }: { orgId: string }) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const qc = useQueryClient()

  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [roleInfoOpen, setRoleInfoOpen] = useState(false)

  // ── Current user (for self-protection) ────────────────────────────────────
  const meQuery = useQuery({
    queryKey: ['me', 'auth', 'me'],
    queryFn: () => fetchAuthMe(accessToken!),
    enabled: Boolean(accessToken),
    staleTime: 5 * 60_000,
  })
  const currentUserId = meQuery.data?.id

  const membersQuery = useQuery({
    queryKey: ['me', 'organizations', orgId, 'members'],
    queryFn: () => fetchOrgMembers(accessToken!, orgId),
    enabled: Boolean(accessToken && orgId),
  })

  const members = membersQuery.data ?? []
  const myMember = members.find((m: any) => m.user_id === currentUserId)
  const myRole = myMember?.role ?? 'member'
  const isCurrentUserOwner = myRole === 'owner'

  const invitesQuery = useQuery({
    queryKey: ['me', 'organizations', orgId, 'invites'],
    queryFn: () => fetchOrgInvites(accessToken!, orgId),
    enabled: Boolean(accessToken && orgId && isCurrentUserOwner),
  })

  // ── Mutations ──────────────────────────────────────────────────────────────
  const inviteMutation = useMutation({
    mutationFn: () =>
      postOrgInvite(accessToken!, orgId, { email: inviteEmail, role: inviteRole }),
    onSuccess: () => {
      toast.success('Invitation sent — they will receive an email shortly')
      setInviteOpen(false)
      setInviteEmail('')
      setInviteRole('member')
      void qc.invalidateQueries({ queryKey: ['me', 'organizations', orgId, 'invites'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => deleteOrgMember(accessToken!, orgId, userId),
    onSuccess: () => {
      toast.success('Member removed from organization')
      void qc.invalidateQueries({ queryKey: ['me', 'organizations', orgId, 'members'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const pauseMemberMutation = useMutation({
    mutationFn: (userId: string) => pauseOrgMember(accessToken!, orgId, userId),
    onSuccess: () => {
      toast.success('Member access paused')
      void qc.invalidateQueries({ queryKey: ['me', 'organizations', orgId, 'members'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const resumeMemberMutation = useMutation({
    mutationFn: (userId: string) => resumeOrgMember(accessToken!, orgId, userId),
    onSuccess: () => {
      toast.success('Member access restored')
      void qc.invalidateQueries({ queryKey: ['me', 'organizations', orgId, 'members'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const cancelInviteMutation = useMutation({
    mutationFn: (inviteId: string) => cancelOrgInvite(accessToken!, orgId, inviteId),
    onSuccess: () => {
      toast.success('Invitation cancelled')
      void qc.invalidateQueries({ queryKey: ['me', 'organizations', orgId, 'invites'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const invites = invitesQuery.data ?? []

  const anyPending =
    removeMemberMutation.isPending ||
    pauseMemberMutation.isPending ||
    resumeMemberMutation.isPending

  function confirmRemove(userId: string, name: string) {
    if (window.confirm(`Remove ${name} from this organization? They will lose all access immediately.`)) {
      removeMemberMutation.mutate(userId)
    }
  }

  return (
    <Card className="shadow-sm">
      {/* ── Header ── */}
      <CardHeader className="flex-row flex-wrap items-start justify-between gap-4 space-y-0 border-b">
        <div>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Users className="size-4 text-muted-foreground" aria-hidden />
            Team Members
          </CardTitle>
          <CardDescription className="mt-1">
            {isCurrentUserOwner
              ? 'Manage who has access to this workspace. Only the Owner can manage the team.'
              : 'View team members of this organization.'}
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {/* Role legend info button */}
          <Dialog open={roleInfoOpen} onOpenChange={setRoleInfoOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-full gap-1.5">
                <Info className="size-3.5" />
                Role guide
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Member roles & permissions</DialogTitle>
                <DialogDescription>
                  Each role controls what a team member can access inside this organization workspace.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                {Object.entries(ROLE_META).map(([key, meta]) => {
                  const Icon = meta.icon
                  return (
                    <div key={key} className="rounded-lg border p-4">
                      <div className={`flex items-center gap-2 font-semibold mb-2 ${meta.color}`}>
                        <Icon className="size-4" />
                        {meta.label}
                      </div>
                      <ul className="space-y-1">
                        {meta.permissions.map((p) => (
                          <li key={p} className="text-sm text-muted-foreground flex gap-2">
                            <span className="text-foreground mt-0.5">·</span>
                            {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                })}
              </div>
            </DialogContent>
          </Dialog>

          {/* Invite button — Only for Owners */}
          {isCurrentUserOwner && (
            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
              <DialogTrigger asChild>
                <Button variant="default" className="rounded-full gap-2">
                  <UserPlus className="size-4" />
                  Invite member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite a team member</DialogTitle>
                  <DialogDescription>
                    Enter their email and choose a role. They will receive an invitation email with a
                    one-click link to join. The invitation expires in <strong>2 days</strong>.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="invite-email">Email address</Label>
                    <Input
                      id="invite-email"
                      type="email"
                      placeholder="colleague@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invite-role">Role</Label>
                    <Select value={inviteRole} onValueChange={setInviteRole}>
                      <SelectTrigger id="invite-role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ROLE_META).filter(([k]) => k !== 'owner').map(([key, meta]) => {
                          const Icon = meta.icon
                          return (
                            <SelectItem key={key} value={key}>
                              <span className={`flex items-center gap-2 ${meta.color}`}>
                                <Icon className="size-3.5" />
                                {meta.label}
                              </span>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {ROLE_META[inviteRole]?.permissions.slice(0, 2).join(' · ')}
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full"
                    onClick={() => setInviteOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    className="rounded-full"
                    disabled={!inviteEmail || inviteMutation.isPending}
                    onClick={() => inviteMutation.mutate()}
                  >
                    {inviteMutation.isPending ? (
                      <Loader2Icon className="mr-2 size-4 animate-spin" />
                    ) : null}
                    Send invite
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>

      {/* ── Table ── */}
      <CardContent className="px-0 pb-0 pt-0">
        {membersQuery.isError && (
          <p className="px-6 py-4 text-sm text-destructive">
            {membersQuery.error instanceof Error
              ? membersQuery.error.message
              : 'Could not load members'}
          </p>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-6 py-3 font-medium">Member</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Joined / Invited</th>
                {isCurrentUserOwner && <th className="px-6 py-3 font-medium text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {/* ── Active members ── */}
              {members.map((m: any) => {
                const isSelf = m.user_id === currentUserId
                const displayName = m.user_name || 'Unknown user'
                const displayEmail = m.user_email || ''

                return (
                  <tr
                    key={m.id}
                    className={`border-b border-border/60 last:border-0 transition-colors ${
                      !m.is_active ? 'opacity-60 bg-muted/20' : ''
                    }`}
                  >
                    {/* Member info */}
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold uppercase">
                          {displayName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 font-medium">
                            <span className="truncate">{displayName}</span>
                            {isSelf && (
                              <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                                You
                              </Badge>
                            )}
                          </div>
                          {displayEmail && (
                            <p className="text-xs text-muted-foreground truncate">{displayEmail}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Role with tooltip */}
                    <td className="px-4 py-3">
                      <RolePermissionsTooltip role={m.role} />
                    </td>

                    {/* Status badge */}
                    <td className="px-4 py-3">
                      {m.is_active ? (
                        <Badge
                          variant="secondary"
                          className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800"
                        >
                          Active
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800"
                        >
                          Paused
                        </Badge>
                      )}
                    </td>

                    {/* Joined date */}
                    <td className="px-4 py-3 tabular-nums text-xs text-muted-foreground whitespace-nowrap">
                      {formatEscrowDateTime(m.created_at)}
                    </td>

                    {/* Actions — only shown if current user is Owner and target is not self/owner */}
                    {isCurrentUserOwner && (
                      <td className="px-6 py-3 text-right">
                        {!isSelf && m.role !== 'owner' ? (
                          <div className="flex justify-end gap-1">
                            {m.is_active ? (
                              <TooltipProvider delayDuration={100}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="size-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                      disabled={anyPending}
                                      onClick={() => pauseMemberMutation.mutate(m.user_id)}
                                    >
                                      <Pause className="size-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Pause access</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : (
                              <TooltipProvider delayDuration={100}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="size-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                      disabled={anyPending}
                                      onClick={() => resumeMemberMutation.mutate(m.user_id)}
                                    >
                                      <Play className="size-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Restore access</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                            <TooltipProvider delayDuration={100}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8 text-destructive hover:bg-destructive/10"
                                    disabled={anyPending}
                                    onClick={() => confirmRemove(m.user_id, displayName)}
                                  >
                                    <Trash2 className="size-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Remove member</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground pr-2">
                            {isSelf ? 'You' : 'Owner'}
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                )
              })}

              {/* ── Pending invitations ── */}
              {invites.map((i: any) => (
                <tr
                  key={i.id}
                  className="border-b border-border/60 last:border-0 bg-muted/10"
                >
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/30 text-xs text-muted-foreground">
                        ?
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-muted-foreground truncate">{i.email}</p>
                        <p className="text-xs text-muted-foreground/60">
                          Expires {formatEscrowDateTime(i.expires_at)}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <RolePermissionsTooltip role={i.role} />
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="outline"
                      className={
                        i.status === 'cancelled'
                          ? 'opacity-40'
                          : 'border-blue-200 text-blue-700 bg-blue-50 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800'
                      }
                    >
                      {i.status === 'pending' ? 'Awaiting' : i.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">—</td>
                  {isCurrentUserOwner && (
                    <td className="px-6 py-3 text-right">
                      {i.status === 'pending' && (
                        <TooltipProvider delayDuration={100}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                disabled={cancelInviteMutation.isPending}
                                onClick={() => {
                                  if (window.confirm(`Cancel the invitation to ${i.email}?`)) {
                                    cancelInviteMutation.mutate(i.id)
                                  }
                                }}
                              >
                                <XCircle className="size-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Cancel invitation</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </td>
                  )}
                </tr>
              ))}

              {/* ── Empty state ── */}
              {members.length === 0 && invites.length === 0 && !membersQuery.isPending && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-muted-foreground">
                    No team members yet. Invite your first member above.
                  </td>
                </tr>
              )}

              {/* ── Loading skeleton ── */}
              {membersQuery.isPending && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-muted-foreground">
                    <Loader2Icon className="mx-auto size-5 animate-spin opacity-40" />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Role summary footer ── */}
        <div className="border-t px-6 py-3 flex flex-wrap items-center gap-x-6 gap-y-1">
          <span className="text-xs text-muted-foreground font-medium">Roles:</span>
          {Object.entries(ROLE_META).map(([key, meta]) => {
            const Icon = meta.icon
            return (
              <span key={key} className={`flex items-center gap-1 text-xs ${meta.color}`}>
                <Icon className="size-3" />
                <span className="font-medium">{meta.label}</span>
                <span className="text-muted-foreground">— {meta.permissions[0].toLowerCase()}</span>
              </span>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

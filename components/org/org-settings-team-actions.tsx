'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2Icon, Trash2, Users } from 'lucide-react'
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
import { formatEscrowDateTime } from '@/lib/escrows/format-escrow'
import {
  deleteOrgMember,
  fetchOrgInvites,
  fetchOrgMembers,
  postOrgInvite,
} from '@/lib/org/org-organizations-api'
import { useAuthStore } from '@/stores/auth-store'

export function OrgSettingsTeamActions({ orgId }: { orgId: string }) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const qc = useQueryClient()

  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')

  const membersQuery = useQuery({
    queryKey: ['me', 'organizations', orgId, 'members'],
    queryFn: () => fetchOrgMembers(accessToken!, orgId),
    enabled: Boolean(accessToken && orgId),
  })

  const invitesQuery = useQuery({
    queryKey: ['me', 'organizations', orgId, 'invites'],
    queryFn: () => fetchOrgInvites(accessToken!, orgId),
    enabled: Boolean(accessToken && orgId),
  })

  const inviteMutation = useMutation({
    mutationFn: () => postOrgInvite(accessToken!, orgId, { email: inviteEmail, role: inviteRole }),
    onSuccess: () => {
      toast.success('Invitation sent')
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
      toast.success('Member removed')
      void qc.invalidateQueries({ queryKey: ['me', 'organizations', orgId, 'members'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const members = membersQuery.data ?? []
  const invites = invitesQuery.data ?? []

  function confirmRemove(userId: string) {
    if (window.confirm('Remove this member from the organization?')) {
      removeMemberMutation.mutate(userId)
    }
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-4 space-y-0 border-b">
        <div>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Users className="size-4 text-muted-foreground" aria-hidden />
            Team Members
          </CardTitle>
          <CardDescription>
            Manage who has access to this workspace.
          </CardDescription>
        </div>
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <Button variant="default" className="rounded-full">
              Invite member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite a team member</DialogTitle>
              <DialogDescription>
                Send an invitation link. They will need to sign in or create an account to accept.
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
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="owner">Owner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                className="rounded-full"
                disabled={!inviteEmail || inviteMutation.isPending}
                onClick={() => inviteMutation.mutate()}
              >
                {inviteMutation.isPending ? <Loader2Icon className="mr-2 size-4 animate-spin" /> : null}
                Send invite
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="px-0 pb-0 pt-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-xl text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-6 py-3 font-medium">User ID / Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Joined / Invited</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-b border-border/60 last:border-0">
                  <td className="px-6 py-3 font-medium font-mono text-xs">{m.user_id}</td>
                  <td className="px-4 py-3 capitalize">{m.role}</td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary">Active</Badge>
                  </td>
                  <td className="px-6 py-3 tabular-nums text-xs text-muted-foreground">
                    {formatEscrowDateTime(m.created_at)}
                  </td>
                  <td className="px-6 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive size-8"
                      disabled={removeMemberMutation.isPending}
                      onClick={() => confirmRemove(m.user_id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {invites.map((i) => (
                <tr key={i.id} className="border-b border-border/60 last:border-0 opacity-70">
                  <td className="px-6 py-3 font-medium">{i.email}</td>
                  <td className="px-4 py-3 capitalize">{i.role}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">Pending</Badge>
                  </td>
                  <td className="px-6 py-3 tabular-nums text-xs text-muted-foreground">
                    {formatEscrowDateTime(i.invited_at)}
                  </td>
                  <td className="px-6 py-3 text-right">
                    <span className="text-xs text-muted-foreground pr-3">Pending</span>
                  </td>
                </tr>
              ))}
              {members.length === 0 && invites.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-muted-foreground">
                    No team members found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Ban, CheckCircle, RefreshCw, Search, Shield, TrendingUp } from 'lucide-react'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import {
  fetchUserRiskProfile,
  recalculateUserRisk,
  restrictUser,
  unrestrictUser,
} from '@/lib/admin/admin-risk-monitoring-api'
import { formatEscrowDateTime } from '@/lib/escrows/format-escrow'
import { ethitrustThemeTokens } from '@/lib/ethitrust-theme'
import { cn } from '@/lib/utils'

function formatDt(iso?: string | null) {
  if (!iso) return '—'
  try {
    return formatEscrowDateTime(iso)
  } catch {
    return iso
  }
}

function getRiskLevelColor(level: string) {
  switch (level) {
    case 'critical':
      return 'text-red-600 bg-red-50 border-red-200'
    case 'high':
      return 'text-orange-600 bg-orange-50 border-orange-200'
    case 'medium':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    case 'low':
      return 'text-green-600 bg-green-50 border-green-200'
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200'
  }
}

export function AdminRiskUserProfileView({ accessToken }: { accessToken: string }) {
  const e = ethitrustThemeTokens
  const qc = useQueryClient()

  const [userId, setUserId] = useState('')
  const [searchedUserId, setSearchedUserId] = useState<string | null>(null)

  const [restrictDialogOpen, setRestrictDialogOpen] = useState(false)
  const [restrictReason, setRestrictReason] = useState('')
  const [restrictDuration, setRestrictDuration] = useState('30')

  const [unrestrictDialogOpen, setUnrestrictDialogOpen] = useState(false)
  const [unrestrictNotes, setUnrestrictNotes] = useState('')

  const profileQuery = useQuery({
    queryKey: ['admin', 'risk', 'user-profile', searchedUserId],
    queryFn: () => fetchUserRiskProfile(accessToken, searchedUserId!),
    enabled: Boolean(accessToken && searchedUserId),
  })

  const recalculateMutation = useMutation({
    mutationFn: () => recalculateUserRisk(accessToken, searchedUserId!),
    onSuccess: () => {
      toast.success('Risk score recalculated')
      void qc.invalidateQueries({ queryKey: ['admin', 'risk', 'user-profile', searchedUserId] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const restrictMutation = useMutation({
    mutationFn: () =>
      restrictUser(
        accessToken,
        searchedUserId!,
        restrictReason,
        restrictDuration ? parseInt(restrictDuration) : undefined
      ),
    onSuccess: () => {
      toast.success('User restricted')
      setRestrictDialogOpen(false)
      setRestrictReason('')
      setRestrictDuration('30')
      void qc.invalidateQueries({ queryKey: ['admin', 'risk', 'user-profile', searchedUserId] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const unrestrictMutation = useMutation({
    mutationFn: () => unrestrictUser(accessToken, searchedUserId!, unrestrictNotes),
    onSuccess: () => {
      toast.success('User unrestricted')
      setUnrestrictDialogOpen(false)
      setUnrestrictNotes('')
      void qc.invalidateQueries({ queryKey: ['admin', 'risk', 'user-profile', searchedUserId] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const profile = profileQuery.data

  const handleSearch = () => {
    if (userId.trim()) {
      setSearchedUserId(userId.trim())
    }
  }

  return (
    <div className={cn(e.layout.container, 'py-8 lg:py-12')}>
      <header>
        <p className={cn(e.typography.eyebrow, 'text-muted-foreground')}>Risk monitoring</p>
        <h1 className={cn(e.typography.displayLG, 'mt-2 font-serif font-normal text-foreground')}>
          User Risk Profiles
        </h1>
        <p className={cn(e.typography.bodyMuted, 'mt-3')}>
          View detailed risk profiles for users including risk scores, transaction patterns, and
          behavioral metrics.
        </p>
      </header>

      {/* Search */}
      <Card className="mt-8 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Search User</CardTitle>
          <CardDescription>Enter a user ID to view their risk profile</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              placeholder="User ID (UUID)"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} className="rounded-full">
              <Search className="mr-2 size-4" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {profileQuery.isError ? (
        <Alert variant="destructive" className="mt-8">
          <AlertTitle>Could not load user profile</AlertTitle>
          <AlertDescription>
            {profileQuery.error instanceof Error ? profileQuery.error.message : 'Request failed'}
          </AlertDescription>
        </Alert>
      ) : null}

      {searchedUserId && (
        <>
          {/* Risk Overview */}
          <Card className="mt-8 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Risk Overview</CardTitle>
                <CardDescription>Current risk assessment for user {searchedUserId}</CardDescription>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full"
                onClick={() => recalculateMutation.mutate()}
                disabled={recalculateMutation.isPending}
              >
                <RefreshCw className="mr-2 size-4" />
                Recalculate
              </Button>
            </CardHeader>
            <CardContent>
              {profileQuery.isPending ? (
                <div className="space-y-4">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : profile ? (
                <>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="flex items-start gap-3 rounded-lg border border-border bg-card/40 p-4">
                      <Shield className="mt-0.5 size-5 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Risk Score</p>
                        <p className="mt-1 text-2xl font-bold">{profile.risk_score.toFixed(1)}</p>
                        <Badge
                          variant="outline"
                          className={cn('mt-2 text-xs', getRiskLevelColor(profile.risk_level))}
                        >
                          {profile.risk_level}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 rounded-lg border border-border bg-card/40 p-4">
                      <AlertTriangle className="mt-0.5 size-5 text-orange-600" />
                      <div>
                        <p className="text-xs text-muted-foreground">Total Flags</p>
                        <p className="mt-1 text-2xl font-bold">{profile.total_flags}</p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          Last: {formatDt(profile.last_flag_date)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 rounded-lg border border-border bg-card/40 p-4">
                      <TrendingUp className="mt-0.5 size-5 text-blue-600" />
                      <div>
                        <p className="text-xs text-muted-foreground">Transaction Velocity</p>
                        <p className="mt-1 text-2xl font-bold">{profile.transaction_velocity.toFixed(1)}</p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          Avg: {profile.avg_transaction_amount.toFixed(0)} ETB
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 rounded-lg border border-border bg-card/40 p-4">
                      {profile.is_restricted ? (
                        <Ban className="mt-0.5 size-5 text-red-600" />
                      ) : (
                        <CheckCircle className="mt-0.5 size-5 text-green-600" />
                      )}
                      <div>
                        <p className="text-xs text-muted-foreground">Status</p>
                        <p className="mt-1 text-lg font-bold">
                          {profile.is_restricted ? 'Restricted' : 'Active'}
                        </p>
                        {profile.is_restricted && (
                          <p className="mt-2 text-xs text-muted-foreground">
                            Since: {formatDt(profile.restricted_at)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {profile.is_restricted && profile.restriction_reason && (
                    <Alert className="mt-6">
                      <Ban className="size-4" />
                      <AlertTitle>Restriction Active</AlertTitle>
                      <AlertDescription>{profile.restriction_reason}</AlertDescription>
                    </Alert>
                  )}

                  <div className="mt-6 flex gap-3">
                    {profile.is_restricted ? (
                      <Button
                        variant="outline"
                        className="rounded-full"
                        onClick={() => setUnrestrictDialogOpen(true)}
                      >
                        <CheckCircle className="mr-2 size-4" />
                        Unrestrict User
                      </Button>
                    ) : (
                      <Button
                        variant="destructive"
                        className="rounded-full"
                        onClick={() => setRestrictDialogOpen(true)}
                      >
                        <Ban className="mr-2 size-4" />
                        Restrict User
                      </Button>
                    )}
                  </div>
                </>
              ) : null}
            </CardContent>
          </Card>

          {/* Seller Metrics */}
          {profile && (
            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Seller Metrics</CardTitle>
                  <CardDescription>Performance as a service provider</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Escrows</span>
                      <span className="font-semibold">{profile.total_escrows_as_seller}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Disputes Against</span>
                      <span className="font-semibold">{profile.disputes_against_as_seller}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Dispute Rate</span>
                      <span className="font-semibold">
                        {(profile.seller_dispute_rate * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Reputation Score</span>
                      <span className="font-semibold">
                        {profile.seller_reputation_score.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Buyer Metrics</CardTitle>
                  <CardDescription>Performance as a service buyer</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Escrows</span>
                      <span className="font-semibold">{profile.total_escrows_as_buyer}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Disputes Raised</span>
                      <span className="font-semibold">{profile.disputes_raised_as_buyer}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Dispute Rate</span>
                      <span className="font-semibold">
                        {(profile.buyer_dispute_rate * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Pattern Metrics */}
          {profile && (
            <Card className="mt-8 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Behavioral Patterns</CardTitle>
                <CardDescription>Suspicious activity indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg border border-border bg-card/40 p-4">
                    <p className="text-xs text-muted-foreground">Instant Confirmations</p>
                    <p className="mt-1 text-xl font-bold">{profile.instant_confirmation_count}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-card/40 p-4">
                    <p className="text-xs text-muted-foreground">Repeated Partners</p>
                    <p className="mt-1 text-xl font-bold">{profile.repeated_partner_count}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-card/40 p-4">
                    <p className="text-xs text-muted-foreground">Deadline Disputes</p>
                    <p className="mt-1 text-xl font-bold">{profile.dispute_near_deadline_count}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-card/40 p-4">
                    <p className="text-xs text-muted-foreground">Circular Flow Flags</p>
                    <p className="mt-1 text-xl font-bold">{profile.circular_flow_flags}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          {profile && (
            <Card className="mt-8 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Profile Metadata</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Calculated</span>
                    <span>{formatDt(profile.last_calculated_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Dispute</span>
                    <span>{formatDt(profile.last_dispute_date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Profile Created</span>
                    <span>{formatDt(profile.created_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Updated</span>
                    <span>{formatDt(profile.updated_at)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Restrict Dialog */}
      <Dialog open={restrictDialogOpen} onOpenChange={setRestrictDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Restrict User</DialogTitle>
            <DialogDescription>
              Restrict user {searchedUserId} from creating new escrows
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="restrict-reason">Reason (required)</Label>
              <Textarea
                id="restrict-reason"
                value={restrictReason}
                onChange={(e) => setRestrictReason(e.target.value)}
                placeholder="Document the reason for restriction..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="restrict-duration">Duration (days)</Label>
              <Input
                id="restrict-duration"
                type="number"
                value={restrictDuration}
                onChange={(e) => setRestrictDuration(e.target.value)}
                placeholder="30"
              />
              <p className="text-xs text-muted-foreground">
                Leave empty for indefinite restriction
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setRestrictDialogOpen(false)
                setRestrictReason('')
                setRestrictDuration('30')
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={!restrictReason.trim() || restrictMutation.isPending}
              onClick={() => restrictMutation.mutate()}
            >
              Restrict User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unrestrict Dialog */}
      <Dialog open={unrestrictDialogOpen} onOpenChange={setUnrestrictDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Unrestrict User</DialogTitle>
            <DialogDescription>
              Remove restrictions from user {searchedUserId}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="unrestrict-notes">Notes (optional)</Label>
              <Textarea
                id="unrestrict-notes"
                value={unrestrictNotes}
                onChange={(e) => setUnrestrictNotes(e.target.value)}
                placeholder="Document the reason for unrestriction..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setUnrestrictDialogOpen(false)
                setUnrestrictNotes('')
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={unrestrictMutation.isPending}
              onClick={() => unrestrictMutation.mutate()}
            >
              Unrestrict User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

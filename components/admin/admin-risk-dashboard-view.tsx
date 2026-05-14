'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import {
  AlertTriangle,
  ArrowRight,
  Clock,
  Shield,
  ShieldAlert,
  TrendingUp,
  Users,
} from 'lucide-react'
import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { fetchRiskStatistics } from '@/lib/admin/admin-risk-monitoring-api'
import type { RiskEvent } from '@/lib/admin/admin-risk-monitoring-api'
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

function getSeverityColor(severity: string) {
  switch (severity) {
    case 'critical':
      return 'text-red-600 bg-red-50 border-red-200'
    case 'high':
      return 'text-orange-600 bg-orange-50 border-orange-200'
    case 'medium':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    case 'low':
      return 'text-blue-600 bg-blue-50 border-blue-200'
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200'
  }
}

export function AdminRiskDashboardView({ accessToken }: { accessToken: string }) {
  const e = ethitrustThemeTokens

  const statsQuery = useQuery({
    queryKey: ['admin', 'risk', 'statistics'],
    queryFn: () => fetchRiskStatistics(accessToken),
    enabled: Boolean(accessToken),
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  const stats = statsQuery.data

  // Prepare chart data from top risk factors
  const riskFactorsData = stats?.top_risk_factors
    ? Object.entries(stats.top_risk_factors)
        .map(([name, count]) => ({
          name: name.replace(/_/g, ' ').slice(0, 20),
          count,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8)
    : []

  // Prepare recent events timeline data
  const eventsTimelineData = stats?.recent_events
    ? stats.recent_events
        .slice(0, 10)
        .reverse()
        .map((event, idx) => ({
          index: idx + 1,
          severity: event.severity === 'critical' ? 4 : event.severity === 'high' ? 3 : event.severity === 'medium' ? 2 : 1,
          label: event.event_type.slice(0, 15),
        }))
    : []

  return (
    <div className={cn(e.layout.container, 'py-8 lg:py-12')}>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          <p className={cn(e.typography.eyebrow, 'text-muted-foreground')}>Risk monitoring</p>
          <h1 className={cn(e.typography.displayLG, 'mt-2 font-serif font-normal text-foreground')}>
            Dashboard
          </h1>
          <p className={cn(e.typography.bodyMuted, 'mt-3')}>
            Real-time fraud detection and risk monitoring across the platform. Monitor suspicious
            patterns, review flagged transactions, and manage user restrictions.
          </p>
        </div>
        <Button asChild className="rounded-full shrink-0">
          <Link href="/admin/risk-monitoring/review-queue">
            Review queue
            <ArrowRight className="ml-2 size-4" />
          </Link>
        </Button>
      </header>

      {statsQuery.isError ? (
        <Alert variant="destructive" className="mt-8">
          <AlertTitle>Could not load risk statistics</AlertTitle>
          <AlertDescription>
            {statsQuery.error instanceof Error ? statsQuery.error.message : 'Request failed'}
          </AlertDescription>
        </Alert>
      ) : null}

      {/* Key Metrics Grid */}
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Reviews
            </CardTitle>
            <Clock className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsQuery.isPending ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-3xl font-bold">{stats?.pending_reviews ?? 0}</div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Require manual review
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              High Risk Users
            </CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsQuery.isPending ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-3xl font-bold">{stats?.high_risk_users ?? 0}</div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {stats?.total_restricted_users ?? 0} restricted
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Critical Escrows
            </CardTitle>
            <ShieldAlert className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsQuery.isPending ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-3xl font-bold">{stats?.critical_risk_escrows ?? 0}</div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {stats?.total_flagged_escrows ?? 0} total flagged
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Circular Flows
            </CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsQuery.isPending ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-3xl font-bold">{stats?.circular_flows_detected ?? 0}</div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {stats?.circular_flows_confirmed ?? 0} confirmed
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Top Risk Factors */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Top Risk Factors</CardTitle>
            <CardDescription>Most common suspicious activity patterns detected</CardDescription>
          </CardHeader>
          <CardContent>
            {statsQuery.isPending ? (
              <Skeleton className="h-64 w-full" />
            ) : riskFactorsData.length === 0 ? (
              <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
                No risk factors detected yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={riskFactorsData} layout="vertical">
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Recent Events Timeline */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Recent Risk Events</CardTitle>
            <CardDescription>Timeline of recent suspicious activity</CardDescription>
          </CardHeader>
          <CardContent>
            {statsQuery.isPending ? (
              <Skeleton className="h-64 w-full" />
            ) : eventsTimelineData.length === 0 ? (
              <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
                No recent events
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={eventsTimelineData}>
                  <XAxis dataKey="index" />
                  <YAxis domain={[0, 4]} ticks={[1, 2, 3, 4]} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-md">
                            <p className="text-xs font-medium">{data.label}</p>
                            <p className="text-xs text-muted-foreground">
                              Severity: {data.severity}
                            </p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="severity"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Platform Health Summary */}
      <Card className="mt-8 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Platform Health</CardTitle>
          <CardDescription>Overall risk assessment and system status</CardDescription>
        </CardHeader>
        <CardContent>
          {statsQuery.isPending ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-start gap-3 rounded-lg border border-border bg-card/40 p-4">
                <Shield className="mt-0.5 size-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Average Risk Score</p>
                  <p className="mt-1 text-2xl font-bold">
                    {stats?.avg_risk_score?.toFixed(1) ?? '0.0'}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Platform-wide average
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-border bg-card/40 p-4">
                <AlertTriangle className="mt-0.5 size-5 text-orange-600" />
                <div>
                  <p className="text-sm font-medium">Active Flags</p>
                  <p className="mt-1 text-2xl font-bold">
                    {(stats?.total_flagged_escrows ?? 0) + (stats?.total_restricted_users ?? 0)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Escrows + Users
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-border bg-card/40 p-4">
                <TrendingUp className="mt-0.5 size-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">Detection Rate</p>
                  <p className="mt-1 text-2xl font-bold">
                    {stats?.circular_flows_detected
                      ? Math.round(
                          ((stats.circular_flows_confirmed ?? 0) /
                            stats.circular_flows_detected) *
                            100
                        )
                      : 0}
                    %
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Circular flow accuracy
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Risk Events Table */}
      <Card className="mt-8 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Recent Risk Events</CardTitle>
            <CardDescription>Latest suspicious activities detected by the system</CardDescription>
          </div>
          <Button variant="outline" size="sm" className="rounded-full" asChild>
            <Link href="/admin/risk-monitoring/events">View all</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {statsQuery.isPending ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : !stats?.recent_events || stats.recent_events.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent events</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event Type</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Impact</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recent_events.slice(0, 5).map((event: RiskEvent) => (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium">
                        {event.event_type.replace(/_/g, ' ')}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn('text-xs', getSeverityColor(event.severity))}
                        >
                          {event.severity}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                        {event.description}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {event.risk_score_impact > 0 ? '+' : ''}
                        {event.risk_score_impact}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDt(event.created_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Button variant="outline" className="h-auto flex-col items-start gap-2 p-4" asChild>
          <Link href="/admin/risk-monitoring/review-queue">
            <Clock className="size-5" />
            <div className="text-left">
              <p className="font-semibold">Review Queue</p>
              <p className="text-xs text-muted-foreground">Process pending items</p>
            </div>
          </Link>
        </Button>

        <Button variant="outline" className="h-auto flex-col items-start gap-2 p-4" asChild>
          <Link href="/admin/risk-monitoring/users">
            <Users className="size-5" />
            <div className="text-left">
              <p className="font-semibold">User Profiles</p>
              <p className="text-xs text-muted-foreground">View risk scores</p>
            </div>
          </Link>
        </Button>

        <Button variant="outline" className="h-auto flex-col items-start gap-2 p-4" asChild>
          <Link href="/admin/risk-monitoring/circular-flows">
            <TrendingUp className="size-5" />
            <div className="text-left">
              <p className="font-semibold">Circular Flows</p>
              <p className="text-xs text-muted-foreground">Investigate patterns</p>
            </div>
          </Link>
        </Button>

        <Button variant="outline" className="h-auto flex-col items-start gap-2 p-4" asChild>
          <Link href="/admin/risk-monitoring/config">
            <Shield className="size-5" />
            <div className="text-left">
              <p className="font-semibold">Configuration</p>
              <p className="text-xs text-muted-foreground">Adjust thresholds</p>
            </div>
          </Link>
        </Button>
      </div>
    </div>
  )
}

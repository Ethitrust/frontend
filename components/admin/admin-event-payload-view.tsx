'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'

import { AdminStructuredDataView } from '@/components/admin/admin-structured-data-view'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { fetchAdminEventPayload } from '@/lib/admin/admin-messaging-audit-api'
import { ethitrustThemeTokens } from '@/lib/ethitrust-theme'
import { cn } from '@/lib/utils'

export function AdminEventPayloadView({
  accessToken,
  eventId,
}: {
  accessToken: string
  eventId: string
}) {
  const e = ethitrustThemeTokens

  const payloadQuery = useQuery({
    queryKey: ['admin', 'domain-events', eventId, 'payload'],
    queryFn: () => fetchAdminEventPayload(accessToken, eventId),
    enabled: Boolean(accessToken && eventId),
  })

  const err =
    payloadQuery.isError && payloadQuery.error instanceof Error
      ? payloadQuery.error.message
      : payloadQuery.isError
        ? 'Failed to load payload'
        : null

  return (
    <div className={cn(e.layout.container, 'space-y-8 py-8 lg:py-12')}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <header className="max-w-2xl">
          <p className={cn(e.typography.eyebrow, 'text-muted-foreground')}>Messaging & audits</p>
          <h1 className={cn(e.typography.displayLG, 'mt-2 font-serif font-normal text-foreground')}>
            Event payload
          </h1>
          <p className="mt-2 wrap-break-word font-mono text-xs text-muted-foreground">{eventId}</p>
        </header>
        <Button variant="outline" className="shrink-0 rounded-full" asChild>
          <Link href="/admin/events">Back to domain events</Link>
        </Button>
      </div>

      {err ? (
        <Alert variant="destructive">
          <AlertTitle>Payload unavailable</AlertTitle>
          <AlertDescription>{err}</AlertDescription>
        </Alert>
      ) : null}

      {!err ? (
        <AdminStructuredDataView
          accessToken={accessToken}
          data={payloadQuery.data}
          isPending={payloadQuery.isPending}
          errorMessage={null}
        />
      ) : null}
    </div>
  )
}

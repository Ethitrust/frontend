'use client'

import { Skeleton } from '@/components/ui/skeleton'

function serialize(data: unknown): string {
  if (data === undefined || data === null) {
    return String(data)
  }
  if (typeof data === 'string') {
    return data
  }
  try {
    return JSON.stringify(data, null, 2)
  } catch {
    return String(data)
  }
}

export function AdminJsonInspect({
  data,
  isPending,
  errorMessage,
}: {
  data: unknown
  isPending?: boolean
  errorMessage?: string | null
}) {
  if (isPending) {
    return <Skeleton className="h-48 w-full" />
  }
  if (errorMessage) {
    return <p className="text-sm text-destructive">{errorMessage}</p>
  }
  return (
    <pre className="max-h-[min(70vh,560px)] overflow-auto rounded-lg border border-border bg-muted/30 p-3 font-mono text-xs whitespace-pre-wrap break-all">
      {serialize(data)}
    </pre>
  )
}

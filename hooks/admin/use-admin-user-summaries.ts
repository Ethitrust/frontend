'use client'

import { useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'

import type { AdminUserRow } from '@/lib/admin/admin-api-types'
import { fetchAdminUserSummaryById } from '@/lib/admin/admin-people-api'

export function useAdminUserSummaries(accessToken: string | undefined, userIds: readonly string[]) {
  const uniq = useMemo(() => {
    const s = new Set<string>()
    for (const raw of userIds) {
      const id = typeof raw === 'string' ? raw.trim() : ''
      if (id) s.add(id)
      if (s.size >= 48) break
    }
    return [...s]
  }, [userIds])

  const queries = useQueries({
    queries: uniq.map((userId) => ({
      queryKey: ['admin', 'user-summary', userId],
      queryFn: async () =>
        fetchAdminUserSummaryById(accessToken as string, userId).catch(() => null),
      enabled: Boolean(accessToken && userId),
      staleTime: 5 * 60_000,
    })),
  })

  const byId = useMemo(() => {
    const map: Record<string, AdminUserRow | null | undefined> = {}
    uniq.forEach((id, i) => {
      map[id] = queries[i]?.data
    })
    return map
  }, [uniq, queries])

  const pending = uniq.some((_id, i) => queries[i]?.isPending)

  const pendingById = useMemo(() => {
    const m: Record<string, boolean> = {}
    uniq.forEach((id, i) => {
      m[id] = Boolean(queries[i]?.isPending)
    })
    return m
  }, [uniq, queries])

  return { byId, pending, pendingById }
}

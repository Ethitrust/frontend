'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  postMarkAllNotificationsRead,
  postMarkNotificationsRead,
} from '@/lib/notifications/me-notifications-api'

export function useNotificationReadMutations(accessToken: string | null | undefined) {
  const queryClient = useQueryClient()

  function bumpNotifications() {
    void queryClient.invalidateQueries({ queryKey: ['me', 'notifications'] })
  }

  const markRead = useMutation({
    mutationFn: (notificationIds: string[]) => {
      if (!accessToken) throw new Error('Sign in required.')
      return postMarkNotificationsRead(accessToken, notificationIds)
    },
    onSuccess: bumpNotifications,
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : 'Could not update notification'),
  })

  const markAllRead = useMutation({
    mutationFn: () => {
      if (!accessToken) throw new Error('Sign in required.')
      return postMarkAllNotificationsRead(accessToken)
    },
    onSuccess: () => {
      bumpNotifications()
      toast.success('Marked all notifications read.')
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : 'Could not update notifications'),
  })

  return { markRead, markAllRead }
}

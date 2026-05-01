/** Shapes from `docs/apidoc.md` § notifications */

export type NotificationRow = {
  id: string
  notification_type: string
  title: string
  body: string
  data?: Record<string, unknown> | null
  is_read: boolean
  read_at?: string | null
  created_at: string
  updated_at?: string
}

export type PaginatedNotifications = {
  items: NotificationRow[]
  page: number
  page_size: number
  total: number
  unread_count: number
}

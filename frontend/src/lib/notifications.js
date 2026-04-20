import { getUnreadNotificationCountForUser } from './mockUserNotifications'
import { getSession } from './session'

/** @deprecated Use NotificationBell + mock_user notifications; kept for compatibility. */
export async function fetchUnreadNotificationCount() {
  await new Promise((r) => setTimeout(r, 40))
  const s = getSession()
  if (!s?.userId) return 0
  return getUnreadNotificationCountForUser(s.userId)
}

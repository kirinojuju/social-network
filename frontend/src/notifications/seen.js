// When the member last looked at notifications, kept in this browser only.
const storageKey = uid => `uniconnect:notifications-seen:${uid}`
const defaultStorage = () => globalThis.localStorage

export function loadSeenAt(uid, storage = defaultStorage()) {
  try {
    const value = storage.getItem(storageKey(uid))
    return value && Number.isFinite(Date.parse(value)) ? value : null
  } catch {
    return null
  }
}

export function saveSeenAt(uid, value, storage = defaultStorage()) {
  try {
    storage.setItem(storageKey(uid), value)
  } catch {
    // Storage can be full or disabled; the unread badge is optional.
  }
}

export const isUnread = (notification, seenAt) => notification.type === 'message'
  ? notification.unread_count > 0
  : !seenAt || Date.parse(notification.created_at) > Date.parse(seenAt)

export const unreadMessageCount = notifications => notifications.reduce((count, item) =>
  count + (item.type === 'message' ? item.unread_count : 0), 0)

// Newest time among the notifications, or the current value if nothing is newer.
export function latestSeenAt(notifications, seenAt) {
  const newest = notifications.reduce((latest, item) =>
    !latest || Date.parse(item.created_at) > Date.parse(latest) ? item.created_at : latest, null)
  return newest && (!seenAt || Date.parse(newest) > Date.parse(seenAt)) ? newest : seenAt
}

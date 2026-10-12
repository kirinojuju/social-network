// Compact, Messenger-style age of a message: "now", "5m", "3h", "2d", "4w", then a date.
export function shortTimeAgo(value, now = Date.now()) {
  const seconds = Math.max(0, Math.floor((now - new Date(value).getTime()) / 1000))
  if (seconds < 60) return 'now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`
  if (days < 28) return `${Math.floor(days / 7)}w`
  return new Date(value).toLocaleDateString()
}

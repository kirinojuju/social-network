import { useEffect, useRef } from 'react'
import { startAutoRefresh } from './auto-refresh'

export function useAutoRefresh(refresh, intervalMs, enabled = true, refreshKey = null) {
  const latest = useRef(refresh)
  useEffect(() => { latest.current = refresh }, [refresh])
  useEffect(() => {
    if (!enabled) return
    return startAutoRefresh(signal => latest.current(signal), { intervalMs, immediate: refreshKey !== null })
  }, [intervalMs, enabled, refreshKey])
}

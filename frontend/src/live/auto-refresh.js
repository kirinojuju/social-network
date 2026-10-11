// Poll only while the page is visible. Focus/network recovery also trigger a
// check. One request at a time; cleanup cancels any request still in progress.
export function startAutoRefresh(refresh, {
  intervalMs = 10000,
  immediate = false,
  documentObject = document,
  windowObject = window,
  setTimer = setTimeout,
  clearTimer = clearTimeout,
} = {}) {
  const controller = new AbortController()
  let stopped = false
  let running = false
  let timer = null

  function clear() {
    if (timer !== null) clearTimer(timer)
    timer = null
  }

  function schedule() {
    if (!stopped && !documentObject.hidden) timer = setTimer(run, intervalMs)
  }

  async function run() {
    clear()
    if (stopped || running || documentObject.hidden) return
    running = true
    try { await refresh(controller.signal) }
    catch { /* Keep the current data; the next check retries transient failures. */ }
    finally { running = false; schedule() }
  }

  function wake() {
    if (documentObject.hidden) clear()
    else void run()
  }

  documentObject.addEventListener('visibilitychange', wake)
  windowObject.addEventListener('focus', wake)
  windowObject.addEventListener('online', wake)
  if (immediate) void run()
  else schedule()
  return () => {
    stopped = true
    clear()
    controller.abort()
    documentObject.removeEventListener('visibilitychange', wake)
    windowObject.removeEventListener('focus', wake)
    windowObject.removeEventListener('online', wake)
  }
}

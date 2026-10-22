import { useCallback, useEffect, useRef, useState } from 'react'
import { apiErrorMessage } from './api'

/** Adds `.in` to every `.reveal` element as it scrolls into view. */
export function useRevealAll(deps: unknown[] = []) {
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('.reveal:not(.in)'))
    if (!nodes.length) return
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const noAnim = document.documentElement.hasAttribute('data-no-animations')
    if (reduced || noAnim || typeof IntersectionObserver === 'undefined') {
      nodes.forEach((n) => n.classList.add('in'))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in')
            io.unobserve(e.target)
          }
        })
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    )
    nodes.forEach((n) => io.observe(n))
    return () => io.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

/** Generic resource loader for GET-style API calls. */
export function useApi<T>(
  fetcher: () => Promise<{ data: unknown }>,
  deps: unknown[],
  options: { validate?: (data: unknown) => boolean } = {},
) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [nonce, setNonce] = useState(0)
  const validateRef = useRef(options.validate)
  validateRef.current = options.validate

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetcher()
      .then((res) => {
        if (cancelled) return
        const payload = res?.data
        if (validateRef.current && !validateRef.current(payload)) {
          setData(null)
          setError(
            'The API responded with an unexpected payload. This endpoint is currently degraded on the server.',
          )
          return
        }
        setData(payload as T)
      })
      .catch((err) => {
        if (cancelled) return
        setData(null)
        setError(apiErrorMessage(err))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce])

  const reload = useCallback(() => setNonce((n) => n + 1), [])

  return { data, error, loading, reload, setData }
}

export function useDebounced<T>(value: T, delay = 280): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(t)
  }, [value, delay])
  return debounced
}

/** State mirrored into the URL query string (e.g. ?tab=expiry). */
export function useQueryParam(key: string, fallback: string): [string, (v: string) => void] {
  const params = new URLSearchParams(window.location.search)
  const current = params.get(key) || fallback
  const set = useCallback(
    (v: string) => {
      const next = new URLSearchParams(window.location.search)
      if (v && v !== fallback) next.set(key, v)
      else next.delete(key)
      const qs = next.toString()
      window.history.replaceState(null, '', window.location.pathname + (qs ? `?${qs}` : ''))
      window.dispatchEvent(new PopStateEvent('popstate'))
    },
    [key, fallback],
  )
  const [value, setValue] = useState(current)
  useEffect(() => {
    const onPop = () => {
      const p = new URLSearchParams(window.location.search)
      setValue(p.get(key) || fallback)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [key, fallback])
  useEffect(() => {
    setValue(current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [window.location.search])
  return [value, set]
}

export function useOnClickOutside(ref: React.RefObject<HTMLElement | null>, handler: () => void) {
  useEffect(() => {
    const listener = (e: MouseEvent | TouchEvent) => {
      const el = ref.current
      if (!el || el.contains(e.target as Node)) return
      handler()
    }
    document.addEventListener('mousedown', listener)
    document.addEventListener('touchstart', listener)
    return () => {
      document.removeEventListener('mousedown', listener)
      document.removeEventListener('touchstart', listener)
    }
  }, [ref, handler])
}

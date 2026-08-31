'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import type { ReadonlyURLSearchParams } from 'next/navigation'

type UseDebouncedUrlSearchOptions = {
  searchParams: ReadonlyURLSearchParams
  pathname: string
  router: AppRouterInstance
  param?: string
  debounceMs?: number
}

/**
 * Controlled search input with debounced committed value.
 * URL updates never overwrite the input while typing — own router.replace calls
 * are ignored via an internal ref (back/forward still syncs).
 */
export function useDebouncedUrlSearch({
  searchParams,
  pathname,
  router,
  param = 'q',
  debounceMs = 300,
}: UseDebouncedUrlSearchOptions) {
  const skipUrlSyncRef = useRef(false)
  const initial = searchParams.get(param) ?? ''

  const [searchInput, setSearchInput] = useState(initial)
  const [search, setSearch] = useState(() => initial.trim())

  const writeUrl = useCallback(
    (committed: string, mutateParams?: (params: URLSearchParams) => void) => {
      skipUrlSyncRef.current = true
      const params = new URLSearchParams(searchParams.toString())
      const trimmed = committed.trim()
      if (trimmed) params.set(param, trimmed)
      else params.delete(param)
      mutateParams?.(params)
      const qs = params.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [searchParams, pathname, router, param],
  )

  useEffect(() => {
    if (skipUrlSyncRef.current) {
      skipUrlSyncRef.current = false
      return
    }
    const q = searchParams.get(param) ?? ''
    const committed = q.trim()
    setSearchInput((prev) => (prev === q ? prev : q))
    setSearch((prev) => (prev === committed ? prev : committed))
  }, [searchParams, param])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const committed = searchInput.trim()
      setSearch((prev) => (prev === committed ? prev : committed))
    }, debounceMs)
    return () => window.clearTimeout(timer)
  }, [searchInput, debounceMs])

  const commitNow = useCallback(() => {
    const committed = searchInput.trim()
    setSearch(committed)
    return committed
  }, [searchInput])

  const reset = useCallback(() => {
    setSearchInput('')
    setSearch('')
  }, [])

  return {
    searchInput,
    setSearchInput,
    search,
    setSearch,
    writeUrl,
    commitNow,
    reset,
  }
}

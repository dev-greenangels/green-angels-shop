import 'server-only'

import { cookies } from 'next/headers'

import { getBackendApiUrl } from '@/lib/api/backend-url'

async function resolveCookieHeader(request?: Request): Promise<string | null> {
  const fromRequest = request?.headers.get('cookie')?.trim()
  if (fromRequest) return fromRequest

  const store = await cookies()
  const parts = store.getAll().map((item) => `${item.name}=${item.value}`)
  return parts.length ? parts.join('; ') : null
}

export async function fetchBackend(
  path: string,
  init?: RequestInit & { request?: Request },
): Promise<Response> {
  const headers = new Headers(init?.headers)
  const cookie = await resolveCookieHeader(init?.request)
  if (cookie) headers.set('cookie', cookie)

  const { request: _request, ...fetchInit } = init ?? {}

  return fetch(`${getBackendApiUrl()}${path}`, {
    ...fetchInit,
    headers,
    cache: 'no-store',
  })
}

export async function readBackendJson<T>(response: Response): Promise<T> {
  return (await response.json().catch(() => ({}))) as T
}

export function forwardBackendCookies(backendResponse: Response, response: Response): void {
  const setCookies =
    typeof backendResponse.headers.getSetCookie === 'function'
      ? backendResponse.headers.getSetCookie()
      : []

  for (const cookie of setCookies) {
    response.headers.append('set-cookie', cookie)
  }
}

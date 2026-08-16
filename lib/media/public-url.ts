/**
 * Public media hostname (Cloudflare → R2). Not a secret — NEXT_PUBLIC so the
 * browser can load product images without going through Nest.
 * Same value as backend R2_PUBLIC_BASE_URL, e.g. https://media.example.com
 */
export function getPublicMediaBaseUrl(): string | null {
  const configured =
    process.env.NEXT_PUBLIC_MEDIA_BASE_URL?.trim() ||
    process.env.R2_PUBLIC_BASE_URL?.trim()
  if (!configured) return null
  return configured.replace(/\/+$/, '')
}

export function toPublicMediaUrl(storedUrl: string | null | undefined): string {
  const trimmed = storedUrl?.trim() || ''
  if (!trimmed) return trimmed
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (!trimmed.startsWith('/uploads/')) return trimmed
  const base = getPublicMediaBaseUrl()
  if (!base) return trimmed
  return `${base}${trimmed}`
}

/** Production Google indexing is opt-in. Coolify/HostPro preview often has NODE_ENV=production. */

export function isIndexingAllowed(input?: {
  allowIndexing?: string | null
  nodeEnv?: string | null
  origin?: string | null
}): boolean {
  const flag = (input?.allowIndexing ?? process.env.GA_ALLOW_INDEXING ?? '').trim() === 'true'
  const nodeEnv = input?.nodeEnv ?? process.env.NODE_ENV ?? 'development'
  const origin = (input?.origin ?? '').replace(/\/$/, '')

  if (!flag || nodeEnv !== 'production' || !origin) return false

  try {
    const host = new URL(origin).hostname.toLowerCase()
    if (!host || host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local')) {
      return false
    }
  } catch {
    return false
  }

  return true
}

export function previewRobotsDirective(): { index: false; follow: false } {
  return { index: false, follow: false }
}

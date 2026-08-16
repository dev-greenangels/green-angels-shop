import { open } from 'fs/promises'
import path from 'path'

import { NextResponse } from 'next/server'

import { getUploadRoot } from '@/lib/media/config'

/**
 * Local-dev fallback when public/uploads is missing and MEDIA_DRIVER=local.
 * Production storefront loads media from NEXT_PUBLIC_MEDIA_BASE_URL (Cloudflare → R2).
 */
export const runtime = 'nodejs'

const MIME: Record<string, string> = {
  webp: 'image/webp',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
}

function cacheControlFor(segments: string[]): string {
  if (segments[0] === 'products') {
    return 'public, max-age=31536000, immutable'
  }
  return 'public, max-age=86400, must-revalidate'
}

/**
 * Fallback when public/uploads symlink is missing.
 * Prefer static files from public/uploads (see next.config — no rewrite).
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const segments = (await context.params).path
  if (!segments?.length) {
    return new NextResponse('Not Found', { status: 404 })
  }
  if (segments.some((segment) => segment === '..' || segment.includes('\0'))) {
    return new NextResponse('Bad Request', { status: 400 })
  }

  const root = getUploadRoot()
  const filePath = path.join(root, ...segments)
  const normalized = path.normalize(filePath)
  const rootWithSep = root.endsWith(path.sep) ? root : `${root}${path.sep}`
  if (!normalized.startsWith(rootWithSep) && normalized !== root) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  try {
    const handle = await open(normalized, 'r')
    const info = await handle.stat()
    if (!info.isFile()) {
      await handle.close()
      return new NextResponse('Not Found', { status: 404 })
    }

    const ext = path.extname(normalized).slice(1).toLowerCase()
    const stream = handle.readableWebStream({ autoClose: true })

    return new NextResponse(stream, {
      headers: {
        'Content-Type': MIME[ext] || 'application/octet-stream',
        'Content-Length': String(info.size),
        'Cache-Control': cacheControlFor(segments),
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch {
    return new NextResponse('Not Found', { status: 404 })
  }
}

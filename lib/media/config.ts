import path from 'path'

/** Публічний URL-префікс (nginx / Next static). */
export const PUBLIC_UPLOAD_PREFIX = '/uploads'

/**
 * Корінь файлової системи для завантажень.
 * Monorepo default: ../data/uploads (green-angels-project/data/uploads).
 * Docker / VPS: UPLOAD_ROOT на зовнішній volume, напр. /data/uploads.
 * Vercel prod: NEXT_PUBLIC_MEDIA_BASE_URL (same as R2_PUBLIC_BASE_URL).
 * Writes go Nest → R2 / disk; this helper only maps stored `/uploads/...` paths.
 */
export function getUploadRoot(): string {
  const configured = process.env.UPLOAD_ROOT?.trim()
  if (configured) return path.resolve(configured)
  return path.resolve(path.join(process.cwd(), '..', 'data', 'uploads'))
}

export function uploadUrlToAbsolutePath(urlPath: string): string {
  const normalized = urlPath.startsWith('/') ? urlPath.slice(1) : urlPath
  const prefix = PUBLIC_UPLOAD_PREFIX.slice(1)
  if (!normalized.startsWith(`${prefix}/`)) {
    throw new Error('Некоректний шлях завантаження.')
  }
  const relative = normalized.slice(prefix.length + 1)
  return path.join(getUploadRoot(), relative)
}

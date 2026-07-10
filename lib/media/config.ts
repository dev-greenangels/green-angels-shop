import path from 'path'

/** Публічний URL-префікс (nginx / Next static). */
export const PUBLIC_UPLOAD_PREFIX = '/uploads'

/**
 * Корінь файлової системи для завантажень.
 * Локально: public/uploads у проєкті магазину.
 * VPS HostPro: змінна UPLOAD_ROOT на зовнішній volume, напр. /var/www/green-angels/data/uploads
 * з симлінком public/uploads → цей шлях.
 */
export function getUploadRoot(): string {
  const configured = process.env.UPLOAD_ROOT?.trim()
  if (configured) return path.resolve(configured)
  return path.join(process.cwd(), 'public', 'uploads')
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

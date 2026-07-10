const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/jpg',
  'image/pjpeg',
  'image/png',
  'image/webp',
  'image/gif',
])

const ALLOWED_EXT = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif'])

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024

export function getImageExtension(file: File): string | null {
  const mime = file.type?.toLowerCase()
  if (mime && ALLOWED_MIME.has(mime)) {
    const part = mime.split('/')[1]?.replace('jpeg', 'jpg').replace('pjpeg', 'jpg')
    return part || null
  }

  const ext = file.name.split('.').pop()?.toLowerCase()
  if (!ext || !ALLOWED_EXT.has(ext)) return null
  return ext === 'jpeg' ? 'jpg' : ext
}

export function validateImageFile(file: File): string | null {
  if (!getImageExtension(file)) {
    return 'Дозволені формати: JPG, PNG, WebP, GIF.'
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return 'Максимальний розмір файлу — 8 МБ.'
  }
  if (file.size === 0) {
    return 'Файл порожній.'
  }
  return null
}

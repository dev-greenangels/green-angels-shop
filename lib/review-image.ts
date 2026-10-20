export const REVIEW_IMAGE_PATH_REGEX =
  /^\/uploads\/reviews\/(?:[a-f0-9-]+\.(jpg|jpeg|png|webp|gif)|[a-f0-9-]+\/main\.webp)$/i

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/jpg',
  'image/pjpeg',
  'image/png',
  'image/webp',
])

const ALLOWED_EXT = new Set(['jpg', 'jpeg', 'png', 'webp'])

/** Token-scoped upload: JPG/PNG/WebP only (no GIF). */
export function getReviewImageExtension(file: File): string | null {
  const mime = file.type?.toLowerCase()
  if (mime && ALLOWED_MIME.has(mime)) {
    const part = mime.split('/')[1]?.replace('jpeg', 'jpg').replace('pjpeg', 'jpg')
    return part || null
  }

  const ext = file.name.split('.').pop()?.toLowerCase()
  if (!ext || !ALLOWED_EXT.has(ext)) return null
  return ext === 'jpeg' ? 'jpg' : ext
}

export function validateReviewImageFile(file: File): string | null {
  if (!getReviewImageExtension(file)) {
    return 'Дозволені формати: JPG, PNG, WebP.'
  }
  const maxBytes = 5 * 1024 * 1024
  if (file.size > maxBytes) {
    return 'Максимальний розмір файлу — 5 МБ.'
  }
  if (file.size === 0) {
    return 'Файл порожній.'
  }
  return null
}

/** JWT leave-review still allows GIF for legacy parity. */
export function validateReviewImageFileWithGif(file: File): string | null {
  const mime = file.type?.toLowerCase()
  const ext = file.name.split('.').pop()?.toLowerCase()
  const okMime =
    mime &&
    ['image/jpeg', 'image/jpg', 'image/pjpeg', 'image/png', 'image/webp', 'image/gif'].includes(
      mime,
    )
  const okExt = ext && ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)
  if (!okMime && !okExt) {
    return 'Дозволені формати: JPG, PNG, WebP, GIF.'
  }
  const maxBytes = 5 * 1024 * 1024
  if (file.size > maxBytes) {
    return 'Максимальний розмір файлу — 5 МБ.'
  }
  if (file.size === 0) {
    return 'Файл порожній.'
  }
  return null
}

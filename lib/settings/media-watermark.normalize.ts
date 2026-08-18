import { DEFAULT_MEDIA_WATERMARK_SETTINGS } from '@/lib/settings/defaults'
import type { MediaWatermarkSettings } from '@/lib/settings/types'

export function normalizeMediaWatermarkSettings(
  raw?: Partial<MediaWatermarkSettings> | null,
): MediaWatermarkSettings {
  return {
    productPhotosEnabled:
      typeof raw?.productPhotosEnabled === 'boolean'
        ? raw.productPhotosEnabled
        : DEFAULT_MEDIA_WATERMARK_SETTINGS.productPhotosEnabled,
    freshPhotosEnabled:
      typeof raw?.freshPhotosEnabled === 'boolean'
        ? raw.freshPhotosEnabled
        : DEFAULT_MEDIA_WATERMARK_SETTINGS.freshPhotosEnabled,
  }
}

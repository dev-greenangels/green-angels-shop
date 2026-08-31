import { getLocale, getTranslations } from 'next-intl/server'

import { getStoreMapsEmbedUrl, resolveStoreMapsHref } from '@/lib/settings/store-helpers'
import type { StoreContactSettings } from '@/lib/settings/types'
import { cn } from '@/lib/utils'

type StoreLocationMapProps = {
  store: StoreContactSettings
  className?: string
  title?: string
}

export async function StoreLocationMap({
  store,
  className,
  title,
}: StoreLocationMapProps) {
  const locale = await getLocale()
  const t = await getTranslations('contactsPage')
  const embedUrl = getStoreMapsEmbedUrl(store, locale)
  const mapsUrl = resolveStoreMapsHref(store)
  const mapTitle = title?.trim() || t('mapTitle')

  if (!embedUrl) return null

  return (
    <div className={cn('overflow-hidden rounded-xl border border-border/60 bg-background/70', className)}>
      <iframe
        title={mapTitle}
        src={embedUrl}
        className="aspect-[16/10] w-full border-0 md:aspect-[21/9]"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
      {mapsUrl ? (
        <p className="border-t border-border/60 bg-muted/30 px-4 py-2 text-center text-xs text-muted-foreground">
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline-offset-4 hover:underline"
          >
            {t('openInMaps')}
          </a>
        </p>
      ) : null}
    </div>
  )
}

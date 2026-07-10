import { getStoreMapsEmbedUrl, getStoreMapsUrl } from '@/lib/settings/store-helpers'
import type { StoreContactSettings } from '@/lib/settings/types'
import { cn } from '@/lib/utils'

type StoreLocationMapProps = {
  store: StoreContactSettings
  className?: string
  title?: string
}

export function StoreLocationMap({
  store,
  className,
  title = 'Розташування на карті',
}: StoreLocationMapProps) {
  const embedUrl = getStoreMapsEmbedUrl(store)
  const mapsUrl = getStoreMapsUrl(store)

  if (!embedUrl) return null

  return (
    <div className={cn('overflow-hidden rounded-xl border border-border/60', className)}>
      <iframe
        title={title}
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
            Відкрити в Google Maps
          </a>
        </p>
      ) : null}
    </div>
  )
}

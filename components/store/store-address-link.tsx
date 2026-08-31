import { MapPin } from 'lucide-react'

import { resolveStoreMapsHref } from '@/lib/settings/store-helpers'
import type { StoreContactSettings } from '@/lib/settings/types'
import { cn } from '@/lib/utils'

type StoreAddressLinkProps = {
  store: Pick<StoreContactSettings, 'addressLine1' | 'addressLine2' | 'mapsUrl'>
  className?: string
  iconClassName?: string
  textClassName?: string
  linkClassName?: string
}

export function StoreAddressLink({
  store,
  className,
  iconClassName,
  textClassName,
  linkClassName,
}: StoreAddressLinkProps) {
  const mapsUrl = resolveStoreMapsHref(store)
  const addressText = (
    <>
      {store.addressLine1}
      <br />
      {store.addressLine2}
    </>
  )

  return (
    <div className={cn('flex items-start gap-3', className)}>
      <MapPin className={cn('mt-0.5 h-5 w-5 shrink-0', iconClassName)} />
      {mapsUrl ? (
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'text-sm transition-colors hover:underline underline-offset-4',
            textClassName,
            linkClassName,
          )}
        >
          {addressText}
        </a>
      ) : (
        <span className={cn('text-sm', textClassName)}>{addressText}</span>
      )}
    </div>
  )
}

import Image from 'next/image'
import { Store, Truck } from 'lucide-react'

import { cn } from '@/lib/utils'

function LogoTile({
  src,
  className,
  rounded = true,
}: {
  src: string
  className?: string
  rounded?: boolean
}) {
  return (
    <span
      className={cn(
        'relative inline-flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden bg-white',
        rounded ? 'rounded-md' : 'rounded-sm',
        className,
      )}
    >
      <Image
        src={src}
        alt=""
        width={28}
        height={28}
        className="h-7 w-7 object-contain"
        aria-hidden
      />
    </span>
  )
}

export function NovaPoshtaLogo({ className }: { className?: string }) {
  return <LogoTile src="/logos/nova-poshta.svg" className={className} rounded={false} />
}

export function PacketaLogo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'relative inline-flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-md',
        className,
      )}
    >
      <Image
        src="/logos/packeta.png"
        alt=""
        width={28}
        height={28}
        className="h-7 w-7 object-cover"
        aria-hidden
      />
    </span>
  )
}

export function GlsLogo({ className }: { className?: string }) {
  return <LogoTile src="/logos/gls.svg" className={className} rounded />
}

export function PickupStoreIcon({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary',
        className,
      )}
    >
      <Store className="h-4 w-4" aria-hidden />
    </span>
  )
}

/** Fallback for unknown carriers. */
export function CarrierTruckIcon({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary',
        className,
      )}
    >
      <Truck className="h-4 w-4" aria-hidden />
    </span>
  )
}

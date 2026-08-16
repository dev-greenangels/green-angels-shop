import Image from 'next/image'
import { Store, Truck } from 'lucide-react'

import { cn } from '@/lib/utils'

export function NovaPoshtaLogo({ className }: { className?: string }) {
  return (
    <Image
      src="/logos/nova-poshta.svg"
      alt=""
      width={24}
      height={24}
      className={cn('h-6 w-6 shrink-0', className)}
      aria-hidden
    />
  )
}

export function PickupStoreIcon({ className }: { className?: string }) {
  return <Store className={cn('h-6 w-6 shrink-0 text-primary', className)} aria-hidden />
}

/** SK/EU перевізники (Packeta, DPD) — доки немає власних логотипів. */
export function CarrierTruckIcon({ className }: { className?: string }) {
  return <Truck className={cn('h-6 w-6 shrink-0 text-primary', className)} aria-hidden />
}

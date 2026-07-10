'use client'

import { useState } from 'react'
import { PackageX } from 'lucide-react'

import { NotifyAvailabilityButton } from '@/components/product/notify-availability-button'
import { NotifyWhenAvailableModal } from '@/components/product/notify-when-available-modal'

type ProductOutOfStockBlockProps = {
  plantId: string
  plantName: string
}

export function ProductOutOfStockBlock({ plantId, plantName }: ProductOutOfStockBlockProps) {
  const [notifyOpen, setNotifyOpen] = useState(false)

  return (
    <>
      <div className="rounded-xl border border-border bg-muted/40 p-6 md:p-8">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted">
              <PackageX className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Немає в наявності</h2>
              <p className="mt-1 text-muted-foreground">
                Зараз усі розміри відсутні на складі. Підпишіться — повідомимо, коли товар з’явиться.
              </p>
            </div>
          </div>
          <NotifyAvailabilityButton
            size="lg"
            className="w-full shrink-0 sm:w-auto"
            onClick={() => setNotifyOpen(true)}
          />
        </div>
      </div>

      <NotifyWhenAvailableModal
        open={notifyOpen}
        onOpenChange={setNotifyOpen}
        plantId={plantId}
        plantName={plantName}
      />
    </>
  )
}

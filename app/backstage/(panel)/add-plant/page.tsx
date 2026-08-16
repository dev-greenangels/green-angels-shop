'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { AdminLayout } from '@/components/admin/admin-layout'
import { ProductEditor } from '@/components/backstage/product-editor'

function AddPlantFallback() {
  const tc = useTranslations('common')
  return (
    <AdminLayout>
      <div className="flex items-center justify-center gap-2 py-24 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        {tc('loading')}
      </div>
    </AdminLayout>
  )
}

function AddPlantContent() {
  const searchParams = useSearchParams()
  const returnTo = searchParams.get('returnTo') ?? undefined

  return <ProductEditor returnTo={returnTo} />
}

export default function AddPlantPage() {
  return (
    <Suspense fallback={<AddPlantFallback />}>
      <AddPlantContent />
    </Suspense>
  )
}

'use client'

import { Suspense } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { AdminLayout } from '@/components/admin/admin-layout'
import { ProductEditor } from '@/components/backstage/product-editor'

function EditProductFallback() {
  const tp = useTranslations('pages.products')
  return (
    <AdminLayout>
      <div className="flex items-center justify-center gap-2 py-24 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        {tp('loadingProduct')}
      </div>
    </AdminLayout>
  )
}

function EditProductContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const productId = typeof params.id === 'string' ? params.id : ''
  const returnTo = searchParams.get('returnTo') ?? undefined

  return <ProductEditor productId={productId} returnTo={returnTo} />
}

export default function EditProductPage() {
  return (
    <Suspense fallback={<EditProductFallback />}>
      <EditProductContent />
    </Suspense>
  )
}

'use client'

import { useParams } from 'next/navigation'

import { ProductEditor } from '@/components/backstage/product-editor'

export default function EditProductPage() {
  const params = useParams()
  const productId = typeof params.id === 'string' ? params.id : ''

  return <ProductEditor productId={productId} />
}

'use client'

import { AdminLayout } from '@/components/admin/admin-layout'
import { OrderDetailContent } from '@/components/backstage/order-detail-content'
import { useParams } from 'next/navigation'

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>()
  const orderId = params.id

  return (
    <AdminLayout>
      <OrderDetailContent orderId={orderId} />
    </AdminLayout>
  )
}

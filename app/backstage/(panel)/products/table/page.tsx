'use client'

import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'

import { AdminLayout } from '@/components/admin/admin-layout'
import { ProductsBulkTableEditor } from '@/components/backstage/products-bulk-table-editor'

function TableFallback() {
  return (
    <div className="flex items-center gap-2 py-12 text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" />
      Завантаження…
    </div>
  )
}

export default function ProductsTablePage() {
  return (
    <AdminLayout>
      <Suspense fallback={<TableFallback />}>
        <ProductsBulkTableEditor />
      </Suspense>
    </AdminLayout>
  )
}

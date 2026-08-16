'use client'

import { AdminLayout } from '@/components/admin/admin-layout'
import { TedbSettingsForm } from '@/components/backstage/tedb-settings-form'

export default function TedbBackstagePage() {
  return (
    <AdminLayout>
      <div className="space-y-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight">TEDB / ставки ПДВ</h1>
          <p className="text-sm text-muted-foreground">
            Синхронізація ставок з EU Taxes in Europe Database
          </p>
        </div>
        <TedbSettingsForm />
      </div>
    </AdminLayout>
  )
}

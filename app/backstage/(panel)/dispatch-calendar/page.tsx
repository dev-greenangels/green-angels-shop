'use client'

import { AdminLayout } from '@/components/admin/admin-layout'
import { DispatchCalendarSettingsForm } from '@/components/backstage/dispatch-calendar-settings-form'

export default function DispatchCalendarPage() {
  return (
    <AdminLayout>
      <div className="mx-auto max-w-4xl space-y-6 p-6">
        <div>
          <h1 className="font-serif text-2xl font-semibold">Календар відправок</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Дні відправки, ліміт пакування на день, свята та звіт зайнятості (як у 1С).
          </p>
        </div>
        <DispatchCalendarSettingsForm />
      </div>
    </AdminLayout>
  )
}

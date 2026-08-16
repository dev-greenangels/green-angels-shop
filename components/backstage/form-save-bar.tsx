'use client'

import { useTranslations } from 'next-intl'
import { Loader2, Save } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type FormSaveBarProps = {
  onSave: () => void
  saving?: boolean
  isDirty?: boolean
  className?: string
  label?: string
  sticky?: boolean
}

/** Always-visible save control; inactive when there is nothing to persist. */
export function FormSaveBar({
  onSave,
  saving = false,
  isDirty = false,
  className,
  label,
  sticky = false,
}: FormSaveBarProps) {
  const t = useTranslations('actions')
  const resolvedLabel = label ?? t('save')

  return (
    <div
      className={cn(
        'flex items-center justify-end gap-3',
        sticky &&
          'sticky bottom-0 z-20 -mx-4 border-t border-border/60 bg-background/90 px-4 py-3 backdrop-blur-md lg:-mx-6 lg:px-6',
        className,
      )}
    >
      <Button type="button" onClick={onSave} disabled={saving || !isDirty}>
        {saving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t('saving')}
          </>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" />
            {resolvedLabel}
          </>
        )}
      </Button>
    </div>
  )
}

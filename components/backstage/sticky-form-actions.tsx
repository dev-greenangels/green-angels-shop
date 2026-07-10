'use client'

import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

export function StickyFormActions({
  title,
  subtitle,
  onCancel,
  isLoading,
  isDirty = false,
  submitLabel,
  isPublished,
  onPublishedChange,
  tabs,
}: {
  title: string
  subtitle?: string
  onCancel: () => void
  isLoading?: boolean
  isDirty?: boolean
  submitLabel?: string
  isPublished?: boolean
  onPublishedChange?: (value: boolean) => void
  tabs?: React.ReactNode
}) {
  const t = useTranslations('actions')
  const resolvedSubmitLabel = submitLabel ?? t('save')

  return (
    <div
      className={cn(
        'sticky top-9 z-30 -mx-4 border-b border-border/60 bg-background/20 px-4 py-3 backdrop-blur-md',
        'supports-[backdrop-filter]:bg-background/80',
        'lg:-mx-6 lg:px-6'
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate font-serif text-2xl font-bold text-foreground sm:text-3xl">{title}</h1>
          {subtitle ? <p className="truncate text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:justify-end">
          {onPublishedChange !== undefined && isPublished !== undefined ? (
            <div className="flex items-center gap-2 rounded-md border border-border/60 bg-background/40 px-3 py-2">
              <Label htmlFor="isPublished" className="cursor-pointer text-sm font-medium">
                {t('published')}
              </Label>
              <Switch
                id="isPublished"
                checked={isPublished}
                onCheckedChange={onPublishedChange}
                disabled={isLoading}
              />
            </div>
          ) : null}
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            {t('cancel')}
          </Button>
          <Button type="submit" disabled={isLoading || !isDirty}>
            {isLoading ? t('saving') : resolvedSubmitLabel}
          </Button>
        </div>
      </div>
      {tabs ? <div className="mt-3 border-t border-border/50 pt-3">{tabs}</div> : null}
    </div>
  )
}

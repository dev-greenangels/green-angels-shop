'use client'

import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'

type Props = {
  page: number
  totalPages: number
  total: number
  onPrev: () => void
  onNext: () => void
}

export function AccountListPagination({
  page,
  totalPages,
  total,
  onPrev,
  onNext,
}: Props) {
  const tc = useTranslations('common')

  if (totalPages <= 1) return null

  return (
    <div className="flex flex-col gap-3 pt-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <span className="tabular-nums">
        {page} / {totalPages} · {total}
      </span>
      <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="min-h-11"
          disabled={page <= 1}
          onClick={onPrev}
        >
          {tc('back')}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="min-h-11"
          disabled={page >= totalPages}
          onClick={onNext}
        >
          {tc('next')}
        </Button>
      </div>
    </div>
  )
}

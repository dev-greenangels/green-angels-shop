'use client'

import { ChevronDown, ChevronUp, Save } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { VariantAttributeType } from '@/lib/backstage/variant-attributes'

export function VariantLabelOrderForm({
  order,
  saving,
  dirty = true,
  embedded = false,
  onChange,
  onSave,
}: {
  order: VariantAttributeType[]
  saving?: boolean
  dirty?: boolean
  embedded?: boolean
  onChange: (order: VariantAttributeType[]) => void
  onSave: () => void
}) {
  const tPages = useTranslations('pages.attributes')
  const tAttrTypes = useTranslations('variantAttributeTypes')
  const tActions = useTranslations('actions')

  const move = (index: number, direction: -1 | 1) => {
    const next = index + direction
    if (next < 0 || next >= order.length) return
    const copy = [...order]
    const [item] = copy.splice(index, 1)
    copy.splice(next, 0, item)
    onChange(copy)
  }

  const body = (
    <div className="space-y-4">
      {!embedded ? (
        <p className="text-sm text-muted-foreground">{tPages('labelOrderDesc')}</p>
      ) : null}
      <ol className="space-y-2">
        {order.map((type, index) => (
          <li
            key={type}
            className="flex items-center justify-between gap-3 rounded-lg border border-border/80 bg-muted/20 px-3 py-2.5"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-background text-xs font-medium text-muted-foreground">
                {index + 1}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium">{tAttrTypes(type)}</p>
              </div>
            </div>
            <div className="flex shrink-0 gap-1">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={index === 0}
                onClick={() => move(index, -1)}
                aria-label={tActions('moveUp')}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={index === order.length - 1}
                onClick={() => move(index, 1)}
                aria-label={tActions('moveDown')}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          </li>
        ))}
      </ol>
      <p className="text-xs text-muted-foreground">{tPages('labelOrderExample')}</p>
      <div className="flex justify-end">
        <Button type="button" size="sm" disabled={saving || !dirty} onClick={onSave}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? tActions('saving') : tActions('save')}
        </Button>
      </div>
    </div>
  )

  if (embedded) return body

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{tPages('labelOrderTitle')}</CardTitle>
        <CardDescription>{tPages('labelOrderDesc')}</CardDescription>
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  )
}

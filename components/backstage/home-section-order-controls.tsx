'use client'

import { ChevronDown, ChevronUp } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  HOME_SECTION_LABELS,
  normalizeHomeSectionOrder,
  type HomeSectionKey,
} from '@/lib/settings/home-sections'

export function HomeSectionOrderControls({
  order,
  onChange,
}: {
  order: HomeSectionKey[]
  onChange: (next: HomeSectionKey[]) => void
}) {
  const normalized = normalizeHomeSectionOrder(order)

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= normalized.length) return
    const next = [...normalized]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Порядок блоків</CardTitle>
        <CardDescription>
          Хіро-блок завжди зверху. Решту блоків можна переставляти місцями.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {normalized.map((key, index) => (
          <div
            key={key}
            className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
          >
            <span className="text-sm font-medium">{HOME_SECTION_LABELS[key]}</span>
            <div className="flex gap-1">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                disabled={index === 0}
                onClick={() => move(index, -1)}
                aria-label={`Підняти ${HOME_SECTION_LABELS[key]}`}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                disabled={index === normalized.length - 1}
                onClick={() => move(index, 1)}
                aria-label={`Опустити ${HOME_SECTION_LABELS[key]}`}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

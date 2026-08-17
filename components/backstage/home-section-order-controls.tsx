'use client'

import { ChevronDown, ChevronUp } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import {
  HOME_SECTION_LABELS,
  isHomeSectionHidden,
  normalizeHomeSectionHidden,
  normalizeHomeSectionOrder,
  setHomeSectionHidden,
  type HomeSectionKey,
} from '@/lib/settings/home-sections'

export function HomeSectionOrderControls({
  order,
  hidden,
  onChange,
}: {
  order: HomeSectionKey[]
  hidden: HomeSectionKey[]
  onChange: (next: { sectionOrder: HomeSectionKey[]; sectionHidden: HomeSectionKey[] }) => void
}) {
  const normalized = normalizeHomeSectionOrder(order)
  const sectionHidden = normalizeHomeSectionHidden(hidden)

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= normalized.length) return
    const next = [...normalized]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange({ sectionOrder: next, sectionHidden })
  }

  const setVisible = (key: HomeSectionKey, visible: boolean) => {
    onChange({
      sectionOrder: normalized,
      sectionHidden: setHomeSectionHidden(sectionHidden, key, !visible),
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Порядок блоків</CardTitle>
        <CardDescription>
          Хіро-блок завжди зверху. Решту блоків можна переставляти й вимикати. Вимкнений блок лишається
          у списку порядку.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {normalized.map((key, index) => {
          const visible = !isHomeSectionHidden(sectionHidden, key)
          return (
            <div
              key={key}
              className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
            >
              <div className="flex min-w-0 items-center gap-3">
                <Switch
                  checked={visible}
                  onCheckedChange={(next) => setVisible(key, next === true)}
                  aria-label={`Показувати ${HOME_SECTION_LABELS[key]}`}
                />
                <span className="text-sm font-medium">{HOME_SECTION_LABELS[key]}</span>
              </div>
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
          )
        })}
      </CardContent>
    </Card>
  )
}

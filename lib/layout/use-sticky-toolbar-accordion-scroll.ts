'use client'

import { useCallback, useEffect, useRef, type PointerEvent } from 'react'

import {
  scheduleAccordionItemElementScroll,
  scrollAccordionItemIntoToolbarPanel,
} from '@/lib/layout/sticky-toolbar-scroll'

export function useStickyToolbarAccordionScroll(initialOpen: string[] = []) {
  const openRef = useRef(initialOpen)

  useEffect(() => {
    openRef.current = initialOpen
  }, [initialOpen])

  const onTriggerPointerDown = useCallback((event: PointerEvent<HTMLButtonElement>) => {
    const item = event.currentTarget.closest('[data-slot="accordion-item"]')
    if (!(item instanceof HTMLElement)) return
    if (item.getAttribute('data-state') === 'open') return
    scheduleAccordionItemElementScroll(item)
  }, [])

  const onAccordionValueChange = useCallback((next: string[]) => {
    const opened = next.filter((value) => !openRef.current.includes(value))
    openRef.current = next
    for (const value of opened) {
      scrollAccordionItemIntoToolbarPanel(value)
    }
  }, [])

  return { onAccordionValueChange, onTriggerPointerDown, scheduleAccordionItemElementScroll }
}

import type { AppLocale } from '@/i18n/routing'
import type { NavigationMenuItem } from '@/lib/settings/types'
import {
  BookOpen,
  Camera,
  Heart,
  Home,
  Info,
  LayoutGrid,
  List,
  Percent,
  Sparkles,
  Star,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const ICON_MAP: Record<string, LucideIcon> = {
  Home,
  LayoutGrid,
  List,
  Percent,
  Sparkles,
  Camera,
  BookOpen,
  Star,
  Heart,
  Info,
}

export function resolveNavigationIcon(icon?: string): LucideIcon | null {
  if (!icon?.trim()) return null
  return ICON_MAP[icon] ?? null
}

export function resolveNavigationItemLabel(
  item: NavigationMenuItem,
  locale: AppLocale,
  t: (key: string) => string,
): string {
  const custom =
    item.labels?.[locale] ??
    item.labels?.uk ??
    item.labels?.en ??
    item.labels?.sk ??
    item.labels?.hu ??
    item.labels?.de
  if (custom?.trim()) return custom.trim()
  if (item.labelKey) {
    try {
      return t(item.labelKey)
    } catch {
      return item.labelKey
    }
  }
  return item.href
}

export function resolveNavigationItemHref(
  item: NavigationMenuItem,
  catalogHref: string,
): string {
  if (item.useCatalogHref) return catalogHref
  return item.href
}

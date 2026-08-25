import type { HomeStat } from '@/lib/settings/types'

/** Use CMS when customized; otherwise the locale translation (Ukrainian defaults are not copied to SK/EN/…). */
export function pickHomeCmsText(
  cms: string | undefined,
  ukDefault: string,
  translated: string,
): string {
  const value = cms?.trim() ?? ''
  if (!value || value === ukDefault.trim()) return translated
  return value
}

export function pickHomeCmsList(
  cms: string[] | undefined,
  ukDefault: string[],
  translated: string[],
): string[] {
  if (!cms?.length) return translated
  if (
    cms.length === ukDefault.length &&
    cms.every((item, index) => item.trim() === ukDefault[index]?.trim())
  ) {
    return translated
  }
  return cms
}

export function pickHomeCmsStats(
  cms: HomeStat[] | undefined,
  ukDefault: HomeStat[],
  translatedLabels: string[],
): HomeStat[] {
  const list = cms?.length ? cms : ukDefault
  const matchesDefault =
    list.length === ukDefault.length &&
    list.every(
      (item, index) =>
        item.value.trim() === ukDefault[index].value.trim() &&
        item.label.trim() === ukDefault[index].label.trim(),
    )
  if (matchesDefault) {
    return ukDefault.map((item, index) => ({
      value: item.value,
      label: translatedLabels[index] ?? item.label,
    }))
  }
  return list
}

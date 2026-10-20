export function isoToDateInput(iso: string | null | undefined): string {
  if (!iso?.trim()) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

export function formatAvailableFromDisplay(iso: string | null | undefined): string | undefined {
  if (!iso?.trim()) return undefined
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return undefined
  const day = String(date.getUTCDate()).padStart(2, '0')
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const year = date.getUTCFullYear()
  return `${day}.${month}.${year}`
}

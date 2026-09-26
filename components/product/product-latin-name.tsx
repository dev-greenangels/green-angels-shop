/** Secondary botanical Latin line under a localized product name. */
export function ProductLatinName({
  latinName,
  className = 'text-xs italic text-muted-foreground',
}: {
  latinName?: string | null
  className?: string
}) {
  const trimmed = latinName?.trim()
  if (!trimmed) return null
  return <p className={className}>{trimmed}</p>
}

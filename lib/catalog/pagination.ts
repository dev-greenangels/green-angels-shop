export function getVisiblePageNumbers(
  current: number,
  total: number,
): Array<number | 'ellipsis'> {
  if (total <= 1) return total === 1 ? [1] : []
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1)
  }

  const pages: Array<number | 'ellipsis'> = [1]

  if (current > 3) {
    pages.push('ellipsis')
  }

  const rangeStart = Math.max(2, current - 1)
  const rangeEnd = Math.min(total - 1, current + 1)
  for (let page = rangeStart; page <= rangeEnd; page += 1) {
    pages.push(page)
  }

  if (current < total - 2) {
    pages.push('ellipsis')
  }

  pages.push(total)
  return pages
}

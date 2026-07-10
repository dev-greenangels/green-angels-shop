export function getCatalogPageFromSearchParams(searchParams: URLSearchParams): number {
  return Math.max(1, Number(searchParams.get('page') ?? '1') || 1)
}

export function shouldShowCategoryFooterContent(
  footerDescription: string | null | undefined,
  options: { showProducts: boolean; currentPage: number },
): boolean {
  if (!footerDescription?.trim()) return false
  if (!options.showProducts) return true
  return options.currentPage === 1
}

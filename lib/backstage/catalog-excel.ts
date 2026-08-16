export type CatalogExcelError = {
  sheet: string
  row: number
  message: string
}

export type CatalogExcelStats = {
  created: number
  updated: number
  errors: CatalogExcelError[]
}

export const CATALOG_EXCEL_SHEETS = [
  'Categories',
  'Attributes',
  'AttributeValues',
  'Characteristics',
  'Products',
  'Variants',
] as const

export type CatalogExcelSheetKey = (typeof CATALOG_EXCEL_SHEETS)[number]
export type CatalogExcelTemplateMode = 'empty' | 'export'

export type DownloadCatalogExcelTemplateOptions = {
  mode: CatalogExcelTemplateMode
  sheets: CatalogExcelSheetKey[]
}

async function parseError(res: Response): Promise<string> {
  const data = (await res.json().catch(() => ({}))) as {
    message?: string | string[]
    error?: string
  }
  if (Array.isArray(data.message)) return data.message.join(', ')
  if (typeof data.message === 'string') return data.message
  if (typeof data.error === 'string') return data.error
  return 'Помилка запиту'
}

export async function downloadCatalogExcelTemplate(
  options: DownloadCatalogExcelTemplateOptions,
): Promise<{ blob: Blob; filename: string }> {
  const params = new URLSearchParams()
  params.set('mode', options.mode)
  params.set('sheets', options.sheets.join(','))

  const res = await fetch(`/api/backstage/catalog-excel/template?${params.toString()}`, {
    credentials: 'include',
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(await parseError(res))

  const disposition = res.headers.get('Content-Disposition')
  const matched = disposition?.match(/filename="([^"]+)"/)
  const filename =
    matched?.[1] ??
    (options.mode === 'export' ? 'catalog-export.xlsx' : 'catalog-import-template.xlsx')

  return { blob: await res.blob(), filename }
}

export async function importCatalogExcelFile(file: File): Promise<CatalogExcelStats> {
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch('/api/backstage/catalog-excel/import', {
    method: 'POST',
    credentials: 'include',
    body: formData,
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

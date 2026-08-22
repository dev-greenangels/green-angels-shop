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

export type FreshPhotoUploadInput = {
  file: File
  productId: string
  sizeId: string
  plantName: string
  plantSize: string
  barcode?: string
  sku?: string
  storageName?: string
  viberSend?: boolean
}

export async function uploadBackstageFreshPhoto(input: FreshPhotoUploadInput): Promise<{
  id: string
  url: string
}> {
  const form = new FormData()
  form.set('file', input.file)
  form.set('productId', input.productId)
  form.set('sizeId', input.sizeId)
  form.set('plantName', input.plantName)
  form.set('plantSize', input.plantSize)
  form.set('barcode', input.barcode?.trim() || '')
  form.set('sku', input.sku?.trim() || '')
  form.set('storageName', input.storageName?.trim() || '')
  form.set('viberSend', input.viberSend ? 'true' : 'false')

  const res = await fetch('/api/backstage/photos/upload', {
    method: 'POST',
    credentials: 'include',
    body: form,
  })
  if (!res.ok) throw new Error(await parseError(res))
  return (await res.json()) as { id: string; url: string }
}

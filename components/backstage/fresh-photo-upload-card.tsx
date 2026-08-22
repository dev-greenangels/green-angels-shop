'use client'

import { useRef, useState } from 'react'
import { Loader2, Upload } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from '@/lib/toast'

import {
  FreshPhotoSizePicker,
  type FreshPhotoSizeSelection,
} from '@/components/backstage/fresh-photo-size-picker'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { uploadBackstageFreshPhoto } from '@/lib/backstage/photos'

export function FreshPhotoUploadCard({ onUploaded }: { onUploaded: () => void }) {
  const t = useTranslations('photos')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [size, setSize] = useState<FreshPhotoSizeSelection | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [storageName, setStorageName] = useState('')
  const [viberSend, setViberSend] = useState(false)
  const [uploading, setUploading] = useState(false)

  const resetForm = () => {
    setFile(null)
    setStorageName('')
    setViberSend(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const onSubmit = async () => {
    if (!size) {
      toast.error(t('uploadNeedSize'))
      return
    }
    if (!file) {
      toast.error(t('uploadNeedFile'))
      return
    }
    if (!size.ean && !size.sku) {
      toast.error(t('uploadNeedIdentifier'))
      return
    }

    setUploading(true)
    try {
      await uploadBackstageFreshPhoto({
        file,
        productId: size.productId,
        sizeId: size.sizeId,
        plantName: size.productName,
        plantSize: size.sizeLabel,
        barcode: size.ean ?? undefined,
        sku: size.sku ?? undefined,
        storageName,
        viberSend,
      })
      toast.success(t('uploadSuccess'))
      resetForm()
      onUploaded()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('uploadFailed'))
    } finally {
      setUploading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('uploadTitle')}</CardTitle>
        <CardDescription>{t('uploadDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FreshPhotoSizePicker value={size} onChange={setSize} />

        <div className="space-y-2">
          <Label className="text-xs" htmlFor="fresh-photo-file">
            {t('uploadFileLabel')}
          </Label>
          <Input
            id="fresh-photo-file"
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/webp,.jpg,.jpeg,.webp"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="cursor-pointer"
          />
          <p className="text-xs text-muted-foreground">{t('uploadFileHint')}</p>
        </div>

        <div className="space-y-2">
          <Label className="text-xs" htmlFor="fresh-photo-storage">
            {t('uploadStorageLabel')}
          </Label>
          <Input
            id="fresh-photo-storage"
            value={storageName}
            onChange={(e) => setStorageName(e.target.value)}
            placeholder={t('uploadStoragePlaceholder')}
            className="h-9"
          />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={viberSend}
            onCheckedChange={(checked) => setViberSend(checked === true)}
          />
          <span>{t('uploadViberLabel')}</span>
        </label>

        <Button type="button" onClick={() => void onSubmit()} disabled={uploading}>
          {uploading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="mr-2 h-4 w-4" />
          )}
          {uploading ? t('uploadSubmitting') : t('uploadSubmit')}
        </Button>
      </CardContent>
    </Card>
  )
}

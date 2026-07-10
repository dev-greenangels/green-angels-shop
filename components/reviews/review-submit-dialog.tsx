'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { ImagePlus, Loader2, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { RequiredLabel } from '@/components/auth/auth-form-ui'
import { StarRating } from '@/components/reviews/star-rating'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { PublicSession } from '@/lib/auth/types'
import { submitReview, uploadReviewImage } from '@/lib/reviews/fetch'
import { MAX_REVIEW_IMAGES } from '@/lib/reviews/utils'
import {
  sanitizeReviewFullName,
  sanitizeReviewText,
  validateReviewFullName,
  validateReviewImages,
  validateReviewRating,
  validateReviewText,
} from '@/lib/validation/review-form'

type ReviewSubmitDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: PublicSession | null
  productId?: string
  productName?: string
  onSubmitted?: () => void
}

function buildDefaultName(user: PublicSession | null): string {
  if (!user) return ''
  return [user.lastName, user.firstName].filter(Boolean).join(' ').trim()
}

function buildSessionEmail(user: PublicSession | null): string | undefined {
  const email = user?.email?.trim() ?? ''
  return email || undefined
}

function buildSessionPhone(user: PublicSession | null): string | undefined {
  const phone = user?.phone?.trim()
  return phone || undefined
}

export function ReviewSubmitDialog({
  open,
  onOpenChange,
  user,
  productId,
  productName,
  onSubmitted,
}: ReviewSubmitDialogProps) {
  const t = useTranslations('reviews')
  const tc = useTranslations('common')
  const [authorName, setAuthorName] = useState('')
  const [rating, setRating] = useState(0)
  const [text, setText] = useState('')
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!open) return
    setAuthorName(buildDefaultName(user))
    setRating(0)
    setText('')
    setImageUrls([])
    setTouched({})
  }, [open, user])

  const errors = useMemo(
    () => ({
      authorName: touched.authorName ? validateReviewFullName(authorName) : null,
      text: touched.text ? validateReviewText(text) : null,
      rating: touched.rating ? validateReviewRating(rating) : null,
      images: touched.images ? validateReviewImages(imageUrls) : null,
    }),
    [authorName, imageUrls, rating, text, touched],
  )

  const handleImageChange = async (file: File | null) => {
    if (!file || imageUrls.length >= MAX_REVIEW_IMAGES) return
    setTouched((prev) => ({ ...prev, images: true }))

    setUploading(true)
    try {
      const url = await uploadReviewImage(file)
      setImageUrls((prev) => [...prev, url].slice(0, MAX_REVIEW_IMAGES))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('imageUploadFailed'))
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index))
    setTouched((prev) => ({ ...prev, images: true }))
  }

  const handleSubmit = async () => {
    setTouched({
      authorName: true,
      text: true,
      rating: true,
      images: true,
    })

    const fullNameError = validateReviewFullName(authorName)
    const textError = validateReviewText(text)
    const ratingError = validateReviewRating(rating)
    const imagesError = validateReviewImages(imageUrls)

    if (fullNameError || textError || ratingError || imagesError) return

    setSubmitting(true)
    try {
      await submitReview({
        authorName: authorName.trim(),
        email: buildSessionEmail(user),
        phone: buildSessionPhone(user),
        text: text.trim(),
        rating,
        productId,
        images: imageUrls.length ? imageUrls : undefined,
      })
      toast.success(t('submitSuccess'))
      onOpenChange(false)
      onSubmitted?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('submitFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  const canAddMoreImages = imageUrls.length < MAX_REVIEW_IMAGES

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {productName ? t('submitTitleFor', { name: productName }) : t('submitTitle')}
          </DialogTitle>
          <DialogDescription>
            {productName ? t('submitHintProduct') : t('submitHintGeneral')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>
              {t('ratingRequired')} <span className="text-destructive">*</span>
            </Label>
            <StarRating
              rating={rating}
              size="md"
              interactive
              showValue
              onChange={(value) => {
                setRating(value)
                setTouched((prev) => ({ ...prev, rating: true }))
              }}
            />
            {errors.rating ? <p className="text-sm text-destructive">{errors.rating}</p> : null}
          </div>

          <div className="space-y-2">
            <RequiredLabel htmlFor="review-author-name">{t('authorName')}</RequiredLabel>
            <Input
              id="review-author-name"
              value={authorName}
              onChange={(e) => setAuthorName(sanitizeReviewFullName(e.target.value))}
              onBlur={() => setTouched((prev) => ({ ...prev, authorName: true }))}
              placeholder={t('authorPlaceholder')}
              autoComplete="name"
            />
            {errors.authorName ? <p className="text-sm text-destructive">{errors.authorName}</p> : null}
          </div>

          <div className="space-y-2">
            <RequiredLabel htmlFor="review-text">{t('yourReview')}</RequiredLabel>
            <Textarea
              id="review-text"
              rows={5}
              value={text}
              onChange={(e) => setText(sanitizeReviewText(e.target.value))}
              onBlur={() => setTouched((prev) => ({ ...prev, text: true }))}
              placeholder={productName ? t('textPlaceholderProduct') : t('textPlaceholderGeneral')}
            />
            <p className="text-xs text-muted-foreground">{text.trim().length}/2000</p>
            {errors.text ? <p className="text-sm text-destructive">{errors.text}</p> : null}
          </div>

          <div className="space-y-2">
            <Label>{t('photosOptional', { max: MAX_REVIEW_IMAGES })}</Label>
            <div className="flex flex-wrap gap-2">
              {imageUrls.map((url, index) => (
                <div
                  key={`${url}-${index}`}
                  className="relative h-20 w-20 overflow-hidden rounded-lg border"
                >
                  <Image src={url} alt={t('photoN', { n: index + 1 })} fill className="object-cover" sizes="80px" />
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="absolute right-1 top-1 h-6 w-6"
                    onClick={() => removeImage(index)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}

              {canAddMoreImages ? (
                <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-[10px] text-muted-foreground transition-colors hover:bg-muted/40">
                  <ImagePlus className="h-5 w-5" />
                  <span>{tc('add')}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="sr-only"
                    disabled={uploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null
                      void handleImageChange(file)
                      e.target.value = ''
                    }}
                  />
                </label>
              ) : null}
            </div>
            {uploading ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {tc('loading')}
              </p>
            ) : null}
            {errors.images ? <p className="text-sm text-destructive">{errors.images}</p> : null}
          </div>

          <Button
            type="button"
            className="w-full"
            disabled={submitting || uploading}
            onClick={() => void handleSubmit()}
          >
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {t('submit')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

'use client'

import { useMemo, useState, type FormEvent } from 'react'
import Image from 'next/image'
import { ChevronDown, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from '@/lib/toast'

import { RequiredLabel } from '@/components/auth/auth-form-ui'
import { VariantSizeLabel } from '@/components/product/variant-size-label'
import { StarRating } from '@/components/reviews/star-rating'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Link } from '@/i18n/navigation'
import { toPublicMediaUrl } from '@/lib/media/public-url'
import { submitOrderReviewByToken } from '@/lib/reviews/fetch'
import type { ReviewRequestResolve } from '@/lib/reviews/types'
import {
  sanitizeReviewFullName,
  sanitizeReviewText,
  validateReviewFullName,
  validateReviewRating,
  validateReviewText,
} from '@/lib/validation/review-form'
import { useFormatFieldError } from '@/lib/validation/use-field-error-messages'
import { cn } from '@/lib/utils'

const NOTE_MIN = 10

type DraftLine = {
  rating: number
  text: string
  noteOpen: boolean
}

type OrderReviewRequestFormProps = {
  token: string
  initial: ReviewRequestResolve
}

export function OrderReviewRequestForm({ token, initial }: OrderReviewRequestFormProps) {
  const t = useTranslations('reviews')
  const tr = useTranslations('reviews.request')
  const fe = useFormatFieldError()

  const [authorName, setAuthorName] = useState(initial.authorNameDefault)
  const [storeRating, setStoreRating] = useState(0)
  const [storeText, setStoreText] = useState('')
  const [products, setProducts] = useState<Record<string, DraftLine>>(() => {
    const map: Record<string, DraftLine> = {}
    for (const product of initial.products) {
      map[product.productId] = { rating: 0, text: '', noteOpen: false }
    }
    return map
  })
  const [submitting, setSubmitting] = useState(false)
  const [storeDone, setStoreDone] = useState(initial.store.alreadyReviewed)
  const [productDone, setProductDone] = useState(
    () => new Set(initial.products.filter((p) => p.alreadyReviewed).map((p) => p.productId)),
  )
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [fullyDone, setFullyDone] = useState(Boolean(initial.completedAt))
  const [partialThanks, setPartialThanks] = useState(false)

  const pendingProducts = useMemo(
    () => initial.products.filter((p) => !productDone.has(p.productId)),
    [initial.products, productDone],
  )

  const overallOptional = useMemo(() => {
    if (initial.products.length === 0) return false
    if (pendingProducts.length === 0) return true
    return pendingProducts.every((product) => {
      const draft = products[product.productId]
      const note = draft?.text.trim() ?? ''
      return Boolean(draft && draft.rating >= 1 && note.length >= NOTE_MIN)
    })
  }, [initial.products.length, pendingProducts, products])

  const authorError = validateReviewFullName(authorName)

  const selectionError = useMemo(() => {
    const storeSelected = !storeDone && storeRating > 0
    const productSelected = pendingProducts.some((product) => {
      const draft = products[product.productId]
      return Boolean(draft && draft.rating > 0)
    })
    if (!storeSelected && !productSelected) return 'requestNeedSelection'
    return null
  }, [storeDone, storeRating, pendingProducts, products])

  const overallError = useMemo(() => {
    if (storeDone || overallOptional) {
      if (storeRating > 0) {
        const ratingErr = validateReviewRating(storeRating)
        if (ratingErr) return { rating: ratingErr, text: null as string | null }
        if (storeText.trim()) {
          return { rating: null, text: validateReviewText(storeText) }
        }
      }
      return { rating: null, text: null }
    }
    if (storeRating <= 0) {
      return { rating: 'reviewRatingRequired', text: null as string | null }
    }
    return {
      rating: validateReviewRating(storeRating),
      text: validateReviewText(storeText),
    }
  }, [storeDone, overallOptional, storeRating, storeText])

  const fieldErrors = useMemo(() => {
    const errors: Record<string, string | null> = {
      authorName: authorError,
      storeRating: overallError.rating,
      storeText: overallError.text,
    }
    for (const product of pendingProducts) {
      const draft = products[product.productId]
      if (!draft || draft.rating <= 0) continue
      errors[`p-${product.productId}-rating`] = validateReviewRating(draft.rating)
      if (draft.text.trim()) {
        errors[`p-${product.productId}-text`] = validateReviewText(draft.text)
      }
    }
    return errors
  }, [authorError, overallError, pendingProducts, products])

  const hasBlockingError = Object.values(fieldErrors).some(Boolean) || Boolean(selectionError)

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setTouched({ authorName: true, store: true, products: true })
    if (hasBlockingError) return

    const payload: Parameters<typeof submitOrderReviewByToken>[1] = {
      authorName: authorName.trim(),
    }

    if (!storeDone && storeRating > 0) {
      payload.store = {
        rating: storeRating,
        ...(storeText.trim() ? { text: storeText.trim() } : {}),
      }
    }

    const productLines = pendingProducts
      .filter((product) => (products[product.productId]?.rating ?? 0) > 0)
      .map((product) => {
        const draft = products[product.productId]!
        return {
          productId: product.productId,
          rating: draft.rating,
          ...(draft.text.trim() ? { text: draft.text.trim() } : {}),
        }
      })
    if (productLines.length) payload.products = productLines

    setSubmitting(true)
    try {
      const result = await submitOrderReviewByToken(token, payload)
      if (result.createdStore) setStoreDone(true)
      if (result.createdProductIds.length) {
        setProductDone((prev) => {
          const next = new Set(prev)
          for (const id of result.createdProductIds) next.add(id)
          return next
        })
      }
      if (result.fullyCompleted) {
        setFullyDone(true)
        toast.success(tr('submitSuccess'))
        return
      }
      const created =
        (result.createdStore ? 1 : 0) + result.createdProductIds.length
      if (created > 0) {
        toast.success(tr('submitSuccess'))
        setPartialThanks(true)
        // Clear submit-attempt flags so we don't show "pick a rating" after success.
        setTouched({})
        setStoreRating(0)
        setStoreText('')
        setProducts((prev) => {
          const next = { ...prev }
          for (const id of result.createdProductIds) {
            next[id] = { rating: 0, text: '', noteOpen: false }
          }
          return next
        })
      } else {
        toast.message(tr('alreadyReviewedHint'))
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : t('submitFailed')
      if (message.includes('REVIEW_REQUEST_COMPLETED') || message.includes('уже залишено')) {
        setFullyDone(true)
        return
      }
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (fullyDone) {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-4 text-center">
        <h2 className="font-serif text-2xl font-semibold text-foreground md:text-3xl">
          {tr('thankYouTitle')}
        </h2>
        <p className="text-muted-foreground">{tr('thankYouBody')}</p>
        <Button asChild size="lg">
          <Link href="/reviews">{tr('thankYouCta')}</Link>
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto flex w-full max-w-xl flex-col gap-5">
      <div className="rounded-2xl border border-border/40 bg-muted/45 px-4 py-5 shadow-sm sm:px-6 sm:py-6">
        <div className="space-y-2">
          <RequiredLabel htmlFor="order-review-author">{t('authorName')}</RequiredLabel>
          <Input
            id="order-review-author"
            value={authorName}
            onChange={(event) => setAuthorName(sanitizeReviewFullName(event.target.value))}
            onBlur={() => setTouched((prev) => ({ ...prev, authorName: true }))}
            placeholder={t('authorPlaceholder')}
            autoComplete="name"
            disabled={submitting}
            className="bg-background/90"
          />
          {touched.authorName && fieldErrors.authorName ? (
            <p className="text-sm text-destructive">{fe(fieldErrors.authorName)}</p>
          ) : null}
        </div>
      </div>

      <section className="space-y-3 rounded-2xl border border-border/40 bg-muted/45 px-4 py-5 shadow-sm sm:px-6 sm:py-6">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-foreground">
            {tr('storeTitle')}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {overallOptional && !storeDone ? tr('storeHintOptional') : tr('storeHint')}
          </p>
        </div>
        {storeDone ? (
          <div className="rounded-xl border border-border/30 bg-background/80 px-4 py-3">
            <p className="text-sm font-medium text-foreground">{tr('alreadyReviewed')}</p>
            {initial.store.existingRating ? (
              <StarRating rating={initial.store.existingRating} size="md" showValue />
            ) : null}
          </div>
        ) : (
          <div className="space-y-3 rounded-xl border border-border/30 bg-background/80 p-4">
            <StarRating
              rating={storeRating}
              size="md"
              interactive
              showValue
              onChange={setStoreRating}
            />
            {touched.store && fieldErrors.storeRating ? (
              <p className="text-sm text-destructive">{fe(fieldErrors.storeRating)}</p>
            ) : null}
            <div className="space-y-2">
              {overallOptional ? (
                <Label htmlFor="order-review-store-text">{tr('textOptional')}</Label>
              ) : (
                <RequiredLabel htmlFor="order-review-store-text">{tr('textRequired')}</RequiredLabel>
              )}
              <Textarea
                id="order-review-store-text"
                value={storeText}
                onChange={(event) =>
                  setStoreText(sanitizeReviewText(event.target.value))
                }
                placeholder={t('textPlaceholderGeneral')}
                rows={4}
                disabled={submitting}
                className="bg-background"
              />
              {touched.store && fieldErrors.storeText ? (
                <p className="text-sm text-destructive">{fe(fieldErrors.storeText)}</p>
              ) : null}
            </div>
          </div>
        )}
      </section>

      <section className="space-y-4 rounded-2xl border border-border/40 bg-muted/45 px-4 py-5 shadow-sm sm:px-6 sm:py-6">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-foreground">
            {tr('productsTitle')}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{tr('productsHint')}</p>
        </div>

        {initial.products.length === 0 ? (
          <p className="text-sm text-muted-foreground">{tr('noProducts')}</p>
        ) : (
          <div className="space-y-3">
            {initial.products.map((product) => {
              const draft = products[product.productId]
              const reviewed = productDone.has(product.productId)
              const imageSrc = product.imageUrl ? toPublicMediaUrl(product.imageUrl) : null

              return (
                <article
                  key={product.productId}
                  className={cn(
                    'space-y-3 rounded-xl border border-border/30 bg-background/85 p-4',
                    reviewed && 'opacity-80',
                  )}
                >
                  <div className="flex gap-3">
                    {imageSrc ? (
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
                        <Image src={imageSrc} alt="" fill className="object-cover" sizes="56px" />
                      </div>
                    ) : null}
                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2.5 gap-y-1">
                      <h3 className="min-w-0 font-medium text-foreground">
                        {product.productSlug ? (
                          <Link
                            href={`/product/${product.productSlug}`}
                            className="underline-offset-2 hover:underline"
                          >
                            {product.productName}
                          </Link>
                        ) : (
                          product.productName
                        )}
                      </h3>
                      {product.purchasedVariantLabels.map((label) => (
                        <VariantSizeLabel
                          key={label}
                          label={label}
                          iconName="Container"
                          className="text-sm font-medium text-muted-foreground"
                        />
                      ))}
                    </div>
                  </div>

                  {reviewed ? (
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-sm font-medium">{tr('alreadyReviewed')}</p>
                      <StarRating
                        rating={product.existingRating ?? draft?.rating ?? 0}
                        size="md"
                        showValue
                      />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                        <StarRating
                          rating={draft?.rating ?? 0}
                          size="md"
                          interactive
                          showValue
                          onChange={(rating) =>
                            setProducts((prev) => ({
                              ...prev,
                              [product.productId]: {
                                rating,
                                text: prev[product.productId]?.text ?? '',
                                noteOpen: prev[product.productId]?.noteOpen ?? false,
                              },
                            }))
                          }
                        />
                        {!draft?.noteOpen ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 shrink-0 px-2 text-primary"
                            onClick={() =>
                              setProducts((prev) => ({
                                ...prev,
                                [product.productId]: {
                                  rating: prev[product.productId]?.rating ?? 0,
                                  text: prev[product.productId]?.text ?? '',
                                  noteOpen: true,
                                },
                              }))
                            }
                          >
                            <ChevronDown className="mr-1 h-4 w-4" />
                            {tr('addProductNote')}
                          </Button>
                        ) : null}
                      </div>
                      {draft?.noteOpen ? (
                        <div className="space-y-2">
                          <Textarea
                            id={`order-review-product-${product.productId}`}
                            value={draft.text}
                            onChange={(event) =>
                              setProducts((prev) => ({
                                ...prev,
                                [product.productId]: {
                                  rating: prev[product.productId]?.rating ?? 0,
                                  noteOpen: true,
                                  text: sanitizeReviewText(event.target.value),
                                },
                              }))
                            }
                            placeholder={t('textPlaceholderProduct')}
                            rows={3}
                            disabled={submitting}
                            className="bg-background"
                            aria-label={tr('productNote')}
                          />
                          {fieldErrors[`p-${product.productId}-text`] ? (
                            <p className="text-sm text-destructive">
                              {fe(fieldErrors[`p-${product.productId}-text`]!)}
                            </p>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </section>

      {partialThanks ? (
        <div className="rounded-2xl border border-primary/25 bg-primary/5 px-4 py-3 sm:px-5">
          <p className="text-sm font-medium text-foreground">{tr('partialThanksTitle')}</p>
          <p className="mt-1 text-sm text-muted-foreground">{tr('partialThanks')}</p>
        </div>
      ) : null}

      {touched.store && selectionError ? (
        <p className="text-sm text-destructive">{tr(selectionError)}</p>
      ) : null}

      <Button type="submit" size="lg" disabled={submitting} className="w-full sm:w-auto">
        {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {partialThanks ? tr('submitMore') : tr('submit')}
      </Button>

      <p className="text-sm text-muted-foreground">{tr('moderationHint')}</p>
    </form>
  )
}

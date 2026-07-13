'use client'

import { useEffect, useState } from 'react'
import { Loader2, MessageSquareReply, Pencil, Trash2 } from 'lucide-react'
import { toast } from '@/lib/toast'

import { ReviewStoreReply } from '@/components/reviews/review-store-reply'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { updateBackstageReviewReply } from '@/lib/backstage/reviews'
import type { ReviewListItem } from '@/lib/reviews/types'

export function ReviewBackstageReplyPanel({
  review,
  onUpdated,
}: {
  review: ReviewListItem
  onUpdated: (review: ReviewListItem) => void
}) {
  const [editing, setEditing] = useState(false)
  const [authorName, setAuthorName] = useState(review.storeReply?.authorName ?? 'Зелені Янголи')
  const [text, setText] = useState(review.storeReply?.text ?? '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setAuthorName(review.storeReply?.authorName ?? 'Зелені Янголи')
    setText(review.storeReply?.text ?? '')
    setEditing(!review.storeReply)
  }, [review.id, review.storeReply])

  const handleSave = async () => {
    const trimmedText = text.trim()
    const trimmedName = authorName.trim()
    if (!trimmedText) {
      toast.error('Введіть текст відповіді.')
      return
    }
    if (trimmedName.length < 2) {
      toast.error('Вкажіть імʼя відповідального.')
      return
    }

    setSaving(true)
    try {
      const updated = await updateBackstageReviewReply(review.id, {
        authorName: trimmedName,
        text: trimmedText,
      })
      onUpdated(updated)
      setEditing(false)
      toast.success('Відповідь збережено.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не вдалося зберегти відповідь.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      const updated = await updateBackstageReviewReply(review.id, {
        authorName: review.storeReply?.authorName ?? 'Зелені Янголи',
        text: null,
      })
      onUpdated(updated)
      setText('')
      setEditing(true)
      toast.success('Відповідь видалено.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не вдалося видалити відповідь.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-lg border border-dashed border-primary/25 bg-primary/5 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-medium text-primary">
          <MessageSquareReply className="h-4 w-4" />
          Відповідь магазину
        </p>
        {review.storeReply && !editing ? (
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => setEditing(true)}>
              <Pencil className="mr-1 h-4 w-4" />
              Редагувати
            </Button>
            <Button type="button" size="sm" variant="ghost" disabled={saving} onClick={() => void handleDelete()}>
              <Trash2 className="mr-1 h-4 w-4" />
              Видалити
            </Button>
          </div>
        ) : null}
      </div>

      {review.storeReply && !editing ? (
        <ReviewStoreReply reply={review.storeReply} variant="embedded" showTime />
      ) : (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor={`reply-author-${review.id}`}>Імʼя відповідального</Label>
            <Input
              id={`reply-author-${review.id}`}
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Наприклад, Олена"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`reply-text-${review.id}`}>Текст відповіді</Label>
            <Textarea
              id={`reply-text-${review.id}`}
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Дякуємо за відгук..."
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" disabled={saving} onClick={() => void handleSave()}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Зберегти відповідь
            </Button>
            {review.storeReply ? (
              <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>
                Скасувати
              </Button>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}

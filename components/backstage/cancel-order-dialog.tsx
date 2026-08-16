'use client'

import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  fetchCancellationReasons,
  type CancellationReason,
} from '@/lib/backstage/cancellation-reasons'

export function CancelOrderDialog({
  open,
  onOpenChange,
  onConfirm,
  saving,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (payload: { cancellationReasonId: string; cancellationNote: string }) => void
  saving?: boolean
}) {
  const [reasons, setReasons] = useState<CancellationReason[]>([])
  const [reasonId, setReasonId] = useState('')
  const [note, setNote] = useState('')
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setReasonId('')
    setNote('')
    setLoadError(null)
    void fetchCancellationReasons({ activeOnly: true, source: 'ADMIN' })
      .then(setReasons)
      .catch((err) =>
        setLoadError(err instanceof Error ? err.message : 'Не вдалося завантажити причини.'),
      )
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Скасування замовлення</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {loadError ? <p className="text-sm text-destructive">{loadError}</p> : null}
          <div className="space-y-2">
            <Label>Причина</Label>
            <Select value={reasonId} onValueChange={setReasonId}>
              <SelectTrigger>
                <SelectValue placeholder="Оберіть причину" />
              </SelectTrigger>
              <SelectContent>
                {reasons.map((reason) => (
                  <SelectItem key={reason.id} value={reason.id}>
                    {reason.nameUk}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cancel-note">Коментар (опційно)</Label>
            <Textarea
              id="cancel-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Назад
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={!reasonId || saving}
            onClick={() => onConfirm({ cancellationReasonId: reasonId, cancellationNote: note })}
          >
            Скасувати замовлення
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

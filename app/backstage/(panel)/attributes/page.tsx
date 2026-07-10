'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, ListOrdered, Plus, Search, Tags } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

import { AdminLayout } from '@/components/admin/admin-layout'
import {
  VariantAttributeEditor,
  VariantAttributeListItem,
} from '@/components/backstage/variant-attribute-editor'
import { VariantAttributeValuesForm } from '@/components/backstage/variant-attribute-values-form'
import { VariantLabelOrderForm } from '@/components/backstage/variant-label-order-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  attributeTypeNeedsUnit,
  createVariantAttribute,
  createValueDraft,
  deleteVariantAttribute,
  fetchVariantAttributes,
  updateVariantAttribute,
  validateValueDraftsForType,
  valueDraftsToPayload,
  VARIANT_ATTRIBUTE_TYPES,
  type VariantAttribute,
  type VariantAttributeType,
  type ValueDraft,
} from '@/lib/backstage/variant-attributes'
import {
  fetchVariantLabelSettings,
  normalizeVariantLabelTypeOrder,
  updateVariantLabelSettings,
  DEFAULT_VARIANT_LABEL_TYPE_ORDER,
} from '@/lib/backstage/variant-label-settings'

export default function AttributesPage() {
  const tPages = useTranslations('pages.attributes')
  const tActions = useTranslations('actions')
  const tCommon = useTranslations('common')
  const tHints = useTranslations('hints')
  const tLabels = useTranslations('labels')
  const tValidation = useTranslations('validation')
  const tt = useTranslations('toast')

  const tAttrTypes = useTranslations('variantAttributeTypes')
  const tAttrTypeHints = useTranslations('variantAttributeTypeHints')

  const [items, setItems] = useState<VariantAttribute[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [listSearch, setListSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createValueType, setCreateValueType] = useState<VariantAttributeType>('UNIVERSAL')
  const [createDescription, setCreateDescription] = useState('')
  const [createUnit, setCreateUnit] = useState('')
  const [createLegacyId, setCreateLegacyId] = useState('')
  const [createValues, setCreateValues] = useState<ValueDraft[]>(() => [createValueDraft()])
  const [labelTypeOrder, setLabelTypeOrder] = useState<VariantAttributeType[]>(
    () => [...DEFAULT_VARIANT_LABEL_TYPE_ORDER],
  )
  const [labelOrderBaseline, setLabelOrderBaseline] = useState(
    () => JSON.stringify(DEFAULT_VARIANT_LABEL_TYPE_ORDER),
  )
  const [labelOrderOpen, setLabelOrderOpen] = useState(false)
  const [savingLabelOrder, setSavingLabelOrder] = useState(false)

  const labelOrderDirty = useMemo(
    () => JSON.stringify(labelTypeOrder) !== labelOrderBaseline,
    [labelTypeOrder, labelOrderBaseline],
  )

  const resetCreateForm = () => {
    setCreateName('')
    setCreateValueType('UNIVERSAL')
    setCreateDescription('')
    setCreateUnit('')
    setCreateLegacyId('')
    setCreateValues([createValueDraft()])
  }

  const formatValidationError = (code: string): string => {
    if (code === 'attributeValuesRequired') return tValidation('attributeValuesRequired')
    const [key, label] = code.split(':')
    if (key === 'rangeMinRequired') return tValidation('attributeRangeMinRequired', { label })
    if (key === 'rangeMaxInvalid') return tValidation('attributeRangeMaxInvalid', { label })
    if (key === 'numberValueRequired') return tValidation('attributeNumberValueRequired', { label })
    if (key === 'colorHexInvalid') return tValidation('attributeColorHexInvalid', { label })
    return code
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [data, labelSettings] = await Promise.all([
        fetchVariantAttributes(),
        fetchVariantLabelSettings(),
      ])
      const order = normalizeVariantLabelTypeOrder(labelSettings.labelTypeOrder)
      setLabelTypeOrder(order)
      setLabelOrderBaseline(JSON.stringify(order))
      setItems(data)
      setSelectedId((prev) => {
        if (prev && data.some((item) => item.id === prev)) return prev
        return data[0]?.id ?? null
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tt('loadFailed'))
    } finally {
      setLoading(false)
    }
  }, [tt])

  useEffect(() => {
    void load()
  }, [load])

  const filteredItems = useMemo(() => {
    const q = listSearch.trim().toLowerCase()
    if (!q) return items
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.slug.toLowerCase().includes(q) ||
        (item.legacyId?.toLowerCase().includes(q) ?? false)
    )
  }, [items, listSearch])

  const selected = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId]
  )

  const handleCreate = async () => {
    const name = createName.trim()
    if (!name) {
      toast.error(tValidation('attributeNameRequired'))
      return
    }

    const valueError = validateValueDraftsForType(createValueType, createValues)
    if (valueError) {
      toast.error(formatValidationError(valueError))
      return
    }

    const values = valueDraftsToPayload(createValues)

    setSaving(true)
    try {
      const created = await createVariantAttribute({
        name,
        valueType: createValueType,
        description: createDescription.trim() || undefined,
        unit: createUnit.trim() || undefined,
        legacyId: createLegacyId.trim() || undefined,
        values,
      })
      toast.success(tt('attributeCreated'))
      setCreateOpen(false)
      resetCreateForm()
      await load()
      setSelectedId(created.id)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tt('saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  const handleSave = async (
    attributeId: string,
    payload: {
      name: string
      slug: string
      valueType: VariantAttributeType
      description: string | null
      unit: string | null
      legacyId: string | null
      isFilterable: boolean
      participatesInLabel: boolean
      values: import('@/lib/backstage/variant-attributes').ValueDraft[]
    },
  ) => {
    const cleaned = valueDraftsToPayload(payload.values)

    if (!payload.name) {
      toast.error(tValidation('attributeNameRequired'))
      return
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(payload.slug.trim())) {
      toast.error(tValidation('attributeSlugInvalid'))
      return
    }
    if (cleaned.length === 0) {
      toast.error(tValidation('attributeValuesRequired'))
      return
    }

    const valueError = validateValueDraftsForType(payload.valueType, payload.values)
    if (valueError) {
      toast.error(formatValidationError(valueError))
      return
    }

    setSaving(true)
    try {
      const updated = await updateVariantAttribute(attributeId, {
        name: payload.name,
        slug: payload.slug.trim().toLowerCase(),
        valueType: payload.valueType,
        description: payload.description,
        unit: payload.unit,
        legacyId: payload.legacyId,
        isFilterable: payload.isFilterable,
        participatesInLabel: payload.participatesInLabel,
        values: cleaned.map((v, index) => ({
          ...v,
          sortOrder: index,
        })),
      })
      toast.success(tt('saved'))
      setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tt('saveFailed'))
      throw err
    } finally {
      setSaving(false)
    }
  }

  const handleSaveLabelOrder = async () => {
    setSavingLabelOrder(true)
    try {
      const saved = await updateVariantLabelSettings({ labelTypeOrder })
      const order = normalizeVariantLabelTypeOrder(saved.labelTypeOrder)
      setLabelTypeOrder(order)
      setLabelOrderBaseline(JSON.stringify(order))
      toast.success(tt('variantLabelOrderSaved'))
      setLabelOrderOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tt('saveFailed'))
    } finally {
      setSavingLabelOrder(false)
    }
  }

  const handleDelete = async (attributeId: string, name: string) => {
    if (!confirm(tPages('deleteConfirm', { name }))) return
    setSaving(true)
    try {
      await deleteVariantAttribute(attributeId)
      toast.success(tt('attributeDeleted'))
      setSelectedId(null)
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tt('deleteFailed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminLayout>
      <div className="flex h-[calc(100svh-10.5rem)] flex-col gap-4 overflow-hidden">
        <div className="flex shrink-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold text-foreground">{tPages('title')}</h1>
            <p className="text-muted-foreground">{tPages('subtitle')}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setLabelOrderOpen(true)}>
              <ListOrdered className="mr-2 h-4 w-4" />
              {tPages('labelOrderButton')}
            </Button>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {tActions('newAttribute')}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-1 items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            {tCommon('loading')}
          </div>
        ) : items.length === 0 ? (
          <Card className="flex flex-1 items-center justify-center">
            <CardContent className="py-16 text-center">
              <Tags className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
              <p className="text-muted-foreground">{tPages('empty')}</p>
              <Button className="mt-4" onClick={() => setCreateOpen(true)}>
                {tPages('createFirst')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[280px_1fr]">
            <Card className="flex min-h-0 flex-col overflow-hidden">
              <CardHeader className="shrink-0 pb-3">
                <CardTitle className="text-base">{tCommon('list')}</CardTitle>
                <div className="relative pt-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={listSearch}
                    onChange={(e) => setListSearch(e.target.value)}
                    placeholder={tHints('search')}
                    className="pl-9"
                  />
                </div>
              </CardHeader>
              <CardContent className="flex min-h-0 flex-1 flex-col pt-0">
                <ScrollArea className="min-h-0 flex-1 pr-2">
                  <div className="space-y-2">
                    {filteredItems.map((item) => (
                      <VariantAttributeListItem
                        key={item.id}
                        item={item}
                        active={item.id === selectedId}
                        onClick={() => setSelectedId(item.id)}
                      />
                    ))}
                    {filteredItems.length === 0 ? (
                      <p className="py-6 text-center text-sm text-muted-foreground">
                        {tCommon('nothingFound')}
                      </p>
                    ) : null}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card className="flex min-h-0 flex-col gap-0 overflow-hidden py-0">
              {selected ? (
                <>
                  <CardHeader className="shrink-0 border-b py-4">
                    <CardTitle>{selected.name}</CardTitle>
                    <CardDescription>{tPages('editHint')}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden px-6 py-4">
                    <VariantAttributeEditor
                      key={selected.id}
                      attribute={selected}
                      saving={saving}
                      onSave={(payload) => handleSave(selected.id, payload)}
                      onDelete={() => handleDelete(selected.id, selected.name)}
                    />
                  </CardContent>
                </>
              ) : (
                <CardContent className="flex flex-1 items-center justify-center py-16 text-muted-foreground">
                  {tHints('selectAttributeFromLeft')}
                </CardContent>
              )}
            </Card>
          </div>
        )}
      </div>

      <Dialog open={labelOrderOpen} onOpenChange={setLabelOrderOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{tPages('labelOrderTitle')}</DialogTitle>
            <DialogDescription>{tPages('labelOrderDialogDesc')}</DialogDescription>
          </DialogHeader>
          <VariantLabelOrderForm
            embedded
            order={labelTypeOrder}
            saving={savingLabelOrder}
            dirty={labelOrderDirty}
            onChange={setLabelTypeOrder}
            onSave={() => void handleSaveLabelOrder()}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open)
          if (!open) resetCreateForm()
        }}
      >
        <DialogContent className="flex max-h-[90vh] max-w-3xl flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>{tPages('dialogTitle')}</DialogTitle>
            <DialogDescription>{tPages('dialogDesc')}</DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
            <div className="space-y-2">
              <Label htmlFor="create-name">{tLabels('nameRequired')}</Label>
              <Input
                id="create-name"
                placeholder={tHints('attributeName')}
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-type">{tPages('attributeType')} *</Label>
              <Select
                value={createValueType}
                onValueChange={(v) => {
                  setCreateValueType(v as VariantAttributeType)
                  setCreateValues([createValueDraft()])
                }}
              >
                <SelectTrigger id="create-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VARIANT_ATTRIBUTE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {tAttrTypes(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{tAttrTypeHints(createValueType)}</p>
            </div>
            {attributeTypeNeedsUnit(createValueType) ? (
              <div className="space-y-2">
                <Label htmlFor="create-unit">{tLabels('unit')}</Label>
                <Input
                  id="create-unit"
                  value={createUnit}
                  onChange={(e) => setCreateUnit(e.target.value)}
                  placeholder={tHints('unitPlaceholder')}
                />
                <p className="text-xs text-muted-foreground">{tHints('optional')}</p>
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="create-desc">{tLabels('description')}</Label>
              <Textarea
                id="create-desc"
                value={createDescription}
                onChange={(e) => setCreateDescription(e.target.value)}
                rows={2}
                placeholder={tHints('attributeDescriptionPlaceholder')}
                className="resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-legacy">{tLabels('legacyId')}</Label>
              <Input
                id="create-legacy"
                value={createLegacyId}
                onChange={(e) => setCreateLegacyId(e.target.value)}
                placeholder={tHints('optional')}
              />
            </div>
            <VariantAttributeValuesForm
              valueType={createValueType}
              unit={createUnit}
              values={createValues}
              onValuesChange={setCreateValues}
              showSearch={false}
            />
          </div>
          <DialogFooter className="shrink-0 border-t pt-4">
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              {tActions('cancel')}
            </Button>
            <Button type="button" disabled={saving} onClick={() => void handleCreate()}>
              {saving ? tActions('creating') : tActions('create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}

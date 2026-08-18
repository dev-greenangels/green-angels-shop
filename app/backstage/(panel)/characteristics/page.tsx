'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, Plus, Search, SlidersHorizontal, Table2 } from 'lucide-react'
import { toast } from '@/lib/toast'
import { useTranslations } from 'next-intl'

import { AdminLayout } from '@/components/admin/admin-layout'
import { useBackstageContentLocale } from '@/components/backstage/backstage-content-locale'
import { ContentLocaleBanner, ContentLocaleLabel } from '@/components/backstage/content-locale-banner'
import { CharacteristicsBulkEditor } from '@/components/backstage/characteristics-bulk-editor'
import {
  CharacteristicEditor,
  CharacteristicListItem,
  CreateCharacteristicFields,
  parseCharacteristicOptionsText,
} from '@/components/backstage/characteristic-editor'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  createCharacteristic,
  deleteCharacteristic,
  fetchCharacteristicDefinitions,
  updateCharacteristic,
  type CharacteristicDefinition,
} from '@/lib/backstage/characteristics'

export default function CharacteristicsPage() {
  const tPages = useTranslations('pages.characteristics')
  const tActions = useTranslations('actions')
  const tCommon = useTranslations('common')
  const tHints = useTranslations('hints')
  const tValidation = useTranslations('validation')
  const tt = useTranslations('toast')
  const { locale: contentLocale, ready: contentLocaleReady } = useBackstageContentLocale()

  const [items, setItems] = useState<CharacteristicDefinition[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [listSearch, setListSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createValueType, setCreateValueType] =
    useState<CharacteristicDefinition['valueType']>('SELECT')
  const [createUnit, setCreateUnit] = useState('')
  const [createFilterable, setCreateFilterable] = useState(true)
  const [createOptionsText, setCreateOptionsText] = useState('')
  const [bulkOpen, setBulkOpen] = useState(false)

  const load = useCallback(async () => {
    if (!contentLocaleReady) return
    setLoading(true)
    try {
      const data = await fetchCharacteristicDefinitions({ locale: contentLocale })
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
  }, [tt, contentLocale, contentLocaleReady])

  useEffect(() => {
    void load()
  }, [load])

  const filteredItems = useMemo(() => {
    const q = listSearch.trim().toLowerCase()
    if (!q) return items
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(q) || item.slug.toLowerCase().includes(q),
    )
  }, [items, listSearch])

  const selected = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId],
  )

  const handleCreate = async () => {
    const name = createName.trim()
    if (!name) {
      toast.error(tValidation('characteristicNameRequired'))
      return
    }

    const needsOptions = createValueType === 'SELECT' || createValueType === 'MULTI_SELECT'
    const options = parseCharacteristicOptionsText(createOptionsText)
    if (needsOptions && options.length === 0) {
      toast.error(tValidation('characteristicOptionsRequired'))
      return
    }

    setSaving(true)
    try {
      const created = await createCharacteristic({
        name,
        valueType: createValueType,
        unit: createUnit.trim() || undefined,
        isFilterable: createFilterable,
        options: needsOptions ? options : undefined,
      }, contentLocale)
      toast.success(tt('characteristicCreated'))
      setCreateOpen(false)
      setCreateName('')
      setCreateValueType('SELECT')
      setCreateUnit('')
      setCreateFilterable(true)
      setCreateOptionsText('')
      await load()
      setSelectedId(created.id)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tt('saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  const handleSave = async (
    characteristicId: string,
    payload: {
      name: string
      valueType: CharacteristicDefinition['valueType']
      unit: string | null
      isFilterable: boolean
      showOnProductPage: boolean
      icon: string | null
      options: Array<{ key: string; id?: string; label: string; slug: string }>
    },
  ) => {
    if (!payload.name) {
      toast.error(tValidation('characteristicNameRequired'))
      return
    }

    setSaving(true)
    try {
      const selectedItem = items.find((item) => item.id === characteristicId)
      const showOptions =
        payload.valueType === 'SELECT' || payload.valueType === 'MULTI_SELECT'

      const updated = await updateCharacteristic(characteristicId, {
        name: payload.name,
        valueType: payload.valueType !== selectedItem?.valueType ? payload.valueType : undefined,
        unit: payload.unit,
        isFilterable: payload.isFilterable,
        showOnProductPage: payload.showOnProductPage,
        icon: payload.icon,
        ...(showOptions
          ? {
              options: payload.options.map((row, index) => ({
                id: row.id,
                label: row.label.trim(),
                slug: row.slug.trim() || undefined,
                sortOrder: index,
              })),
            }
          : {}),
      }, contentLocale)
      toast.success(tt('saved'))
      setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tt('saveFailed'))
      throw err
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (characteristicId: string, name: string) => {
    if (!confirm(tPages('deleteConfirm', { name }))) return
    setSaving(true)
    try {
      await deleteCharacteristic(characteristicId)
      toast.success(tt('characteristicDeleted'))
      setSelectedId(null)
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tt('deleteFailed'))
    } finally {
      setSaving(false)
    }
  }

  if (bulkOpen && items.length > 0) {
    return (
      <AdminLayout>
        <CharacteristicsBulkEditor characteristics={items} onClose={() => setBulkOpen(false)} />
      </AdminLayout>
    )
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
            {items.length > 0 ? (
              <Button type="button" variant="outline" onClick={() => setBulkOpen(true)}>
                <Table2 className="mr-2 h-4 w-4" />
                {tPages('bulkEditProducts')}
              </Button>
            ) : null}
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {tActions('newCharacteristic')}
            </Button>
          </div>
        </div>
        <ContentLocaleBanner />

        {loading ? (
          <div className="flex flex-1 items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            {tCommon('loading')}
          </div>
        ) : items.length === 0 ? (
          <Card className="flex flex-1 items-center justify-center">
            <CardContent className="py-16 text-center">
              <SlidersHorizontal className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
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
                      <CharacteristicListItem
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

            <Card className="flex h-full min-h-0 flex-col overflow-hidden">
              {selected ? (
                <>
                  <CardHeader className="shrink-0 pb-3">
                    <CardTitle>{selected.name}</CardTitle>
                    <CardDescription>{tPages('slugHint')}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex min-h-0 flex-1 flex-col px-6 pb-4 pt-0">
                    <CharacteristicEditor
                      key={selected.id}
                      definition={selected}
                      saving={saving}
                      onSave={(payload) => handleSave(selected.id, payload)}
                      onDelete={() => handleDelete(selected.id, selected.name)}
                    />
                  </CardContent>
                </>
              ) : (
                <CardContent className="flex flex-1 items-center justify-center py-16 text-muted-foreground">
                  {tHints('selectCharacteristicFromLeft')}
                </CardContent>
              )}
            </Card>
          </div>
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{tPages('dialogTitle')}</DialogTitle>
            <DialogDescription>{tPages('dialogDesc')}</DialogDescription>
          </DialogHeader>
          <CreateCharacteristicFields
            name={createName}
            valueType={createValueType}
            unit={createUnit}
            isFilterable={createFilterable}
            optionsText={createOptionsText}
            onNameChange={setCreateName}
            onValueTypeChange={setCreateValueType}
            onUnitChange={setCreateUnit}
            onFilterableChange={setCreateFilterable}
            onOptionsTextChange={setCreateOptionsText}
          />
          <DialogFooter>
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

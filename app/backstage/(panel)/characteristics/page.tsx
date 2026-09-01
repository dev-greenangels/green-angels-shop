'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Loader2, Plus, Save, Search, SlidersHorizontal, Table2, Trash2 } from 'lucide-react'
import { toast } from '@/lib/toast'
import { useTranslations } from 'next-intl'

import { AdminLayout } from '@/components/admin/admin-layout'
import { useBackstageContentLocale, useContentLocaleSwitchSave } from '@/components/backstage/backstage-content-locale'
import { ContentLocaleBanner, ContentLocaleLabel } from '@/components/backstage/content-locale-banner'
import { CharacteristicsBulkEditor } from '@/components/backstage/characteristics-bulk-editor'
import {
  CharacteristicEditor,
  CharacteristicListItem,
  CreateCharacteristicFields,
  createOptionDraft,
  type CharacteristicEditorActions,
  type CharacteristicOptionDraft,
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
  const [createOptions, setCreateOptions] = useState<CharacteristicOptionDraft[]>([])
  const editorActionsRef = useRef<CharacteristicEditorActions | null>(null)
  const [editorDirty, setEditorDirty] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)

  const handleEditorActionsChange = useCallback((actions: CharacteristicEditorActions) => {
    editorActionsRef.current = actions
    setEditorDirty((prev) => (prev === actions.isDirty ? prev : actions.isDirty))
  }, [])

  useContentLocaleSwitchSave(
    async () => {
      await editorActionsRef.current?.save()
    },
    { when: () => editorDirty },
  )

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

  useEffect(() => {
    setEditorDirty(false)
    editorActionsRef.current = null
  }, [selectedId, contentLocale])

  const handleCreate = async () => {
    const name = createName.trim()
    if (!name) {
      toast.error(tValidation('characteristicNameRequired'))
      return
    }

    const needsOptions =
      createValueType === 'SELECT' ||
      createValueType === 'MULTI_SELECT' ||
      createValueType === 'COLOR'
    const options = createOptions.filter((row) => row.label.trim())
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
        options: needsOptions
          ? options.map((row) => ({
              label: row.label.trim(),
              slug: row.slug.trim() || undefined,
              colorHex: row.colorHex.trim() || null,
            }))
          : undefined,
      }, contentLocale)
      toast.success(tt('characteristicCreated'))
      setCreateOpen(false)
      setCreateName('')
      setCreateValueType('SELECT')
      setCreateUnit('')
      setCreateFilterable(true)
      setCreateOptions([])
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
      colorDisplayMode: CharacteristicDefinition['colorDisplayMode']
      options: Array<{ key: string; id?: string; label: string; slug: string; colorHex?: string | null }>
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
        payload.valueType === 'SELECT' ||
        payload.valueType === 'MULTI_SELECT' ||
        payload.valueType === 'COLOR'

      const updated = await updateCharacteristic(characteristicId, {
        name: payload.name,
        valueType: payload.valueType !== selectedItem?.valueType ? payload.valueType : undefined,
        unit: payload.unit,
        isFilterable: payload.isFilterable,
        showOnProductPage: payload.showOnProductPage,
        icon: payload.icon,
        colorDisplayMode: payload.colorDisplayMode,
        ...(showOptions
          ? {
              options: payload.options.map((row, index) => ({
                id: row.id,
                label: row.label.trim(),
                slug: row.slug.trim() || undefined,
                colorHex: row.colorHex?.trim() || null,
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

            <Card className="flex min-h-0 flex-1 flex-col gap-0 overflow-hidden py-0">
              {selected ? (
                <>
                  <CardHeader className="flex shrink-0 flex-row items-start justify-between gap-3 space-y-0 border-b border-border/60 px-6 py-4">
                    <div className="min-w-0 space-y-1">
                      <CardTitle className="truncate text-lg">{selected.name}</CardTitle>
                      <CardDescription className="space-y-1 text-xs leading-snug">
                        <span className="font-mono text-foreground/80">{selected.slug}</span>
                        <span className="block">{tPages('slugHint')}</span>
                      </CardDescription>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => void handleDelete(selected.id, selected.name)}
                        disabled={saving}
                      >
                        <Trash2 className="mr-1.5 h-4 w-4" />
                        {tActions('delete')}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        disabled={saving || !editorDirty}
                        onClick={() => void editorActionsRef.current?.save()}
                      >
                        {saving ? (
                          <>
                            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                            {tActions('saving')}
                          </>
                        ) : (
                          <>
                            <Save className="mr-1.5 h-4 w-4" />
                            {tActions('saveChanges')}
                          </>
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden px-6 py-4">
                    <CharacteristicEditor
                      key={`${selected.id}-${contentLocale}`}
                      definition={selected}
                      saving={saving}
                      onSave={(payload) => handleSave(selected.id, payload)}
                      onDelete={() => handleDelete(selected.id, selected.name)}
                      onActionsChange={handleEditorActionsChange}
                      onReload={() => void load()}
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

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open)
          if (!open) setCreateOptions([])
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{tPages('dialogTitle')}</DialogTitle>
            <DialogDescription>{tPages('dialogDesc')}</DialogDescription>
          </DialogHeader>
          <CreateCharacteristicFields
            name={createName}
            valueType={createValueType}
            unit={createUnit}
            isFilterable={createFilterable}
            options={createOptions}
            onNameChange={setCreateName}
            onValueTypeChange={(next) => {
              setCreateValueType(next)
              if (next === 'SELECT' || next === 'MULTI_SELECT' || next === 'COLOR') {
                setCreateOptions((prev) => (prev.length ? prev : [createOptionDraft()]))
              } else {
                setCreateOptions([])
              }
            }}
            onUnitChange={setCreateUnit}
            onFilterableChange={setCreateFilterable}
            onOptionsChange={setCreateOptions}
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

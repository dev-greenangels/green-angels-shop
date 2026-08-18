'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  FolderTree,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Power,
  PowerOff,
  Trash2,
} from 'lucide-react'
import { toast } from '@/lib/toast'
import { useTranslations } from 'next-intl'

import { AdminLayout } from '@/components/admin/admin-layout'
import { useBackstageContentLocale } from '@/components/backstage/backstage-content-locale'
import { ContentLocaleBanner } from '@/components/backstage/content-locale-banner'
import { CategoryFormDialog, type ParentOption } from '@/components/backstage/category-form-dialog'
import { CategoryThumbnail } from '@/components/backstage/category-thumbnail'
import { CategoriesPhotosBulkEditor } from '@/components/backstage/catalog-photos-bulk-editor'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Switch } from '@/components/ui/switch'
import {
  bulkDeleteCategories,
  bulkSetCategoryActive,
  createCategory,
  deleteCategory,
  fetchCategoryTree,
  flattenCategoryTree,
  categoryLabel,
  setCategoryActive,
  updateCategory,
  type CategoryFormValues,
  type CategoryTreeNode,
} from '@/lib/backstage/categories'
import { cn } from '@/lib/utils'

function collectDescendantIds(node: CategoryTreeNode): Set<string> {
  const ids = new Set<string>()
  const walk = (n: CategoryTreeNode) => {
    for (const child of n.children) {
      ids.add(child.id)
      walk(child)
    }
  }
  walk(node)
  return ids
}

function collectExpandableIds(nodes: CategoryTreeNode[]): string[] {
  const ids: string[] = []
  const walk = (list: CategoryTreeNode[]) => {
    for (const node of list) {
      if (node.children.length > 0) {
        ids.push(node.id)
        walk(node.children)
      }
    }
  }
  walk(nodes)
  return ids
}

function patchNodeInTree(
  nodes: CategoryTreeNode[],
  id: string,
  patch: Partial<CategoryTreeNode>
): CategoryTreeNode[] {
  return nodes.map((node) => {
    if (node.id === id) return { ...node, ...patch }
    if (node.children.length === 0) return node
    return { ...node, children: patchNodeInTree(node.children, id, patch) }
  })
}

function CategoryRow({
  node,
  depth,
  expanded,
  selected,
  togglingActive,
  onToggleExpand,
  onToggleSelect,
  onToggleActive,
  onAddChild,
  onEdit,
  onDelete,
}: {
  node: CategoryTreeNode
  depth: number
  expanded: Set<string>
  selected: Set<string>
  togglingActive: Set<string>
  onToggleExpand: (id: string) => void
  onToggleSelect: (id: string, checked: boolean) => void
  onToggleActive: (node: CategoryTreeNode, isActive: boolean) => void
  onAddChild: (node: CategoryTreeNode) => void
  onEdit: (node: CategoryTreeNode) => void
  onDelete: (node: CategoryTreeNode) => void
}) {
  const tActions = useTranslations('actions')
  const tAria = useTranslations('aria')
  const tStatus = useTranslations('status')
  const tCommon = useTranslations('common')
  const hasChildren = node.children.length > 0
  const isExpanded = expanded.has(node.id)
  const isSelected = selected.has(node.id)
  const isToggling = togglingActive.has(node.id)

  return (
    <>
      <div
        className={cn(
          'flex items-center gap-2 border-b border-border px-4 py-3 last:border-0 hover:bg-muted/40',
          depth > 0 && 'bg-muted/10',
          !node.isActive && 'opacity-70',
          isSelected && 'bg-primary/5'
        )}
        style={{ paddingLeft: `${16 + depth * 24}px` }}
      >
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onToggleSelect(node.id, checked === true)}
          aria-label={tAria('selectItem', { name: categoryLabel(node) })}
          className="shrink-0"
        />

        <button
          type="button"
          className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted',
            !hasChildren && 'invisible'
          )}
          onClick={() => onToggleExpand(node.id)}
          aria-label={isExpanded ? tAria('collapse') : tAria('expand')}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>

        <CategoryThumbnail
          src={node.imageUrl}
          alt={categoryLabel(node)}
          className="h-12 w-16 shrink-0 rounded-md border border-border"
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className={cn('font-medium', node.isActive ? 'text-foreground' : 'text-muted-foreground')}>
              {categoryLabel(node)}
            </p>
            <Badge
              variant={node.isActive ? 'default' : 'secondary'}
              className={cn(
                'text-xs font-normal',
                node.isActive
                  ? 'bg-primary/15 text-primary hover:bg-primary/15'
                  : 'bg-muted text-muted-foreground hover:bg-muted'
              )}
            >
              {node.isActive ? tStatus('active') : tStatus('inactive')}
            </Badge>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              /{node.slug}
            </span>
            {node.children.length > 0 ? (
              <span className="text-xs text-muted-foreground">
                {tStatus('subcategories', { count: node.children.length })}
              </span>
            ) : null}
            <span className="text-xs text-muted-foreground">
              {tStatus('products', { count: node.productCount })}
            </span>
          </div>
          {node.metaTitle ? (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{node.metaTitle}</p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div className="flex items-center gap-2">
            {isToggling ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : null}
            <Switch
              checked={node.isActive}
              disabled={isToggling}
              onCheckedChange={(checked) => onToggleActive(node, checked)}
              aria-label={node.isActive ? tAria('deactivate') : tAria('activate')}
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="icon" aria-label={tActions('actionsMenu')}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={() => onEdit(node)}>
                <Pencil className="mr-2 h-4 w-4" />
                {tActions('edit')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAddChild(node)}>
                <Plus className="mr-2 h-4 w-4" />
                {tActions('addSubcategory')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onToggleActive(node, !node.isActive)}
                disabled={isToggling}
              >
                {node.isActive ? (
                  <>
                    <PowerOff className="mr-2 h-4 w-4" />
                    {tActions('deactivate')}
                  </>
                ) : (
                  <>
                    <Power className="mr-2 h-4 w-4" />
                    {tActions('activate')}
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(node)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {tActions('delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {hasChildren && isExpanded
        ? node.children.map((child) => (
            <CategoryRow
              key={child.id}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              selected={selected}
              togglingActive={togglingActive}
              onToggleExpand={onToggleExpand}
              onToggleSelect={onToggleSelect}
              onToggleActive={onToggleActive}
              onAddChild={onAddChild}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))
        : null}
    </>
  )
}

export default function CategoriesPage() {
  const { locale: contentLocale, ready: contentLocaleReady } = useBackstageContentLocale()
  const tPages = useTranslations('pages.categories')
  const tActions = useTranslations('actions')
  const tCommon = useTranslations('common')
  const tAria = useTranslations('aria')
  const tt = useTranslations('toast')
  const [tree, setTree] = useState<CategoryTreeNode[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [togglingActive, setTogglingActive] = useState<Set<string>>(new Set())
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
  const [editingNode, setEditingNode] = useState<CategoryTreeNode | null>(null)
  const [initialForm, setInitialForm] = useState<Partial<CategoryFormValues>>({})
  const [lockParent, setLockParent] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<CategoryTreeNode | null>(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [bulkWorking, setBulkWorking] = useState(false)
  const [photosBulkOpen, setPhotosBulkOpen] = useState(false)

  const flat = useMemo(() => flattenCategoryTree(tree), [tree])
  const flatIds = useMemo(() => flat.map((n) => n.id), [flat])
  const selectedCount = selected.size
  const allSelected = flatIds.length > 0 && flatIds.every((id) => selected.has(id))
  const someSelected = selectedCount > 0 && !allSelected

  const parentOptions: ParentOption[] = useMemo(() => {
    const excluded = new Set<string>()
    if (dialogMode === 'edit' && editingNode) {
      excluded.add(editingNode.id)
      collectDescendantIds(editingNode).forEach((id) => excluded.add(id))
    }

    const build = (nodes: CategoryTreeNode[], depth: number): ParentOption[] => {
      const items: ParentOption[] = []
      for (const node of nodes) {
        if (!excluded.has(node.id)) {
          items.push({ id: node.id, name: categoryLabel(node), depth })
          items.push(...build(node.children, depth + 1))
        }
      }
      return items
    }

    return build(tree, 0)
  }, [tree, dialogMode, editingNode])

  const loadSeq = useRef(0)

  const loadTree = useCallback(async () => {
    if (!contentLocaleReady) return
    const seq = ++loadSeq.current
    setLoading(true)
    try {
      const data = await fetchCategoryTree(contentLocale)
      if (seq !== loadSeq.current) return
      setTree(data)
      // Keep tree collapsed on reload; only prune selection to still-existing ids
      setExpanded((prev) => {
        if (prev.size === 0) return prev
        const valid = new Set(collectExpandableIds(data))
        return new Set([...prev].filter((id) => valid.has(id)))
      })
      setSelected((prev) => {
        const valid = new Set(flattenCategoryTree(data).map((n) => n.id))
        return new Set([...prev].filter((id) => valid.has(id)))
      })
    } catch (err) {
      if (seq !== loadSeq.current) return
      toast.error(err instanceof Error ? err.message : tt('loadFailed'))
    } finally {
      if (seq === loadSeq.current) setLoading(false)
    }
  }, [contentLocale, contentLocaleReady])

  useEffect(() => {
    setDialogOpen(false)
    setExpanded(new Set())
    void loadTree()
  }, [loadTree])

  const expandableIds = useMemo(() => collectExpandableIds(tree), [tree])
  const allExpanded =
    expandableIds.length > 0 && expandableIds.every((id) => expanded.has(id))

  const expandAll = () => setExpanded(new Set(expandableIds))
  const collapseAll = () => setExpanded(new Set())

  const openCreateRoot = () => {
    setDialogMode('create')
    setEditingNode(null)
    setInitialForm({ parentId: null })
    setLockParent(false)
    setDialogOpen(true)
  }

  const openCreateChild = (parent: CategoryTreeNode) => {
    setDialogMode('create')
    setEditingNode(null)
    setInitialForm({ parentId: parent.id })
    setLockParent(true)
    setExpanded((prev) => new Set(prev).add(parent.id))
    setDialogOpen(true)
  }

  const openEdit = (node: CategoryTreeNode) => {
    setDialogMode('edit')
    setEditingNode(node)
    setInitialForm({
      name: node.name,
      slug: node.slug,
      parentId: node.parentId,
      image: node.image,
      description: node.description ?? '',
      footerDescription: node.footerDescription ?? '',
      metaTitle: node.metaTitle ?? '',
      metaDesc: node.metaDesc ?? '',
      isCatalogRoot: node.isCatalogRoot,
    })
    setLockParent(false)
    setDialogOpen(true)
  }

  const handleSubmit = async (values: CategoryFormValues) => {
    if (dialogMode === 'create') {
      await createCategory(values, contentLocale)
      toast.success(tt('categoryCreated'))
    } else if (editingNode) {
      await updateCategory(editingNode.id, values, contentLocale)
      toast.success(tt('categoryUpdated'))
    }
    await loadTree()
  }

  const handleToggleActive = async (node: CategoryTreeNode, isActive: boolean) => {
    if (node.isActive === isActive) return

    setTogglingActive((prev) => new Set(prev).add(node.id))
    setTree((prev) => patchNodeInTree(prev, node.id, { isActive }))

    try {
      await setCategoryActive(node.id, isActive)
      toast.success(isActive ? tt('categoryActivated') : tt('categoryDeactivated'))
    } catch (err) {
      setTree((prev) => patchNodeInTree(prev, node.id, { isActive: node.isActive }))
      toast.error(err instanceof Error ? err.message : tt('statusChangeFailed'))
    } finally {
      setTogglingActive((prev) => {
        const next = new Set(prev)
        next.delete(node.id)
        return next
      })
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteCategory(deleteTarget.id)
      toast.success(tt('categoryDeleted'))
      setDeleteTarget(null)
      setSelected((prev) => {
        const next = new Set(prev)
        next.delete(deleteTarget.id)
        return next
      })
      await loadTree()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tt('deleteFailed'))
    } finally {
      setDeleting(false)
    }
  }

  const confirmBulkDelete = async () => {
    const ids = [...selected]
    if (ids.length === 0) return

    setBulkWorking(true)
    try {
      const result = await bulkDeleteCategories(ids)
      if (result.succeeded.length > 0) {
        toast.success(tt('deletedCount', { count: result.succeeded.length }))
      }
      if (result.failed.length > 0) {
        toast.error(tt('deleteFailedCount', { count: result.failed.length }))
      }
      setBulkDeleteOpen(false)
      setSelected(new Set())
      await loadTree()
    } finally {
      setBulkWorking(false)
    }
  }

  const handleBulkSetActive = async (isActive: boolean) => {
    const ids = [...selected]
    if (ids.length === 0) return

    setBulkWorking(true)
    try {
      const result = await bulkSetCategoryActive(ids, isActive)
      if (result.succeeded.length > 0) {
        toast.success(
          isActive
            ? tt('activatedCount', { count: result.succeeded.length })
            : tt('deactivatedCount', { count: result.succeeded.length })
        )
        setTree((prev) =>
          result.succeeded.reduce(
            (nodes, id) => patchNodeInTree(nodes, id, { isActive }),
            prev
          )
        )
      }
      if (result.failed.length > 0) {
        toast.error(tt('errorsCount', { count: result.failed.length }))
      }
      setSelected(new Set())
    } finally {
      setBulkWorking(false)
    }
  }

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelect = (id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const toggleSelectAll = (checked: boolean) => {
    setSelected(checked ? new Set(flatIds) : new Set())
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold text-foreground">{tPages('title')}</h1>
            <p className="text-muted-foreground">{tPages('subtitle')}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => setPhotosBulkOpen(true)}>
              Фото списком
            </Button>
            <Button onClick={openCreateRoot}>
              <Plus className="mr-2 h-4 w-4" />
              {tActions('addCategory')}
            </Button>
          </div>
        </div>

        <ContentLocaleBanner />

        <Dialog open={photosBulkOpen} onOpenChange={setPhotosBulkOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
            <DialogHeader>
              <DialogTitle>Фото категорій</DialogTitle>
            </DialogHeader>
            <CategoriesPhotosBulkEditor onClose={() => setPhotosBulkOpen(false)} />
          </DialogContent>
        </Dialog>

        {selectedCount > 0 ? (
          <div className="backstage-glass sticky top-9 z-30 flex flex-wrap items-center gap-3 rounded-lg border px-4 py-3 shadow-sm">
            <span className="text-sm font-medium text-foreground">
              {tCommon('selected', { count: selectedCount })}
            </span>
            <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={bulkWorking}
                onClick={() => void handleBulkSetActive(true)}
              >
                <Power className="mr-1 h-4 w-4" />
                {tActions('activate')}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={bulkWorking}
                onClick={() => void handleBulkSetActive(false)}
              >
                <PowerOff className="mr-1 h-4 w-4" />
                {tActions('deactivate')}
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={bulkWorking}
                onClick={() => setBulkDeleteOpen(true)}
              >
                <Trash2 className="mr-1 h-4 w-4" />
                {tActions('delete')}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={bulkWorking}
                onClick={() => setSelected(new Set())}
              >
                {tActions('cancel')}
              </Button>
            </div>
          </div>
        ) : null}

        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
            <CardTitle className="flex items-center gap-2">
              <FolderTree className="h-5 w-5 text-muted-foreground" />
              {tPages('treeTitle', { count: flat.length })}
            </CardTitle>
            {!loading && tree.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={expandableIds.length === 0 || allExpanded}
                  onClick={expandAll}
                >
                  {tActions('expandAll')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={expanded.size === 0}
                  onClick={collapseAll}
                >
                  {tActions('collapseAll')}
                </Button>
              </div>
            ) : null}
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                {tCommon('loading')}
              </div>
            ) : tree.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <p className="text-muted-foreground">{tPages('empty')}</p>
                <Button className="mt-4" onClick={openCreateRoot}>
                  {tPages('createFirst')}
                </Button>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 border-b border-border/60 bg-background/10 px-4 py-2 backdrop-blur-sm">
                  <Checkbox
                    checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                    onCheckedChange={(checked) => toggleSelectAll(checked === true)}
                    aria-label={tAria('selectAllCategories')}
                  />
                  <span className="text-xs text-muted-foreground">{tActions('selectAll')}</span>
                </div>
                {tree.map((node) => (
                  <CategoryRow
                    key={node.id}
                    node={node}
                    depth={0}
                    expanded={expanded}
                    selected={selected}
                    togglingActive={togglingActive}
                    onToggleExpand={toggleExpanded}
                    onToggleSelect={toggleSelect}
                    onToggleActive={handleToggleActive}
                    onAddChild={openCreateChild}
                    onEdit={openEdit}
                    onDelete={setDeleteTarget}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <CategoryFormDialog
        key={`${dialogMode}:${editingNode?.id ?? 'new'}:${contentLocale}`}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={dialogMode === 'create' ? tPages('dialogCreateTitle') : tPages('dialogEditTitle')}
        description={
          dialogMode === 'create' ? tPages('dialogCreateDesc') : tPages('dialogEditDesc')
        }
        initialValues={initialForm}
        parentOptions={parentOptions}
        lockParent={lockParent}
        categoryId={editingNode?.id}
        hints={
          editingNode
            ? {
                name: editingNode.nameHint,
                description: editingNode.descriptionHint,
                footerDescription: editingNode.footerDescriptionHint,
                metaTitle: editingNode.metaTitleHint,
                metaDesc: editingNode.metaDescHint,
              }
            : undefined
        }
        submitLabel={dialogMode === 'create' ? tActions('create') : tActions('save')}
        onSubmit={handleSubmit}
      />

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tPages('deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget ? tPages('deleteBody', { name: categoryLabel(deleteTarget) }) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{tActions('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                void confirmDelete()
              }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? tActions('deleting') : tActions('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tPages('bulkDeleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {tPages('bulkDeleteBody', { count: selectedCount })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkWorking}>{tActions('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                void confirmBulkDelete()
              }}
              disabled={bulkWorking}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {bulkWorking ? tActions('deleting') : tActions('bulkDelete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  )
}

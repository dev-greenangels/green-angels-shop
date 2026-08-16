'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Eye,
  EyeOff,
  ExternalLink,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import { toast } from '@/lib/toast'

import { AdminLayout } from '@/components/admin/admin-layout'
import { BlogPostFormDialog } from '@/components/backstage/blog-post-form-dialog'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  bulkBackstageBlogPosts,
  createBackstageBlogPost,
  deleteBackstageBlogPost,
  fetchBackstageBlogPostById,
  fetchBackstageBlogPosts,
  updateBackstageBlogPost,
  type BlogBulkAction,
  type BlogPostFormValues,
} from '@/lib/backstage/blog'
import type { BlogPostDetail, BlogPostListItem } from '@/lib/blog/posts'
import { formatBlogDate } from '@/lib/blog/posts'
import { getVisiblePageNumbers } from '@/lib/catalog/pagination'
import { useBackstageUiLocale } from '@/components/backstage/backstage-ui-locale'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 20

export default function BlogPage() {
  const { locale } = useBackstageUiLocale()
  const [posts, setPosts] = useState<BlogPostListItem[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [status, setStatus] = useState<'all' | 'published' | 'hidden'>('all')
  const [q, setQ] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<BlogPostDetail | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<BlogPostListItem | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)

  const loadPosts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchBackstageBlogPosts({
        page,
        pageSize: PAGE_SIZE,
        status,
        q,
        sort: 'newest',
      })
      setPosts(data.items)
      setTotal(data.total)
      setTotalPages(data.totalPages)
      setSelected(new Set())
    } catch (err) {
      setPosts([])
      setTotal(0)
      setTotalPages(1)
      setError(err instanceof Error ? err.message : 'Не вдалося завантажити статті.')
    } finally {
      setLoading(false)
    }
  }, [page, status, q])

  useEffect(() => {
    void loadPosts()
  }, [loadPosts])

  const allSelected = posts.length > 0 && posts.every((post) => selected.has(post.id))
  const selectedIds = useMemo(() => [...selected], [selected])

  const toggleAll = (checked: boolean) => {
    if (!checked) {
      setSelected(new Set())
      return
    }
    setSelected(new Set(posts.map((post) => post.id)))
  }

  const toggleOne = (id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const openCreate = () => {
    setEditing(null)
    setDialogOpen(true)
  }

  const openEdit = async (post: BlogPostListItem) => {
    try {
      const detail = await fetchBackstageBlogPostById(post.id)
      setEditing(detail)
      setDialogOpen(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не вдалося завантажити статтю.')
    }
  }

  const handleSubmit = async (values: BlogPostFormValues) => {
    if (editing) {
      await updateBackstageBlogPost(editing.id, values)
      toast.success('Статтю оновлено.')
    } else {
      await createBackstageBlogPost(values)
      toast.success('Статтю створено.')
    }
    await loadPosts()
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteBackstageBlogPost(deleteTarget.id)
      toast.success('Статтю видалено.')
      setDeleteTarget(null)
      await loadPosts()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не вдалося видалити статтю.')
    } finally {
      setDeleting(false)
    }
  }

  const runBulk = async (action: BlogBulkAction) => {
    if (selectedIds.length === 0) return
    setBulkLoading(true)
    try {
      const result = await bulkBackstageBlogPosts(selectedIds, action)
      const label =
        action === 'delete'
          ? 'видалено'
          : action === 'publish'
            ? 'опубліковано'
            : 'приховано'
      toast.success(`Оброблено: ${result.affected} (${label}).`)
      setBulkDeleteOpen(false)
      await loadPosts()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не вдалося виконати дію.')
    } finally {
      setBulkLoading(false)
    }
  }

  const pageNumbers = getVisiblePageNumbers(page, totalPages)

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold text-foreground">Блог</h1>
            <p className="text-muted-foreground">Статті для публічного сайту</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Нова стаття
            </Button>
            <Button variant="outline" onClick={() => void loadPosts()} disabled={loading}>
              <RefreshCw className={cn('mr-2 h-4 w-4', loading && 'animate-spin')} />
              Оновити
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="space-y-4 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
              <div className="min-w-0 flex-1 space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground" htmlFor="blog-search">
                  Пошук
                </label>
                <form
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault()
                    setPage(1)
                    setQ(searchInput.trim())
                  }}
                >
                  <Input
                    id="blog-search"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Назва, slug або автор"
                  />
                  <Button type="submit" variant="outline">
                    Знайти
                  </Button>
                </form>
              </div>
              <div className="w-full space-y-1.5 sm:w-48">
                <label className="text-xs font-medium text-muted-foreground">Статус</label>
                <Select
                  value={status}
                  onValueChange={(value: 'all' | 'published' | 'hidden') => {
                    setPage(1)
                    setStatus(value)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Усі</SelectItem>
                    <SelectItem value="published">Опубліковані</SelectItem>
                    <SelectItem value="hidden">Приховані</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedIds.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border/70 bg-muted/30 px-3 py-2">
                <span className="text-sm text-muted-foreground">Обрано: {selectedIds.length}</span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={bulkLoading}
                  onClick={() => void runBulk('publish')}
                >
                  <Eye className="mr-1.5 h-4 w-4" />
                  Показати
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={bulkLoading}
                  onClick={() => void runBulk('unpublish')}
                >
                  <EyeOff className="mr-1.5 h-4 w-4" />
                  Приховати
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={bulkLoading}
                  onClick={() => setBulkDeleteOpen(true)}
                >
                  <Trash2 className="mr-1.5 h-4 w-4" />
                  Видалити
                </Button>
              </div>
            ) : null}

            {loading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                Завантаження...
              </div>
            ) : error ? (
              <p className="py-8 text-center text-sm text-destructive">{error}</p>
            ) : posts.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">
                Статей не знайдено. Створіть першу публікацію або змініть фільтр.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="w-10 px-3 py-3">
                        <Checkbox
                          checked={allSelected}
                          onCheckedChange={(value) => toggleAll(value === true)}
                          aria-label="Обрати всі на сторінці"
                        />
                      </th>
                      <th className="px-3 py-3">Стаття</th>
                      <th className="px-3 py-3">Статус</th>
                      <th className="px-3 py-3">Дата</th>
                      <th className="px-3 py-3 text-right">Дії</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {posts.map((post) => (
                      <tr key={post.id} className="align-top">
                        <td className="px-3 py-3">
                          <Checkbox
                            checked={selected.has(post.id)}
                            onCheckedChange={(value) => toggleOne(post.id, value === true)}
                            aria-label={`Обрати «${post.title}»`}
                          />
                        </td>
                        <td className="px-3 py-3">
                          <div className="space-y-1">
                            <p className="font-medium text-foreground">{post.title}</p>
                            <p className="text-xs text-muted-foreground">/{post.slug}</p>
                            <p className="line-clamp-2 text-xs text-foreground/70">{post.excerpt}</p>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className={cn(
                              'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                              post.isPublished
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                : 'bg-muted text-muted-foreground',
                            )}
                          >
                            {post.isPublished ? 'Опубліковано' : 'Приховано'}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-muted-foreground">
                          {formatBlogDate(post.createdAt, locale)}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex flex-wrap justify-end gap-2">
                            {post.isPublished ? (
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/uk/blog/${post.slug}`} target="_blank" rel="noreferrer">
                                  <ExternalLink className="mr-1.5 h-4 w-4" />
                                  Сайт
                                </Link>
                              </Button>
                            ) : null}
                            <Button variant="outline" size="sm" onClick={() => void openEdit(post)}>
                              <Pencil className="mr-1.5 h-4 w-4" />
                              Редагувати
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setDeleteTarget(post)}
                            >
                              <Trash2 className="mr-1.5 h-4 w-4" />
                              Видалити
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!loading && totalPages > 1 ? (
              <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
                <p className="text-xs text-muted-foreground">
                  Сторінка {page} з {totalPages} · усього {total}
                </p>
                <div className="flex flex-wrap items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Назад
                  </Button>
                  {pageNumbers.map((item, index) =>
                    item === 'ellipsis' ? (
                      <span key={`e-${index}`} className="px-1 text-muted-foreground">
                        …
                      </span>
                    ) : (
                      <Button
                        key={item}
                        variant={item === page ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPage(item)}
                      >
                        {item}
                      </Button>
                    ),
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Далі
                  </Button>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <BlogPostFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? 'Редагувати статтю' : 'Нова стаття'}
        description="SEO, обкладинка та HTML-контент для публічної сторінки /blog."
        submitLabel={editing ? 'Зберегти' : 'Створити'}
        blogPostId={editing?.id}
        initialValues={
          editing
            ? {
                title: editing.title,
                slug: editing.slug,
                content: editing.content,
                excerpt: editing.excerpt ?? '',
                image: editing.image ?? '',
                author: editing.author ?? '',
                metaTitle: editing.metaTitle ?? '',
                metaDescription: editing.metaDescription ?? '',
                metaKeywords: editing.metaKeywords ?? '',
                isPublished: editing.isPublished,
              }
            : undefined
        }
        onSubmit={handleSubmit}
      />

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Видалити статтю?</AlertDialogTitle>
            <AlertDialogDescription>
              Статтю «{deleteTarget?.title}» буде видалено назавжди.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Скасувати</AlertDialogCancel>
            <Button variant="destructive" onClick={() => void handleDelete()} disabled={deleting}>
              {deleting ? 'Видалення…' : 'Видалити'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Видалити обрані статті?</AlertDialogTitle>
            <AlertDialogDescription>
              Буде видалено {selectedIds.length}{' '}
              {selectedIds.length === 1 ? 'статтю' : 'статей'} назавжди.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkLoading}>Скасувати</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={bulkLoading}
              onClick={() => void runBulk('delete')}
            >
              {bulkLoading ? 'Видалення…' : 'Видалити'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  )
}

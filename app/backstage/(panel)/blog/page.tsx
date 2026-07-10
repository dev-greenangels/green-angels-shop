'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ExternalLink, Loader2, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

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
import {
  createBackstageBlogPost,
  deleteBackstageBlogPost,
  fetchBackstageBlogPosts,
  updateBackstageBlogPost,
  type BlogPostFormValues,
} from '@/lib/backstage/blog'
import type { BlogPostDetail, BlogPostListItem } from '@/lib/blog/posts'
import { formatBlogDate } from '@/lib/blog/posts'
import { cn } from '@/lib/utils'

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPostListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<BlogPostDetail | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<BlogPostListItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadPosts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchBackstageBlogPosts()
      setPosts(data)
    } catch (err) {
      setPosts([])
      setError(err instanceof Error ? err.message : 'Не вдалося завантажити статті.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadPosts()
  }, [loadPosts])

  const openCreate = () => {
    setEditing(null)
    setDialogOpen(true)
  }

  const openEdit = async (post: BlogPostListItem) => {
    try {
      const res = await fetch(`/api/catalog/blog/${encodeURIComponent(post.slug)}`, {
        cache: 'no-store',
      })
      if (!res.ok) throw new Error('Не вдалося завантажити статтю.')
      const detail = (await res.json()) as BlogPostDetail
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
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                Завантаження...
              </div>
            ) : error ? (
              <p className="px-6 py-8 text-center text-sm text-destructive">{error}</p>
            ) : posts.length === 0 ? (
              <p className="px-6 py-16 text-center text-sm text-muted-foreground">
                Статей поки немає. Створіть першу публікацію.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between"
                  >
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-serif text-xl font-semibold text-foreground">{post.title}</h2>
                        <span className="text-xs text-muted-foreground">/{post.slug}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{formatBlogDate(post.createdAt)}</p>
                      <p className="line-clamp-2 text-sm text-foreground/80">{post.excerpt}</p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/uk/blog/${post.slug}`} target="_blank" rel="noreferrer">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Переглянути
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => void openEdit(post)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Редагувати
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => setDeleteTarget(post)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Видалити
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <BlogPostFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? 'Редагувати статтю' : 'Нова стаття'}
        description="Статті відображаються на публічній сторінці /blog."
        submitLabel={editing ? 'Зберегти' : 'Створити'}
        initialValues={
          editing
            ? {
                title: editing.title,
                slug: editing.slug,
                content: editing.content,
                image: editing.image ?? '',
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
    </AdminLayout>
  )
}

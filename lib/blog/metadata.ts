import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { fetchBlogPostBySlug } from '@/lib/blog/posts'
import { toPublicMediaUrl } from '@/lib/media/public-url'
import { buildIndexablePageMetadata } from '@/lib/seo/build-page-metadata'

export async function buildBlogListingMetadata(
  locale: string,
  options?: { page?: number },
): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'blog' })
  const tCommon = await getTranslations({ locale, namespace: 'common' })
  const siteName = tCommon('brand')
  const page = options?.page ?? 1

  return buildIndexablePageMetadata(locale, '/blog', {
    title: `${t('listingTitle')} · ${siteName}`,
    description: t('listingDescription'),
    siteName,
    robots: page > 1 ? { index: false, follow: true } : undefined,
  })
}

export async function buildBlogPostMetadata(locale: string, slug: string): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'blog' })
  const tCommon = await getTranslations({ locale, namespace: 'common' })
  const siteName = tCommon('brand')

  try {
    const post = await fetchBlogPostBySlug(slug)
    const title = post.metaTitle?.trim() || post.title
    const description = post.metaDescription?.trim() || post.excerpt
    const images = post.image ? [toPublicMediaUrl(post.image)] : undefined
    const metadata = await buildIndexablePageMetadata(locale, `/blog/${slug}`, {
      title: `${title} · ${t('listingTitle')} · ${siteName}`,
      description,
      images,
      siteName,
    })
    const keywords = post.metaKeywords?.trim()
    return keywords ? { ...metadata, keywords } : metadata
  } catch {
    return { title: `${t('articleFallbackTitle')} · ${siteName}` }
  }
}

import { siteContentShellClassName } from '@/lib/layout/site-shell'

type CatalogCategoryFooterProps = {
  content: string
}

export function CatalogCategoryFooter({ content }: CatalogCategoryFooterProps) {
  const text = content.trim()
  if (!text) return null

  const paragraphs = text.split(/\n{2,}/).filter((part) => part.trim())

  return (
    <section className="border-t border-border/40 bg-secondary/20 py-10 md:py-12">
      <div className={siteContentShellClassName}>
        <div className="max-w-3xl space-y-4 text-muted-foreground">
          {paragraphs.map((paragraph, index) => (
            <p key={index} className="whitespace-pre-wrap leading-relaxed">
              {paragraph.trim()}
            </p>
          ))}
        </div>
      </div>
    </section>
  )
}

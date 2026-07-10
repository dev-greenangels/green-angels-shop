import { cn } from '@/lib/utils'

export function HomeSectionHeader({
  eyebrow,
  title,
  subtitle,
  align = 'center',
  className,
  children,
}: {
  eyebrow?: string
  title: string
  subtitle?: string
  align?: 'center' | 'left'
  className?: string
  children?: React.ReactNode
}) {
  return (
    <div
      className={cn(
        'mb-12 flex flex-col gap-4 md:mb-14',
        align === 'center' && 'text-center',
        align === 'left' && 'md:flex-row md:items-end md:justify-between',
        className,
      )}
    >
      <div className={cn(align === 'center' && 'mx-auto max-w-3xl')}>
        {eyebrow ? (
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
        ) : null}
        <h2 className="font-serif text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-[2.75rem] lg:leading-tight">
          {title}
        </h2>
        {subtitle ? (
          <p
            className={cn(
              'mt-4 text-base leading-relaxed text-muted-foreground md:text-lg',
              align === 'center' && 'mx-auto max-w-2xl',
            )}
          >
            {subtitle}
          </p>
        ) : null}
      </div>
      {children}
    </div>
  )
}

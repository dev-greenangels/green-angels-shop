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
        'mb-8 flex flex-col gap-4 md:mb-10',
        align === 'center' && 'text-center',
        align === 'left' && 'md:flex-row md:items-end md:justify-between',
        className,
      )}
    >
      <div className={cn(align === 'center' && 'mx-auto max-w-3xl')}>
        {eyebrow ? (
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-primary">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="font-serif text-3xl font-medium leading-snug text-foreground md:text-4xl lg:text-[2.5rem] lg:leading-[1.2]">
          {title}
        </h2>
        {subtitle ? (
          <p
            className={cn(
              'mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg md:leading-relaxed',
              align === 'center' && 'mx-auto',
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

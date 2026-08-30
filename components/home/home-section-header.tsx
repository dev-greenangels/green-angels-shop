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
  if (align === 'left') {
    return (
      <div className={cn('mb-8 flex flex-col gap-4 md:mb-10', className)}>
        <div>
          {eyebrow ? (
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-primary">
              {eyebrow}
            </p>
          ) : null}
          <div className="flex items-end justify-between gap-3">
            <h2 className="min-w-0 font-serif text-3xl font-bold leading-snug text-foreground md:text-4xl lg:text-[2.5rem] lg:leading-[1.2]">
              {title}
            </h2>
            {children ? <div className="shrink-0">{children}</div> : null}
          </div>
          {subtitle ? (
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg md:leading-relaxed">
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('mb-8 flex flex-col gap-4 text-center md:mb-10', className)}>
      <div className="mx-auto max-w-3xl">
        {eyebrow ? (
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-primary">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="font-serif text-3xl font-bold leading-snug text-foreground md:text-4xl lg:text-[2.5rem] lg:leading-[1.2]">
          {title}
        </h2>
        {subtitle ? (
          <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg md:leading-relaxed">
            {subtitle}
          </p>
        ) : null}
      </div>
      {children}
    </div>
  )
}

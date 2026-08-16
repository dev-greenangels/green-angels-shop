import { AccountNav } from '@/components/account/account-nav'
import { siteContentShellCompactClassName } from '@/lib/layout/site-shell'
import { cn } from '@/lib/utils'

type AccountShellProps = {
  title: string
  description?: string
  children: React.ReactNode
}

export function AccountShell({ title, description, children }: AccountShellProps) {
  return (
    <div className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-secondary/80 via-muted/40 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 top-8 h-64 w-64 rounded-full bg-primary/5 blur-3xl"
      />
      <div className={cn(siteContentShellCompactClassName, 'relative py-8 sm:py-10 lg:py-14')}>
        <header className="mb-6 max-w-2xl sm:mb-8 lg:mb-12">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">
            Green Angels
          </p>
          <h1 className="mt-2 font-serif text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-3 break-words text-base leading-relaxed text-muted-foreground">
              {description}
            </p>
          ) : null}
        </header>

        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-12">
          <aside className="lg:w-60 lg:shrink-0">
            <div className="-mx-[var(--site-shell-padding-x)] border-b border-border/60 px-[var(--site-shell-padding-x)] pb-2 lg:sticky lg:top-24 lg:mx-0 lg:border-b-0 lg:border-l lg:border-border/60 lg:px-0 lg:pb-0 lg:pl-1">
              <AccountNav />
            </div>
          </aside>
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </div>
    </div>
  )
}

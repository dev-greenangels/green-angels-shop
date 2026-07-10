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
    <div className={cn(siteContentShellCompactClassName, 'py-10 lg:py-12')}>
      <div className="mb-8 lg:mb-10">
        <h1 className="font-serif text-3xl font-bold text-foreground">{title}</h1>
        {description ? <p className="mt-2 text-muted-foreground">{description}</p> : null}
      </div>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
        <aside className="lg:w-56 lg:shrink-0">
          <div className="rounded-xl border border-border/50 bg-card/70 p-3 shadow-sm backdrop-blur-sm lg:sticky lg:top-24">
            <AccountNav />
          </div>
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  )
}

import { getStoreEmails, getStorePhones, phoneHref } from '@/lib/settings/store-helpers'
import type { StoreContactSettings } from '@/lib/settings/types'

type StoreContactCtaProps = {
  store: StoreContactSettings
  className?: string
}

export function StoreContactCta({ store, className }: StoreContactCtaProps) {
  const phones = getStorePhones(store)
  const emails = getStoreEmails(store)

  return (
    <div className={className}>
      <div className="flex flex-col justify-center gap-4 sm:flex-row sm:flex-wrap">
        {phones.map((item) => (
          <a
            key={`${item.label}-${item.phone}`}
            href={phoneHref(item.phone)}
            className="inline-flex flex-col items-center justify-center rounded-lg bg-primary-gradient px-6 py-3 font-medium text-primary-foreground transition-[filter] hover:brightness-95"
          >
            <span className="text-xs opacity-80">{item.label}</span>
            <span>{item.phone}</span>
          </a>
        ))}
        {emails.map((item) => (
          <a
            key={`${item.label}-${item.email}`}
            href={`mailto:${item.email}`}
            className="inline-flex flex-col items-center justify-center rounded-lg border border-border px-6 py-3 font-medium transition-colors hover:bg-accent"
          >
            <span className="text-xs text-muted-foreground">{item.label}</span>
            <span>{item.email}</span>
          </a>
        ))}
      </div>
    </div>
  )
}

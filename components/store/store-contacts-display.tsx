import { Clock, Link2, Mail, Phone } from 'lucide-react'

import { StoreAddressLink } from '@/components/store/store-address-link'
import { hasVisibleSocialLinks, SocialLinks } from '@/components/social/social-links'
import { TelegramIcon, ViberIcon, WhatsAppIcon } from '@/components/social/social-icons'
import {
  contactLineDisplayText,
  contactLineHref,
  contactLineOpensInNewTab,
  isContactLineVisibleInFooter,
} from '@/lib/settings/store-contact-lines'
import {
  formatScheduleEntries,
  getStoreContactBlocks,
  getStoreEmails,
  getStorePhones,
  getStoreSchedules,
  getVisibleStoreContactBlocks,
  phoneHref,
} from '@/lib/settings/store-helpers'
import type { StoreContactBlock, StoreContactLine, StoreContactSettings, StoreFooterVisibility } from '@/lib/settings/types'
import { cn } from '@/lib/utils'

type StoreContactsDisplayProps = {
  store: StoreContactSettings
  className?: string
  iconClassName?: string
  textClassName?: string
  linkClassName?: string
  /** Показувати адресу всередині блоку контактів */
  showAddress?: boolean
  /** Фільтрувати рядки за налаштуваннями футера (лише для футера) */
  filterByFooterVisibility?: boolean
  visibility?: Partial<StoreFooterVisibility>
  grouped?: boolean
  columnsOnDesktop?: boolean
  /** Заголовок секції графіків (напр. «Графік роботи») */
  scheduleSectionTitle?: string
  /** Показувати блок соцмереж */
  showSocialLinks?: boolean
  socialSectionTitle?: string
}

function ContactLineIcon({
  line,
  className,
}: {
  line: StoreContactLine
  className?: string
}) {
  switch (line.type) {
    case 'email':
      return <Mail className={className} />
    case 'phone':
      return <Phone className={className} />
    case 'viber':
      return <ViberIcon className={className} />
    case 'telegram':
      return <TelegramIcon className={className} />
    case 'whatsapp':
      return <WhatsAppIcon className={className} />
    default:
      return <Link2 className={className} />
  }
}

function ContactBlockDisplay({
  block,
  visibility,
  iconClassName,
  textClassName,
  linkClassName,
}: {
  block: StoreContactBlock
  visibility?: Partial<StoreFooterVisibility>
  iconClassName?: string
  textClassName?: string
  linkClassName?: string
}) {
  const lines = block.lines.filter((line) =>
    visibility ? isContactLineVisibleInFooter(line, visibility) : true,
  )
  if (!lines.length) return null

  return (
    <div className={cn('space-y-1.5 text-sm', textClassName)}>
      <p className="font-medium">{block.title}</p>
      {lines.map((line, index) => (
        <div key={`${line.type}-${line.value}-${index}`} className="flex items-center gap-2 pl-0.5">
          <ContactLineIcon
            line={line}
            className={cn('h-4 w-4 shrink-0 opacity-90', iconClassName)}
          />
          <a
            href={contactLineHref(line)}
            className={cn('min-w-0 transition-colors', linkClassName)}
            {...(contactLineOpensInNewTab(line)
              ? { target: '_blank', rel: 'noopener noreferrer' }
              : {})}
          >
            {contactLineDisplayText(line)}
          </a>
        </div>
      ))}
    </div>
  )
}

function ScheduleBlock({
  schedule,
  iconClassName,
  textClassName,
}: {
  schedule: ReturnType<typeof getStoreSchedules>[number]
  iconClassName?: string
  textClassName?: string
}) {
  return (
    <div className="flex items-start gap-3">
      <Clock className={cn('mt-0.5 h-5 w-5 shrink-0', iconClassName)} />
      <div className={cn('text-sm', textClassName)}>
        <p className="font-medium">{schedule.title}</p>
        <div className="mt-1 space-y-0.5">
          {formatScheduleEntries(schedule).map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
        {schedule.note?.trim() ? (
          <p className="mt-2 text-xs opacity-80">{schedule.note}</p>
        ) : null}
      </div>
    </div>
  )
}

export function StoreContactsDisplay({
  store,
  className,
  iconClassName,
  textClassName,
  linkClassName,
  showAddress = true,
  filterByFooterVisibility = false,
  visibility,
  grouped = false,
  columnsOnDesktop = false,
  scheduleSectionTitle,
  showSocialLinks = false,
  socialSectionTitle = 'Соцмережі',
}: StoreContactsDisplayProps) {
  const phones = getStorePhones(store)
  const emails = getStoreEmails(store)
  const footerVisibility = filterByFooterVisibility
    ? { ...store.footer, ...visibility }
    : null
  const contactBlocks = filterByFooterVisibility
    ? getVisibleStoreContactBlocks(store, footerVisibility!)
    : getStoreContactBlocks(store)
  const schedules = getStoreSchedules(store)
  const resolvedShowAddress = filterByFooterVisibility
    ? footerVisibility!.showAddress
    : showAddress
  const resolvedShowPhone = footerVisibility?.showPhone ?? true
  const resolvedShowEmail = footerVisibility?.showEmail ?? true
  const resolvedShowSchedules = footerVisibility?.showSchedules ?? true
  const lineVisibility = filterByFooterVisibility ? footerVisibility! : undefined
  const showGroupedContacts = grouped && contactBlocks.length > 0
  const showSocial = showSocialLinks && hasVisibleSocialLinks(store.social)

  const socialSection = showSocial ? (
    <div className="space-y-3">
      <p className={cn('font-medium', textClassName)}>{socialSectionTitle}</p>
      <SocialLinks
        social={store.social}
        iconClassName="border-border bg-muted/50 text-foreground hover:bg-muted"
      />
    </div>
  ) : null

  const schedulesSection =
    resolvedShowSchedules && schedules.length > 0 ? (
      <div className="space-y-4">
        {scheduleSectionTitle ? (
          <h3 className={cn('font-serif text-xl font-semibold', textClassName)}>{scheduleSectionTitle}</h3>
        ) : null}
        <div className={cn(columnsOnDesktop && grouped ? 'grid gap-6 md:grid-cols-2' : 'space-y-3')}>
          {schedules.map((schedule) => (
            <ScheduleBlock
              key={schedule.title}
              schedule={schedule}
              iconClassName={iconClassName}
              textClassName={textClassName}
            />
          ))}
        </div>
      </div>
    ) : null

  if (columnsOnDesktop && grouped) {
    return (
      <div className={cn('space-y-6', className)}>
        {showGroupedContacts ? (
          <div className="grid gap-6 md:grid-cols-2">
            {contactBlocks.map((block) => (
              <ContactBlockDisplay
                key={block.title}
                block={block}
                visibility={lineVisibility}
                iconClassName={iconClassName}
                textClassName={textClassName}
                linkClassName={linkClassName}
              />
            ))}
          </div>
        ) : null}

        {socialSection}
        {schedulesSection}

        {resolvedShowAddress ? (
          <StoreAddressLink
            store={store}
            iconClassName={iconClassName}
            textClassName={textClassName}
            linkClassName={linkClassName}
          />
        ) : null}
      </div>
    )
  }

  return (
    <div className={cn('space-y-3', className)}>
      {resolvedShowAddress ? (
        <StoreAddressLink
          store={store}
          iconClassName={iconClassName}
          textClassName={textClassName}
          linkClassName={linkClassName}
        />
      ) : null}

      {showGroupedContacts
        ? contactBlocks.map((block) => (
            <ContactBlockDisplay
              key={block.title}
              block={block}
              visibility={lineVisibility}
              iconClassName={iconClassName}
              textClassName={textClassName}
              linkClassName={linkClassName}
            />
          ))
        : null}

      {socialSection}
      {schedulesSection}

      {!grouped && resolvedShowPhone
        ? phones.map((item) => (
            <div key={`${item.label}-${item.phone}`} className="flex items-start gap-3">
              <Phone className={cn('mt-0.5 h-5 w-5 shrink-0', iconClassName)} />
              <div className={cn('text-sm', textClassName)}>
                <p className="text-xs opacity-80">{item.label}</p>
                <a href={phoneHref(item.phone)} className={cn('transition-colors', linkClassName)}>
                  {item.phone}
                </a>
              </div>
            </div>
          ))
        : null}

      {!grouped && resolvedShowEmail
        ? emails.map((item) => (
            <div key={`${item.label}-${item.email}`} className="flex items-start gap-3">
              <Mail className={cn('mt-0.5 h-5 w-5 shrink-0', iconClassName)} />
              <div className={cn('text-sm', textClassName)}>
                <p className="text-xs opacity-80">{item.label}</p>
                <a href={`mailto:${item.email}`} className={cn('transition-colors', linkClassName)}>
                  {item.email}
                </a>
              </div>
            </div>
          ))
        : null}
    </div>
  )
}

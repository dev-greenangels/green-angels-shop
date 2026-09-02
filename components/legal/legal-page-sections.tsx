import { LegalCmsText } from '@/components/legal/legal-cms-text'
import {
  legalBodyTextClassName,
  legalSectionHeadingClassName,
} from '@/lib/legal/storefront-typography'
import { cn } from '@/lib/utils'

export type LegalPageSection = {
  heading: string
  body: string[]
}

export function LegalPageSections({
  sections,
  supportEmail = '',
}: {
  sections: LegalPageSection[]
  supportEmail?: string
}) {
  return (
    <>
      {sections.map((section) => (
        <section key={section.heading} className="mb-8">
          <h2 className={cn('mb-4', legalSectionHeadingClassName)}>{section.heading}</h2>
          <div className={cn(legalBodyTextClassName, 'space-y-4')}>
            {section.body.map((paragraph, index) => (
              <p key={index}>
                <LegalCmsText text={paragraph} supportEmail={supportEmail} />
              </p>
            ))}
          </div>
        </section>
      ))}
    </>
  )
}

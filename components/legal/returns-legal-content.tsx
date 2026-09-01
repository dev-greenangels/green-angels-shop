import type { ReactNode } from 'react'

import { LegalCmsText } from '@/components/legal/legal-cms-text'
import type { LegalDocumentSection, LegalDocumentView } from '@/lib/legal/documents'
import { countLegalCmsInternalLinks } from '@/lib/legal/legal-cms-parse'
import {
  mapReturnsSections,
  splitReturnsDocumentSections,
  type ReturnsCmsVars,
} from '@/lib/legal/returns-cms'
import { cn } from '@/lib/utils'

const contentCardClassName =
  'rounded-2xl border border-border/70 bg-[rgba(232,240,227,0.35)] p-5 shadow-sm md:p-8'

const subsectionClassName =
  'space-y-3 border-t border-border/55 pt-7 first:border-t-0 first:pt-0'

const sectionTitleClassName = 'font-serif text-2xl font-semibold text-foreground'

const subsectionTitleClassName = 'font-serif text-xl font-semibold text-foreground'

const bodyClassName = 'whitespace-pre-line text-sm leading-relaxed text-foreground/90'

function ReturnsCmsParagraph({
  text,
  supportEmail,
  returnAddress,
}: {
  text: string
  supportEmail: string
  returnAddress: string
}) {
  const trimmed = text.trim()
  if (trimmed && trimmed === returnAddress.trim()) {
    return (
      <p className="rounded-lg border border-border/80 bg-background/80 p-4 text-sm font-medium">
        {trimmed}
      </p>
    )
  }

  if (countLegalCmsInternalLinks(text) >= 2) {
    return <LegalCmsText text={text} supportEmail={supportEmail} className="pt-2" />
  }

  return (
    <p className={bodyClassName}>
      <LegalCmsText text={text} supportEmail={supportEmail} />
    </p>
  )
}

function ReturnsCmsSectionBlock({
  section,
  supportEmail,
  returnAddress,
  headingClassName,
  id,
}: {
  section: LegalDocumentSection
  supportEmail: string
  returnAddress: string
  headingClassName: string
  id?: string
}) {
  return (
    <div id={id} className="space-y-4">
      <h2 className={headingClassName}>{section.heading}</h2>
      {section.body.map((paragraph, index) => (
        <ReturnsCmsParagraph
          key={`${section.heading}-${index}`}
          text={paragraph}
          supportEmail={supportEmail}
          returnAddress={returnAddress}
        />
      ))}
    </div>
  )
}

function ReturnsCmsSubsection({
  section,
  supportEmail,
  returnAddress,
}: {
  section: LegalDocumentSection
  supportEmail: string
  returnAddress: string
}) {
  return (
    <div className={subsectionClassName}>
      <h3 className={subsectionTitleClassName}>{section.heading}</h3>
      {section.body.map((paragraph, index) => (
        <ReturnsCmsParagraph
          key={`${section.heading}-${index}`}
          text={paragraph}
          supportEmail={supportEmail}
          returnAddress={returnAddress}
        />
      ))}
    </div>
  )
}

export function ReturnsLegalContent({
  document,
  vars,
  formsSlot,
}: {
  document: LegalDocumentView
  vars: ReturnsCmsVars
  formsSlot: ReactNode
}) {
  const sections = mapReturnsSections(document.sections, vars)
  const { beforeForms, afterForms } = splitReturnsDocumentSections(sections)

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {document.intro ? (
        <p className="text-sm leading-relaxed text-muted-foreground">{document.intro}</p>
      ) : null}

      {beforeForms.length > 0 ? (
        <section id="overview" className={contentCardClassName}>
          {beforeForms.map((section) => (
            <ReturnsCmsSectionBlock
              key={section.heading}
              section={section}
              supportEmail={vars.supportEmail}
              returnAddress={vars.returnAddress}
              headingClassName={sectionTitleClassName}
            />
          ))}
        </section>
      ) : null}

      {formsSlot ? (
        <section id="withdrawal" className={cn(contentCardClassName, 'space-y-8')}>
          {formsSlot}
        </section>
      ) : null}

      {afterForms.length > 0 ? (
        <section id="legal-info" className={cn(contentCardClassName, 'space-y-0')}>
          {afterForms.map((section) => (
            <ReturnsCmsSubsection
              key={section.heading}
              section={section}
              supportEmail={vars.supportEmail}
              returnAddress={vars.returnAddress}
            />
          ))}
        </section>
      ) : null}
    </div>
  )
}

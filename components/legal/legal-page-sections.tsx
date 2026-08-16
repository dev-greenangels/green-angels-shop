export type LegalPageSection = {
  heading: string
  body: string[]
}

export function LegalPageSections({ sections }: { sections: LegalPageSection[] }) {
  return (
    <>
      {sections.map((section) => (
        <section key={section.heading} className="mb-8">
          <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">{section.heading}</h2>
          <div className="text-muted-foreground space-y-4">
            {section.body.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </section>
      ))}
    </>
  )
}

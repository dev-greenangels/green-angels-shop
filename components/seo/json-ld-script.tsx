import { buildOrganizationJsonLd, buildWebsiteJsonLd } from '@/lib/seo/organization-json-ld'

export function JsonLdScript({ data }: { data: Record<string, unknown> | null }) {
  if (!data) return null
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

export function OrganizationJsonLdScripts(props: Parameters<typeof buildOrganizationJsonLd>[0] & { locale: string }) {
  const website = buildWebsiteJsonLd({
    origin: props.origin,
    name: props.name,
    locale: props.locale,
  })
  const organization = buildOrganizationJsonLd(props)
  return (
    <>
      <JsonLdScript data={website} />
      <JsonLdScript data={organization} />
    </>
  )
}

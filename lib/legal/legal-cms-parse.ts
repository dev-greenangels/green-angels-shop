export const LEGAL_CMS_INTERNAL_LINK_PATTERN =
  /\[\[([a-z]+)(?:#([a-z0-9_-]+))?(?:\|([^\]]+))?\]\]/g

export function countLegalCmsInternalLinks(text: string): number {
  return [...text.matchAll(LEGAL_CMS_INTERNAL_LINK_PATTERN)].length
}

/** Soft-sanitize CMS HTML for storefront (no scripts / iframes / inline handlers). */
export function sanitizeCmsHtml(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<\/?iframe\b[^>]*>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/javascript\s*:/gi, '')
}

export function cmsHtmlHasTags(html: string): boolean {
  return /<[a-z][\s\S]*>/i.test(html)
}

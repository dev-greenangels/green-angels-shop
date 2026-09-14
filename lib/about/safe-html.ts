/**
 * Allowlist sanitizer for About CMS body HTML.
 * Keeps only safe tags/attrs; strips scripts, event handlers, and unknown markup.
 */

const ALLOWED_TAGS = new Set([
  'p',
  'br',
  'strong',
  'b',
  'em',
  'i',
  'ul',
  'ol',
  'li',
  'a',
])

function isSafeHref(href: string): boolean {
  const value = href.trim()
  if (!value) return false
  if (value.startsWith('/') || value.startsWith('#')) return true
  if (/^https?:\/\//i.test(value)) return true
  if (/^mailto:/i.test(value)) return true
  return false
}

function escapeText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Soft-sanitize CMS HTML for storefront (allowlist tags only).
 */
export function sanitizeCmsHtml(html: string): string {
  if (!html.trim()) return ''

  // Fast path: plain text / no tags
  if (!/<[a-z][\s\S]*>/i.test(html)) {
    return html
  }

  let output = ''
  const tokenRe = /<!--[\s\S]*?-->|<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>|([^<]+)/g
  let match: RegExpExecArray | null
  const openStack: string[] = []

  while ((match = tokenRe.exec(html)) !== null) {
    if (match[0].startsWith('<!--')) continue

    if (match[3] != null) {
      output += escapeText(match[3])
      continue
    }

    const tagName = (match[1] || '').toLowerCase()
    const isClosing = match[0].startsWith('</')
    const attrsRaw = match[2] || ''

    if (!ALLOWED_TAGS.has(tagName)) {
      continue
    }

    if (tagName === 'br') {
      if (!isClosing) output += '<br />'
      continue
    }

    if (isClosing) {
      const idx = openStack.lastIndexOf(tagName)
      if (idx === -1) continue
      while (openStack.length > idx) {
        const closing = openStack.pop()
        if (closing) output += `</${closing}>`
      }
      continue
    }

    if (tagName === 'a') {
      const hrefMatch = attrsRaw.match(/\bhref\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i)
      const href = (hrefMatch?.[2] ?? hrefMatch?.[3] ?? hrefMatch?.[4] ?? '').trim()
      if (!isSafeHref(href)) continue
      const safeHref = escapeText(href)
      output += `<a href="${safeHref}" rel="noopener noreferrer">`
      openStack.push('a')
      continue
    }

    output += `<${tagName}>`
    openStack.push(tagName)
  }

  while (openStack.length) {
    const closing = openStack.pop()
    if (closing) output += `</${closing}>`
  }

  return output
}

export function cmsHtmlHasTags(html: string): boolean {
  return /<[a-z][\s\S]*>/i.test(html)
}

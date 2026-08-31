const BLOCK_TAGS = new Set(['p', 'h1', 'h2', 'h3', 'h4', 'div', 'li'])

export const RICH_FONT_SIZES = {
  sm: '0.875rem',
  base: '1rem',
  lg: '1.125rem',
  xl: '1.25rem',
} as const

export type RichFontSize = keyof typeof RICH_FONT_SIZES

const LEGACY_FONT_SIZE_MAP: Record<string, RichFontSize> = {
  '1': 'sm',
  '2': 'sm',
  '3': 'base',
  '4': 'lg',
  '5': 'xl',
  '6': 'xl',
  '7': 'xl',
}

export function normalizeRichTextHtml(html: string): string {
  const trimmed = html.trim()
  if (!trimmed) return ''

  const doc = new DOMParser().parseFromString(trimmed, 'text/html')
  const body = doc.body

  body.querySelectorAll('h1,h2,h3,h4').forEach((heading) => {
    const paragraph = doc.createElement('p')
    while (heading.firstChild) paragraph.appendChild(heading.firstChild)
    heading.replaceWith(paragraph)
  })

  body.querySelectorAll('font').forEach((font) => {
    const sizeAttr = font.getAttribute('size')?.trim()
    const mapped = sizeAttr ? LEGACY_FONT_SIZE_MAP[sizeAttr] : undefined
    if (mapped) {
      const span = doc.createElement('span')
      span.dataset.richFontSize = mapped
      span.style.fontSize = RICH_FONT_SIZES[mapped]
      while (font.firstChild) span.appendChild(font.firstChild)
      font.replaceWith(span)
      return
    }
    unwrapElement(font)
  })

  body.querySelectorAll('span').forEach((span) => {
    if (span.dataset.richFontSize) return
    if (span.style.fontSize) {
      span.dataset.richFontSize = inferFontSizeKey(span.style.fontSize) ?? 'base'
      return
    }
    if (span.attributes.length === 0) unwrapElement(span)
  })

  body.querySelectorAll('b').forEach((node) => {
    const strong = doc.createElement('strong')
    strong.innerHTML = node.innerHTML
    node.replaceWith(strong)
  })

  body.querySelectorAll('i').forEach((node) => {
    const em = doc.createElement('em')
    em.innerHTML = node.innerHTML
    node.replaceWith(em)
  })

  body.querySelectorAll('p,div').forEach((el) => {
    if (!el.textContent?.trim() && !el.querySelector('br,img')) {
      el.remove()
    }
  })

  return body.innerHTML.trim()
}

function inferFontSizeKey(fontSize: string): RichFontSize | null {
  const normalized = fontSize.trim().toLowerCase()
  for (const [key, value] of Object.entries(RICH_FONT_SIZES)) {
    if (value === normalized) return key as RichFontSize
  }
  return null
}

function unwrapElement(element: Element) {
  const parent = element.parentNode
  if (!parent) return
  while (element.firstChild) {
    parent.insertBefore(element.firstChild, element)
  }
  parent.removeChild(element)
}

export function findBlockAncestor(node: Node | null, root: HTMLElement | null): HTMLElement | null {
  let current: Node | null = node
  if (current?.nodeType === Node.TEXT_NODE) current = current.parentNode

  while (current && current !== root) {
    if (current instanceof HTMLElement) {
      const tag = current.tagName.toLowerCase()
      if (BLOCK_TAGS.has(tag)) return current
    }
    current = current.parentNode
  }

  return null
}

function isEntireBlockSelected(range: Range, block: HTMLElement): boolean {
  const blockRange = document.createRange()
  blockRange.selectNodeContents(block)
  return (
    range.compareBoundaryPoints(Range.START_TO_START, blockRange) >= 0 &&
    range.compareBoundaryPoints(Range.END_TO_END, blockRange) <= 0 &&
    range.toString().trim() === block.textContent?.trim()
  )
}

function retagBlock(block: HTMLElement, tagName: 'p') {
  if (block.tagName.toLowerCase() === tagName) return block

  const next = document.createElement(tagName)
  while (block.firstChild) next.appendChild(block.firstChild)
  block.replaceWith(next)
  return next
}

export function applyRichTextBlockFormat(root: HTMLElement, tagName: 'p'): void {
  root.focus()
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return

  const range = selection.getRangeAt(0)
  if (!root.contains(range.commonAncestorContainer)) return

  const block = findBlockAncestor(range.commonAncestorContainer, root)

  if (!block) {
    document.execCommand('formatBlock', false, tagName)
    return
  }

  if (range.collapsed || isEntireBlockSelected(range, block)) {
    const next = retagBlock(block, tagName)
    const nextRange = document.createRange()
    nextRange.selectNodeContents(next)
    nextRange.collapse(false)
    selection.removeAllRanges()
    selection.addRange(nextRange)
    return
  }

  const selected = range.extractContents()
  const wrapper = document.createElement(tagName)
  wrapper.appendChild(selected)
  range.insertNode(wrapper)

  if (!block.textContent?.trim()) {
    block.remove()
  }

  const nextRange = document.createRange()
  nextRange.selectNodeContents(wrapper)
  nextRange.collapse(false)
  selection.removeAllRanges()
  selection.addRange(nextRange)
}

export function applyRichTextCommand(
  root: HTMLElement,
  command: 'bold' | 'italic' | 'insertUnorderedList',
): void {
  root.focus()
  document.execCommand(command, false)
}

export function applyRichTextFontSize(root: HTMLElement, size: RichFontSize): void {
  root.focus()
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return

  const range = selection.getRangeAt(0)
  if (!root.contains(range.commonAncestorContainer)) return

  const span = document.createElement('span')
  span.dataset.richFontSize = size
  span.style.fontSize = RICH_FONT_SIZES[size]

  const contents = range.extractContents()
  span.appendChild(contents)
  range.insertNode(span)

  const nextRange = document.createRange()
  nextRange.selectNodeContents(span)
  nextRange.collapse(false)
  selection.removeAllRanges()
  selection.addRange(nextRange)
}

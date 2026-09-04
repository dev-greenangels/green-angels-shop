import type { MerchantFeedItem } from './types'

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function cdataSafe(value: string): string {
  return value.replace(/]]>/g, ']]]]><![CDATA[>')
}

function itemXml(item: MerchantFeedItem): string {
  const lines: string[] = [
    '    <item>',
    `      <g:id>${escapeXml(item.id)}</g:id>`,
    `      <g:title>${escapeXml(item.title)}</g:title>`,
    `      <g:description><![CDATA[${cdataSafe(item.description)}]]></g:description>`,
    `      <g:link>${escapeXml(item.link)}</g:link>`,
    `      <g:image_link>${escapeXml(item.imageLink)}</g:image_link>`,
  ]

  for (const extra of item.additionalImageLinks) {
    lines.push(`      <g:additional_image_link>${escapeXml(extra)}</g:additional_image_link>`)
  }

  lines.push(
    `      <g:availability>${item.availability}</g:availability>`,
    `      <g:price>${escapeXml(item.price)}</g:price>`,
    `      <g:condition>${item.condition}</g:condition>`,
    `      <g:brand>${escapeXml(item.brand)}</g:brand>`,
    `      <g:mpn>${escapeXml(item.mpn)}</g:mpn>`,
    `      <g:item_group_id>${escapeXml(item.itemGroupId)}</g:item_group_id>`,
    `      <g:google_product_category>${escapeXml(item.googleProductCategory)}</g:google_product_category>`,
  )

  if (item.productType) {
    lines.push(`      <g:product_type>${escapeXml(item.productType)}</g:product_type>`)
  }

  for (const opt of item.variantOptions) {
    lines.push(
      '      <g:variant_option>',
      `        <g:name>${escapeXml(opt.name)}</g:name>`,
      `        <g:value>${escapeXml(opt.value)}</g:value>`,
      '      </g:variant_option>',
    )
  }

  lines.push('    </item>')
  return lines.join('\n')
}

export function buildMerchantRssXml(input: {
  title: string
  link: string
  description: string
  items: MerchantFeedItem[]
}): string {
  const body = input.items.map(itemXml).join('\n')
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">',
    '  <channel>',
    `    <title>${escapeXml(input.title)}</title>`,
    `    <link>${escapeXml(input.link)}</link>`,
    `    <description>${escapeXml(input.description)}</description>`,
    body,
    '  </channel>',
    '</rss>',
    '',
  ].join('\n')
}

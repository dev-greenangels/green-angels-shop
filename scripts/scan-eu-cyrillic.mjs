/**
 * READ-ONLY scan of storefront message JSON + optional live feeds for Cyrillic
 * outside the Ukrainian locale.
 *
 *   node scripts/scan-eu-cyrillic.mjs
 *   node scripts/scan-eu-cyrillic.mjs --feeds
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const messagesDir = join(__dirname, '../messages')
const CYR = /[\u0400-\u04FF]/
const locales = ['en', 'sk', 'cs', 'hu', 'de']

function walk(obj, path = '', hits = []) {
  if (typeof obj === 'string') {
    if (CYR.test(obj)) hits.push({ path, value: obj })
    return hits
  }
  if (Array.isArray(obj)) {
    obj.forEach((item, i) => walk(item, `${path}[${i}]`, hits))
    return hits
  }
  if (obj && typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) {
      walk(v, path ? `${path}.${k}` : k, hits)
    }
  }
  return hits
}

console.log('=== Message JSON Cyrillic scan (non-uk) ===')
for (const locale of locales) {
  const data = JSON.parse(readFileSync(join(messagesDir, `${locale}.json`), 'utf8'))
  const hits = walk(data)
  console.log(`${locale}: ${hits.length} hits`)
  for (const hit of hits.slice(0, 20)) {
    console.log(`  ${hit.path}: ${hit.value.slice(0, 100)}`)
  }
}

if (process.argv.includes('--feeds')) {
  const feeds = [
    ['SK', 'https://green-angels.sk/feeds/google/sk.xml'],
    ['CZ', 'https://green-angels.sk/feeds/google/cz.xml'],
    ['HU', 'https://green-angels.hu/feeds/google/hu.xml'],
    ['AT', 'https://green-angels.at/feeds/google/de.xml'],
  ]
  console.log('\n=== Live feed Cyrillic scan ===')
  for (const [label, url] of feeds) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'GreenAngelsCyrillicScan/1.0' } })
      const text = await res.text()
      const matches = [...text.matchAll(/[\u0400-\u04FF]{2,40}/g)].map((m) => m[0])
      const unique = [...new Set(matches)]
      console.log(`${label}: HTTP ${res.status}, unique Cyrillic tokens=${unique.length}`)
      unique.slice(0, 15).forEach((t) => console.log(`  ${t}`))
    } catch (err) {
      console.log(`${label}: error ${err instanceof Error ? err.message : err}`)
    }
  }
}

#!/usr/bin/env node
/**
 * Fail if any backstage useTranslations('ns') key is missing in uk/en/sk.
 * Run: node scripts/check-backstage-i18n.mjs
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const LOCALES = ['uk', 'en', 'sk']

function findDottedKeys(obj, path = '') {
  const bad = []
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return bad
  for (const [k, v] of Object.entries(obj)) {
    const p = path ? `${path}.${k}` : k
    if (k.includes('.')) bad.push(p)
    bad.push(...findDottedKeys(v, p))
  }
  return bad
}

const FLOORS = {
  promoEligibility: 30,
  promoScopePicker: 35,
  productVariantPricing: 35,
  discountRules: 100,
  promotions: 50,
  promoCodes: 40,
  userFlexiPricing: 15,
}
const DYNAMIC = {
  productVariantPricing: ['validity_ACTIVE', 'validity_SCHEDULED', 'validity_EXPIRED'],
  discountRules: [
    'combinationHint_BEST_PRICE',
    'combinationHint_STACK',
    'combinationHint_MAX_OF',
  ],
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    const st = statSync(p)
    if (st.isDirectory()) walk(p, out)
    else if (name.endsWith('.tsx') || name.endsWith('.ts')) out.push(p)
  }
  return out
}

function resolve(ns, data) {
  let cur = data
  for (const part of ns.split('.')) {
    if (!cur || typeof cur !== 'object' || !(part in cur)) return null
    cur = cur[part]
  }
  return cur && typeof cur === 'object' && !Array.isArray(cur) ? cur : null
}

function deepHas(msgs, key) {
  if (Object.prototype.hasOwnProperty.call(msgs, key)) return true
  let cur = msgs
  for (const part of key.split('.')) {
    if (!cur || typeof cur !== 'object' || !(part in cur)) return false
    cur = cur[part]
  }
  return true
}

const files = [
  ...walk(join(ROOT, 'components/backstage')),
  ...walk(join(ROOT, 'app/backstage')),
]

let failed = false
for (const locale of LOCALES) {
  const data = JSON.parse(readFileSync(join(ROOT, 'messages/backstage', `${locale}.json`), 'utf8'))
  const gaps = []

  for (const file of files) {
    const text = readFileSync(file, 'utf8')
    const bindings = [...text.matchAll(/const\s+(\w+)\s*=\s*useTranslations\(\s*'([^']+)'\s*\)/g)]
    for (const [, varName, ns] of bindings) {
      const msgs = resolve(ns, data)
      if (!msgs) {
        gaps.push(`${file}: namespace missing ${ns}`)
        continue
      }
      const re = new RegExp(`(?<![A-Za-z0-9_])${varName}\\(\\s*'([^']+)'`, 'g')
      for (const m of text.matchAll(re)) {
        if (!deepHas(msgs, m[1])) gaps.push(`${file}: ${ns}.${m[1]}`)
      }
    }
  }

  for (const [ns, keys] of Object.entries(DYNAMIC)) {
    const msgs = resolve(ns, data) || {}
    for (const key of keys) {
      if (!deepHas(msgs, key)) gaps.push(`DYNAMIC: ${ns}.${key}`)
    }
  }

  for (const [ns, floor] of Object.entries(FLOORS)) {
    const n = Object.keys(resolve(ns, data) || {}).length
    if (n < floor) gaps.push(`FLOOR: ${ns} has ${n} < ${floor}`)
  }

  const dotted = findDottedKeys(data)
  for (const d of dotted) gaps.push(`DOTTED_KEY: ${d}`)

  if (gaps.length) {
    failed = true
    console.error(`\n[${locale}] ${gaps.length} missing:`)
    for (const g of gaps.slice(0, 50)) console.error(' ', g)
    if (gaps.length > 50) console.error(`  ... +${gaps.length - 50}`)
  } else {
    console.log(`[${locale}] OK`)
  }
}

if (failed) process.exit(1)
console.log('backstage i18n: all locales OK')

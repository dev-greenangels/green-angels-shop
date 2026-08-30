import { stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import sharp from 'sharp'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

/** Footer greens from app/globals.css — hue of #539e53 / #198717 */
const BRAND_HUE = 120

const TARGETS = [
  {
    label: 'sk/logo-header.png',
    input: path.join(root, 'public/branding/sk/logo-header.png'),
    output: path.join(root, 'public/branding/sk/logo-header.png'),
    width: 442,
    height: 126,
  },
  {
    label: 'ua/logo-header.png',
    input: path.join(root, 'public/branding/ua/logo-header.png'),
    output: path.join(root, 'public/branding/ua/logo-header.png'),
    width: 442,
    height: 133,
  },
  {
    label: 'images/logo.png',
    input: path.join(root, 'public/images/logo.png'),
    output: path.join(root, 'public/images/logo.png'),
    width: 442,
    height: 158,
  },
]

function rgbToHsl(r, g, b) {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const delta = max - min
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1))
    if (max === rn) h = ((gn - bn) / delta) % 6
    else if (max === gn) h = (bn - rn) / delta + 2
    else h = (rn - gn) / delta + 4
    h *= 60
    if (h < 0) h += 360
  }

  return { h, s, l }
}

function hslToRgb(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  let rn = 0
  let gn = 0
  let bn = 0

  if (h < 60) [rn, gn, bn] = [c, x, 0]
  else if (h < 120) [rn, gn, bn] = [x, c, 0]
  else if (h < 180) [rn, gn, bn] = [0, c, x]
  else if (h < 240) [rn, gn, bn] = [0, x, c]
  else if (h < 300) [rn, gn, bn] = [x, 0, c]
  else [rn, gn, bn] = [c, 0, x]

  return {
    r: Math.round((rn + m) * 255),
    g: Math.round((gn + m) * 255),
    b: Math.round((bn + m) * 255),
  }
}

function isLeafPixel(r, g, b, a) {
  if (a < 12) return false
  if (r > 245 && g > 245 && b > 245) return false
  const { h, s, l } = rgbToHsl(r, g, b)
  if (l < 0.08) return false
  if (s < 0.08 && l < 0.35) return false
  if (g < 52 && l < 0.24) return false
  return g >= r && g >= b - 8 && h >= 55 && h <= 165
}

function recolorLeaf(r, g, b) {
  const { h, s, l } = rgbToHsl(r, g, b)
  const hueDelta = h - 98
  const targetH = BRAND_HUE + hueDelta * 0.12
  const targetS = Math.max(0.22, Math.min(0.52, s * 0.78 + 0.06))
  const liftedL = Math.max(0.22, Math.min(0.78, 0.22 + (l - 0.1) * 0.66))
  return hslToRgb(targetH, targetS, liftedL)
}

async function processLogo({ label, input, output, width, height }) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true })

  for (let offset = 0; offset < data.length; offset += 4) {
    const r = data[offset]
    const g = data[offset + 1]
    const b = data[offset + 2]
    const a = data[offset + 3]
    if (!isLeafPixel(r, g, b, a)) continue

    const next = recolorLeaf(r, g, b)
    data[offset] = next.r
    data[offset + 1] = next.g
    data[offset + 2] = next.b
  }

  const buffer = await sharp(data, { raw: info })
    .resize(width, height, {
      fit: 'fill',
      kernel: sharp.kernel.lanczos3,
    })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer()

  await writeFile(output, buffer)

  const [sourceMeta, outputMeta, sourceBytes, outputBytes] = await Promise.all([
    sharp(input).metadata(),
    sharp(output).metadata(),
    stat(input).then((s) => s.size),
    stat(output).then((s) => s.size),
  ])

  console.log(
    `${label}: ${sourceMeta.width}x${sourceMeta.height} (${Math.round(sourceBytes / 1024)} KB) -> ${outputMeta.width}x${outputMeta.height} (${Math.round(outputBytes / 1024)} KB)`,
  )
}

async function main() {
  const skSource = path.join(root, 'public/branding/sk/logo-header-candidate.png')
  const skMaster = path.join(root, 'public/branding/sk/logo-header.png')

  try {
    await stat(skSource)
    await writeFile(skMaster, await sharp(skSource).png().toBuffer())
    console.log('Promoted sk/logo-header-candidate.png -> sk/logo-header.png')
  } catch {
    console.log('Processing sk/logo-header.png in place')
    await processLogo(TARGETS[0])
  }

  await processLogo(TARGETS[1])
  await processLogo(TARGETS[2])
}

await main()

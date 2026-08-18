import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import sharp from 'sharp'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const publicDir = path.join(root, 'public')
const brandGreen = '#123f2b'
const socialBackground = '#f7f9f4'

const paths = {
  uaSource: path.join(root, 'scripts/branding/masters/ua-source.jpg'),
  skSource: path.join(publicDir, 'images/logo-green-int-white-proportions.png'),
  ua: path.join(publicDir, 'branding/ua'),
  sk: path.join(publicDir, 'branding/sk'),
}

function smoothstep(edge0, edge1, value) {
  const t = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

async function removeJpegBackground(input, extract) {
  const { data, info } = await sharp(input)
    .extract(extract)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const background = { r: 247, g: 249, b: 244 }
  const pixelCount = info.width * info.height
  const isBackground = new Uint8Array(pixelCount)
  const queue = new Int32Array(pixelCount)
  let queueStart = 0
  let queueEnd = 0

  const enqueue = (x, y) => {
    if (x < 0 || x >= info.width || y < 0 || y >= info.height) return
    const pixel = y * info.width + x
    if (isBackground[pixel]) return
    const offset = pixel * 4
    const distance = Math.max(
      Math.abs(data[offset] - background.r),
      Math.abs(data[offset + 1] - background.g),
      Math.abs(data[offset + 2] - background.b),
    )
    if (distance > 30) return
    isBackground[pixel] = 1
    queue[queueEnd++] = pixel
  }

  for (let x = 0; x < info.width; x += 1) {
    enqueue(x, 0)
    enqueue(x, info.height - 1)
  }
  for (let y = 0; y < info.height; y += 1) {
    enqueue(0, y)
    enqueue(info.width - 1, y)
  }

  while (queueStart < queueEnd) {
    const pixel = queue[queueStart++]
    const x = pixel % info.width
    const y = Math.floor(pixel / info.width)
    enqueue(x - 1, y)
    enqueue(x + 1, y)
    enqueue(x, y - 1)
    enqueue(x, y + 1)
  }

  for (let pixel = 0; pixel < pixelCount; pixel += 1) {
    const offset = pixel * 4
    data[offset + 3] = isBackground[pixel] ? 0 : 255
  }

  return sharp(data, { raw: info })
    .png()
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 8 })
    .toBuffer()
}

async function makeWhiteLogo(input) {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  for (let offset = 0; offset < data.length; offset += 4) {
    const sourceAlpha = data[offset + 3]
    const lightestChannel = Math.min(data[offset], data[offset + 1], data[offset + 2])
    const ink = 255 - lightestChannel
    const whiteAlpha = Math.round(sourceAlpha * smoothstep(28, 96, ink))
    data[offset] = 255
    data[offset + 1] = 255
    data[offset + 2] = 255
    data[offset + 3] = whiteAlpha
  }

  return sharp(data, { raw: info }).png({ compressionLevel: 9 }).toBuffer()
}

async function keepLargestConnectedComponent(input) {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const pixelCount = info.width * info.height
  const visited = new Uint8Array(pixelCount)
  const queue = new Int32Array(pixelCount)
  let largest = []

  for (let start = 0; start < pixelCount; start += 1) {
    if (visited[start] || data[start * 4 + 3] === 0) continue
    let queueStart = 0
    let queueEnd = 0
    const component = []
    visited[start] = 1
    queue[queueEnd++] = start

    while (queueStart < queueEnd) {
      const pixel = queue[queueStart++]
      component.push(pixel)
      const x = pixel % info.width
      const y = Math.floor(pixel / info.width)
      for (const [nextX, nextY] of [
        [x - 1, y],
        [x + 1, y],
        [x, y - 1],
        [x, y + 1],
      ]) {
        if (nextX < 0 || nextX >= info.width || nextY < 0 || nextY >= info.height) continue
        const next = nextY * info.width + nextX
        if (visited[next] || data[next * 4 + 3] === 0) continue
        visited[next] = 1
        queue[queueEnd++] = next
      }
    }

    if (component.length > largest.length) largest = component
  }

  const keep = new Uint8Array(pixelCount)
  for (const pixel of largest) keep[pixel] = 1
  for (let pixel = 0; pixel < pixelCount; pixel += 1) {
    if (!keep[pixel]) data[pixel * 4 + 3] = 0
  }

  return sharp(data, { raw: info })
    .png()
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 1 })
    .toBuffer()
}

async function transparentCanvas(width, height, composites) {
  return sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(composites)
    .png({ compressionLevel: 9 })
    .toBuffer()
}

async function socialCard(logo, { tagline } = {}) {
  const composites = [
    {
      input: await sharp(logo).resize(1080, 308, { fit: 'fill' }).png().toBuffer(),
      left: 60,
      top: tagline ? 96 : 161,
    },
  ]

  if (tagline) {
    const taglineMetadata = await sharp(tagline).metadata()
    const taglineWidth = Math.min(taglineMetadata.width ?? 740, 760)
    const renderedTagline = await sharp(tagline)
      .resize({ width: taglineWidth, withoutEnlargement: true })
      .png()
      .toBuffer()
    composites.push({
      input: renderedTagline,
      left: Math.round((1200 - taglineWidth) / 2),
      top: 454,
    })
  }

  return sharp({
    create: {
      width: 1200,
      height: 630,
      channels: 3,
      background: socialBackground,
    },
  })
    .composite(composites)
    .jpeg({ quality: 92, chromaSubsampling: '4:4:4', mozjpeg: true })
    .toBuffer()
}

function createIco(pngFrames) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(pngFrames.length, 4)
  const directory = Buffer.alloc(16 * pngFrames.length)
  let offset = header.length + directory.length

  pngFrames.forEach(({ size, png }, index) => {
    const entry = index * 16
    directory.writeUInt8(size === 256 ? 0 : size, entry)
    directory.writeUInt8(size === 256 ? 0 : size, entry + 1)
    directory.writeUInt8(0, entry + 2)
    directory.writeUInt8(0, entry + 3)
    directory.writeUInt16LE(1, entry + 4)
    directory.writeUInt16LE(32, entry + 6)
    directory.writeUInt32LE(png.length, entry + 8)
    directory.writeUInt32LE(offset, entry + 12)
    offset += png.length
  })

  return Buffer.concat([header, directory, ...pngFrames.map(({ png }) => png)])
}

async function createCompactBrandMark(logo) {
  const metadata = await sharp(logo).metadata()
  const width = metadata.width ?? 0
  const height = metadata.height ?? 0
  const verticalTrim = Math.max(2, Math.round(height * 0.015))
  const croppedHeight = height - verticalTrim * 2
  const cropWidth = Math.min(width, Math.round(croppedHeight * 1.05))
  return sharp(logo)
    .extract({
      left: Math.round((width - cropWidth) / 2),
      top: verticalTrim,
      width: cropWidth,
      height: croppedHeight,
    })
    .png()
    .toBuffer()
}

async function renderSquareMark(mark, size, insetRatio = 0.03) {
  const inset = Math.round(size * insetRatio)
  const rendered = await sharp(mark)
    .resize(size - inset * 2, size - inset * 2, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer()
  return transparentCanvas(size, size, [{ input: rendered, left: inset, top: inset }])
}

async function writeIcons(directory, logo) {
  const mark = await createCompactBrandMark(logo)
  const faviconFrames = []
  for (const size of [16, 32, 48]) {
    const png = await renderSquareMark(mark, size, 0.06)
    faviconFrames.push({ size, png })
    await writeFile(path.join(directory, `favicon-${size}.png`), png)
  }
  await writeFile(path.join(directory, 'favicon.ico'), createIco(faviconFrames))

  for (const size of [192, 512]) {
    await writeFile(path.join(directory, `icon-${size}.png`), await renderSquareMark(mark, size))
  }

  const appleMark = await sharp(mark)
    .resize(154, 154, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer()
  await sharp({
    create: { width: 180, height: 180, channels: 4, background: brandGreen },
  })
    .composite([{ input: appleMark, left: 13, top: 13 }])
    .png({ compressionLevel: 9 })
    .toFile(path.join(directory, 'apple-icon.png'))

  for (const size of [192, 512]) {
    const inset = Math.round(size * 0.18)
    const maskableMark = await sharp(mark)
      .resize(size - inset * 2, size - inset * 2, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer()
    await sharp({
      create: { width: size, height: size, channels: 4, background: brandGreen },
    })
      .composite([
        {
          input: maskableMark,
          left: inset,
          top: inset,
        },
      ])
      .png({ compressionLevel: 9 })
      .toFile(path.join(directory, `icon-maskable-${size}.png`))
  }
}

async function main() {
  await Promise.all([mkdir(paths.ua, { recursive: true }), mkdir(paths.sk, { recursive: true })])

  const [uaEmblemSource, uaTagline, skEmblem] = await Promise.all([
    removeJpegBackground(paths.uaSource, { left: 50, top: 70, width: 1100, height: 405 }),
    removeJpegBackground(paths.uaSource, { left: 240, top: 475, width: 760, height: 80 }),
    sharp(paths.skSource)
      .extract({ left: 22, top: 43, width: 1491, height: 425 })
      .png()
      .toBuffer(),
  ])

  const cleanUaEmblem = await keepLargestConnectedComponent(uaEmblemSource)
  const uaEmblem = await sharp(cleanUaEmblem)
    .resize(1080, 308, { fit: 'fill', kernel: sharp.kernel.lanczos3 })
    .png({ compressionLevel: 9 })
    .toBuffer()
  const uaHeader = await transparentCanvas(1200, 360, [{ input: uaEmblem, left: 60, top: 26 }])
  const uaFooterColor = await transparentCanvas(1200, 430, [
    { input: uaEmblem, left: 60, top: 10 },
    { input: uaTagline, left: 220, top: 336 },
  ])
  const [uaFooter, skFooter] = await Promise.all([
    makeWhiteLogo(uaFooterColor),
    makeWhiteLogo(skEmblem),
  ])

  await Promise.all([
    writeFile(path.join(paths.ua, 'logo-header.png'), uaHeader),
    writeFile(path.join(paths.ua, 'logo-footer.png'), uaFooter),
    writeFile(path.join(paths.sk, 'logo-header.png'), skEmblem),
    writeFile(path.join(paths.sk, 'logo-footer.png'), skFooter),
    writeFile(path.join(paths.ua, 'social-share.jpg'), await socialCard(uaEmblem, { tagline: uaTagline })),
    writeFile(path.join(paths.sk, 'social-share.jpg'), await socialCard(skEmblem)),
    writeFile(path.join(publicDir, 'images/logo.png'), uaFooterColor),
    writeFile(path.join(publicDir, 'images/whiteLogo.png'), uaFooter),
    writeFile(path.join(publicDir, 'images/logo-green-int-transparent.png'), skEmblem),
    writeFile(path.join(publicDir, 'images/logo-green-int-white.png'), skFooter),
    writeIcons(paths.ua, uaEmblem),
    writeIcons(paths.sk, skEmblem),
  ])

  console.log('Generated UA and SK branding assets from canonical geometry.')
}

await main()

import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

function buildImageRemotePatterns() {
  /** @type {import('next').NextConfig['images']['remotePatterns']} */
  const patterns = [
    { protocol: 'http', hostname: 'localhost', pathname: '/**' },
    { protocol: 'http', hostname: '127.0.0.1', pathname: '/**' },
  ]

  const mediaUrl = process.env.NEXT_PUBLIC_MEDIA_BASE_URL?.trim()
  if (mediaUrl) {
    try {
      const parsed = new URL(mediaUrl)
      patterns.push({
        protocol: parsed.protocol.replace(':', ''),
        hostname: parsed.hostname,
        pathname: '/**',
      })
    } catch {
      // ignore invalid URL
    }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (siteUrl) {
    try {
      const parsed = new URL(siteUrl)
      if (!patterns.some((p) => p.hostname === parsed.hostname)) {
        patterns.push({
          protocol: parsed.protocol.replace(':', ''),
          hostname: parsed.hostname,
          pathname: '/**',
        })
      }
    } catch {
      // ignore invalid URL
    }
  }

  return patterns
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Local LAN hosts used in this workspace (Next blocks unknown origins in dev).
  allowedDevOrigins: [
    '192.168.0.62',
    '192.168.0.63',
    '192.168.0.243',
    '127.0.0.1',
    'localhost',
  ],
  // Next 16.2 Turbopack soft-nav hangs on /backstage; hide noisy indicator.
  devIndicators: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: buildImageRemotePatterns(),
  },
  // Serve /uploads from public/uploads (symlink → ../../data/uploads).
  // Do NOT rewrite through /api/uploads — that buffered media in Node and OOM'd next dev (~8GB).
  async headers() {
    return [
      {
        source: '/uploads/categories/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, must-revalidate',
          },
        ],
      },
      {
        source: '/uploads/products/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
}

export default withNextIntl(nextConfig)

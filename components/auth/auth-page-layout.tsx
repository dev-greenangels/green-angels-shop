
import { AuthBackButton } from '@/components/auth/auth-back-button'
import { BrandLogo } from '@/components/brand-logo'
import { Link } from '@/i18n/navigation'

export function AuthPageLayout({
  backHref,
  brandAlt,
  heroTitle,
  heroBody,
  heroExtra,
  title,
  subtitle,
  children,
}: {
  backHref: string
  brandAlt: string
  heroTitle: string
  heroBody: string
  heroExtra?: React.ReactNode
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-[100dvh] min-h-screen flex-col overflow-x-hidden lg:flex-row">
      <div className="hidden flex-1 items-center justify-center bg-primary p-12 lg:flex">
        <div className="max-w-md text-center text-primary-foreground">
          <div className="mx-auto mb-8 flex justify-center">
            <BrandLogo
              alt={brandAlt}
              variant="onDark"
              width={180}
              height={56}
              imgClassName="max-h-16 w-auto md:max-h-20"
            />
          </div>
          <h2 className="mb-4 font-serif text-3xl font-bold">{heroTitle}</h2>
          <p className="mb-8 text-lg opacity-90">{heroBody}</p>
          {heroExtra}
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-secondary via-background to-accent"
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-0 opacity-5" aria-hidden>
          <div className="absolute top-16 left-6 h-48 w-48 rounded-full bg-primary blur-3xl sm:left-10 sm:h-64 sm:w-64" />
          <div className="absolute right-6 bottom-16 h-56 w-56 rounded-full bg-primary blur-3xl sm:right-10 sm:h-80 sm:w-80" />
        </div>

        <div className="relative flex flex-1 flex-col px-4 pt-[max(1rem,env(safe-area-inset-top))] py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-8 lg:justify-center lg:px-8 lg:py-12 xl:px-12">
          <div className="mx-auto w-full min-w-0 max-w-sm">
            <AuthBackButton fallbackHref={backHref} className="mb-4" />

            <div className="mb-6 flex justify-center sm:mb-8">
              <Link href="/" className="inline-flex">
                <BrandLogo
                  alt={brandAlt}
                  width={220}
                  height={72}
                  className="justify-center"
                  imgClassName="max-h-14 w-auto object-center sm:max-h-16 sm:max-w-[min(260px,78vw)]"
                />
              </Link>
            </div>

            <div className="mb-6 text-center sm:mb-8">
              <h1 className="mb-2 font-serif text-2xl font-bold text-foreground sm:text-3xl">
                {title}
              </h1>
              <p className="text-sm text-muted-foreground sm:text-base">{subtitle}</p>
            </div>

            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

import Link from 'next/link'
import { Leaf, MapPin, Phone, Mail, Clock } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-foreground text-primary">
                <Leaf className="h-5 w-5" />
              </div>
              <span className="font-serif text-xl font-semibold">Зелені Янголи</span>
            </div>
            <p className="text-sm text-primary-foreground/80">
              Професійний розсадник рослин. Вирощуємо якісний посадковий матеріал 
              з любов&apos;ю та турботою з 2010 року.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-serif text-lg font-semibold mb-4">Каталог</h3>
            <nav className="space-y-2">
              <Link
                href="/catalog/conifers"
                className="block text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors"
              >
                Хвойні рослини
              </Link>
              <Link
                href="/catalog/deciduous"
                className="block text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors"
              >
                Листяні дерева
              </Link>
              <Link
                href="/catalog/perennials"
                className="block text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors"
              >
                Багаторічники
              </Link>
              <Link
                href="/catalog/shrubs"
                className="block text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors"
              >
                Чагарники
              </Link>
            </nav>
          </div>

          {/* Info */}
          <div>
            <h3 className="font-serif text-lg font-semibold mb-4">Інформація</h3>
            <nav className="space-y-2">
              <Link
                href="/shipping"
                className="block text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors"
              >
                Доставка та оплата
              </Link>
              <Link
                href="/faq"
                className="block text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors"
              >
                Часті питання
              </Link>
              <Link
                href="/terms"
                className="block text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors"
              >
                Умови використання
              </Link>
              <Link
                href="/admin"
                className="block text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors"
              >
                Адміністрування
              </Link>
            </nav>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-serif text-lg font-semibold mb-4">Контакти</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-primary-foreground/80">
                  Київська обл., м. Вишгород,<br />вул. Садова, 15
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 flex-shrink-0" />
                <a
                  href="tel:+380671234567"
                  className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                >
                  +380 (67) 123-45-67
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 flex-shrink-0" />
                <a
                  href="mailto:info@zeleni-yanholy.ua"
                  className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                >
                  info@zeleni-yanholy.ua
                </a>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-primary-foreground/80">
                  Пн-Пт: 9:00 - 18:00<br />
                  Сб: 9:00 - 15:00
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-12 pt-8 text-center text-sm text-primary-foreground/60">
          <p>&copy; {new Date().getFullYear()} Зелені Янголи. Усі права захищено.</p>
        </div>
      </div>
    </footer>
  )
}

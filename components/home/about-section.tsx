import { CheckCircle2 } from 'lucide-react'

const features = [
  'Власне виробництво посадкового матеріалу',
  'Контроль якості на кожному етапі вирощування',
  'Професійні консультації з догляду',
  'Гарантія приживлюваності рослин',
  'Доставка по всій Україні',
  'Оптові та роздрібні продажі',
]

export function AboutSection() {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-6">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground">
              Чому обирають<br />
              <span className="text-primary">Зелені Янголи?</span>
            </h2>
            
            <p className="text-lg text-muted-foreground leading-relaxed">
              Наш розсадник спеціалізується на вирощуванні якісного посадкового матеріалу 
              вже понад 10 років. Ми пишаємося тим, що кожна рослина вирощується з любов&apos;ю 
              та турботою в екологічно чистому регіоні Закарпатської області.
            </p>
            
            <div className="grid sm:grid-cols-2 gap-3">
              {features.map((feature) => (
                <div key={feature} className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-sm text-foreground">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-secondary text-center">
              <p className="font-serif text-4xl md:text-5xl font-bold text-primary mb-2">20+</p>
              <p className="text-muted-foreground">років досвіду</p>
            </div>
            <div className="p-6 rounded-2xl bg-secondary text-center">
              <p className="font-serif text-4xl md:text-5xl font-bold text-primary mb-2">500+</p>
              <p className="text-muted-foreground">видів рослин</p>
            </div>
            <div className="p-6 rounded-2xl bg-secondary text-center">
              <p className="font-serif text-4xl md:text-5xl font-bold text-primary mb-2">5000+</p>
              <p className="text-muted-foreground">задоволених клієнтів</p>
            </div>
            <div className="p-6 rounded-2xl bg-secondary text-center">
              <p className="font-serif text-4xl md:text-5xl font-bold text-primary mb-2">98%</p>
              <p className="text-muted-foreground">приживлюваність</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

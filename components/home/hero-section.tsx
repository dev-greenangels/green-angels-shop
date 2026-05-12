import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Truck, Shield, Leaf } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-secondary via-background to-accent">
      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-primary blur-3xl" />
        <div className="absolute bottom-20 right-10 w-80 h-80 rounded-full bg-primary blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-16 md:py-24 lg:py-32 relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Leaf className="h-4 w-4" />
              Професійний розсадник з 2010 року
            </div>
            
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight text-balance">
              Створіть сад<br />
              <span className="text-primary">вашої мрії</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Понад 170 сортів хвойних, листяних дерев та багаторічників. 
              Якісний посадковий матеріал для професіоналів та любителів.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button size="lg" asChild className="text-base">
                <Link href="/catalog">
                  Перейти до каталогу
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-base">
                <Link href="/catalog/conifers">
                  Хвойні рослини
                </Link>
              </Button>
            </div>
          </div>

          {/* Image placeholder */}
          <div className="relative hidden lg:block">
            <div className="aspect-square max-w-lg mx-auto relative overflow-hidden rounded-2xl">
              <Image
                src="/images/hero-plants.jpg"
                alt="植物花園"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 pt-16 border-t border-border/50">
          <div className="flex items-center gap-4 p-4 rounded-xl bg-card/50">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Доставка по Україні</h3>
              <p className="text-sm text-muted-foreground">Нова Пошта, Укрпошта</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 p-4 rounded-xl bg-card/50">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Гарантія якості</h3>
              <p className="text-sm text-muted-foreground">Заміна протягом 14 днів</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 p-4 rounded-xl bg-card/50">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary">
              <Leaf className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Власне виробництво</h3>
              <p className="text-sm text-muted-foreground">Контроль на кожному етапі</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

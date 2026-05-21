import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import { HeroSection } from '@/components/home/hero-section'
import { CategoriesSection } from '@/components/home/categories-section'
import { NewArrivalsSection } from '@/components/home/new-arrivals-section'
import { AboutSection } from '@/components/home/about-section'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1">
        <HeroSection />
        <CategoriesSection />
        <NewArrivalsSection />
        <AboutSection />
      </main>
      <Footer />
    </div>
  )
}

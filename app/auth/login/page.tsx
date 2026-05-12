'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Leaf, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Simulate login - in real app, this would call an API
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Redirect to home or admin based on email
    if (formData.email.includes('admin')) {
      router.push('/admin')
    } else {
      router.push('/')
    }
    
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="mx-auto w-full max-w-sm">
          <Link href="/" className="flex items-center gap-2 mb-8">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground">
              <Leaf className="h-5 w-5" />
            </div>
            <span className="font-serif text-xl font-semibold text-foreground">
              Зелені Янголи
            </span>
          </Link>

          <h1 className="font-serif text-3xl font-bold text-foreground mb-2">
            Вхід в акаунт
          </h1>
          <p className="text-muted-foreground mb-8">
            Введіть свої дані для входу в особистий кабінет
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="ваш@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Пароль</Label>
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-primary hover:underline"
                >
                  Забули пароль?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Введіть пароль"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={formData.remember}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, remember: checked as boolean })
                }
              />
              <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
                Запам&apos;ятати мене
              </Label>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? 'Вхід...' : 'Увійти'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-8">
            Ще немає акаунту?{' '}
            <Link href="/auth/register" className="text-primary hover:underline font-medium">
              Зареєструватися
            </Link>
          </p>
        </div>
      </div>

      {/* Right side - Image/Brand */}
      <div className="hidden lg:flex flex-1 bg-primary items-center justify-center p-12">
        <div className="max-w-md text-center text-primary-foreground">
          <Leaf className="h-20 w-20 mx-auto mb-8 opacity-80" />
          <h2 className="font-serif text-3xl font-bold mb-4">
            Ласкаво просимо
          </h2>
          <p className="text-lg opacity-90 mb-8">
            Увійдіть, щоб отримати доступ до історії замовлень, 
            збережених товарів та персональних рекомендацій.
          </p>
          <div className="flex justify-center gap-8 text-sm opacity-80">
            <div>
              <p className="text-2xl font-bold">170+</p>
              <p>сортів рослин</p>
            </div>
            <div>
              <p className="text-2xl font-bold">5000+</p>
              <p>клієнтів</p>
            </div>
            <div>
              <p className="text-2xl font-bold">14</p>
              <p>років досвіду</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
